<script setup lang="ts">
import {
    IconAlertTriangle,
    IconBell,
    IconCalendarDue,
    IconCircleCheck,
    IconEraser,
    IconEye,
    IconHistory,
    IconPencil,
    IconPlayerPlay,
    IconPlus,
    IconRefresh,
    IconRotateClockwise,
    IconSend,
    IconTrash,
    IconUserCheck,
    IconX,
} from "@tabler/icons-vue"
import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import type { DataTableHeader } from "vuetify"
import DatePicker from "../../components/DatePicker.vue"
import TreeViewField from "../../components/TreeViewField.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import { getHttpErrorMessage } from "../../core/httpError"
import { hasRole } from "../../core/papeis"
import { unidadesTree } from "../../core/unidades"
import acompanhamentoService from "../../services/acompanhamentoService"
import { userInfo } from "../../services/keycloakService"
import {
    StatusAcompanhamentoProcesso,
    type AcompanhamentoFilters,
    type AcompanhamentoIndicadores,
    type AcompanhamentoProcessoResumo,
    type AnalistaCarga,
    type HistoricoAcompanhamento,
    type NotificacaoAcompanhamento,
    type PrazoRevisao,
    type UsuarioResumo,
} from "../../types/acompanhamento"
import { FuncaoKeycloak, Papel } from "../../types/enums/papel"

const router = useRouter()

type LocalFilters = Omit<AcompanhamentoFilters, "unidadeId" | "status" | "analistaId"> & {
    status: StatusAcompanhamentoProcesso | "" | null
    analistaId: number | null
}

const tab = ref("processos")
const processos = ref<AcompanhamentoProcessoResumo[]>([])
const indicadores = ref<AcompanhamentoIndicadores>({
    aguardandoAnalise: 0,
    emAnalise: 0,
    emAjuste: 0,
    concluidos: 0,
    pendenteRevisao: 0,
})
const analistas = ref<AnalistaCarga[]>([])
const notificacoes = ref<NotificacaoAcompanhamento[]>([])
const prazos = ref<PrazoRevisao[]>([])
const historico = ref<HistoricoAcompanhamento[]>([])
const loadingProcessos = ref(false)
const loadingApoio = ref(false)
const loadingDialog = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalProcessos = ref(0)
const unidadeId = ref<{ id: number | null }>({ id: null })
const dialogPrazo = ref(false)
const dialogRemoverPrazo = ref(false)
const loadingPrazo = ref(false)
const prazoParaRemocao = ref<PrazoRevisao | null>(null)
const processoSelecionado = ref<AcompanhamentoProcessoResumo | null>(null)
const dialogHistorico = ref(false)
const prazoRevisaoForm = ref<{ id: number | null; anoReferencia: number | null; prazo: string }>({
    id: null,
    anoReferencia: new Date().getFullYear(),
    prazo: "",
})

const filters = ref<LocalFilters>({
    nome: "",
    dataInicial: "",
    dataFinal: "",
    status: "",
    analistaId: null,
})

const headers: DataTableHeader<AcompanhamentoProcessoResumo>[] = [
    { title: "Processo", value: "nome", minWidth: "220px" },
    { title: "Unidade", value: "unidadeProcessoSigla", minWidth: "120px" },
    { title: "Analistas", value: "analistaResponsavel", minWidth: "120px" },
    { title: "Status", value: "statusAcompanhamento", minWidth: "160px" },
    { title: "Envio", value: "enviadoParaAnaliseEm", minWidth: "140px" },
    { title: "Prazo", value: "prazoAjuste", minWidth: "160px" },
    { title: "Ações", value: "actions", align: "end", sortable: false, minWidth: "150px" },
]

const analistasHeaders: DataTableHeader<AnalistaCarga>[] = [
    { title: "Analista", value: "nome", minWidth: "220px" },
    { title: "E-mail", value: "email", minWidth: "240px" },
    { title: "Atribuídos", value: "processosAtribuidos", align: "end" },
    { title: "Em análise", value: "processosEmAnalise", align: "end" },
    { title: "Aguardando", value: "processosAguardandoAnalise", align: "end" },
]

const prazosHeaders: DataTableHeader<PrazoRevisao>[] = [
    { title: "Ano", value: "anoReferencia" },
    { title: "Prazo de envio", value: "prazo" },
    { title: "Atraso após", value: "limiteAtraso" },
    { title: "Responsável", value: "responsavel" },
    { title: "Atualização", value: "atualizadoEm" },
    { title: "Situação", value: "situacao" },
    { title: "Ações", value: "actions", align: "end", sortable: false },
]

const notificacoesHeaders: DataTableHeader<NotificacaoAcompanhamento>[] = [
    { title: "Notificação", value: "titulo", minWidth: "260px" },
    { title: "Processo", value: "processoNome", minWidth: "220px" },
    { title: "Data", value: "criadoEm", minWidth: "160px" },
    { title: "Status", value: "lida" },
    { title: "Ações", value: "actions", align: "end", sortable: false },
]

const statusOptions = [
    { title: "Rascunho", value: StatusAcompanhamentoProcesso.RASCUNHO },
    { title: "Aguardando análise", value: StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE },
    { title: "Em análise", value: StatusAcompanhamentoProcesso.EM_ANALISE },
    { title: "Em ajuste", value: StatusAcompanhamentoProcesso.EM_AJUSTE },
    { title: "Concluído", value: StatusAcompanhamentoProcesso.CONCLUIDO },
    { title: "Pendente de revisão", value: StatusAcompanhamentoProcesso.PENDENTE_REVISAO },
]

const analistaOptions = computed(() =>
    analistas.value.map((analista) => ({
        title: analista.nome,
        value: analista.id,
    }))
)

const hasActiveFilters = computed(
    () =>
        Boolean(filters.value.nome?.trim()) ||
        Boolean(filters.value.dataInicial) ||
        Boolean(filters.value.dataFinal) ||
        Boolean(unidadeId.value.id) ||
        Boolean(filters.value.status) ||
        Boolean(filters.value.analistaId)
)

const notificacoesNaoLidas = computed(
    () => notificacoes.value.filter((notificacao) => !notificacao.lida).length
)

const podeDistribuirProcessos = computed(
    () =>
        hasRole(userInfo.value.roles, Papel.SECGOV) &&
        hasRole(userInfo.value.roles, FuncaoKeycloak.GESTOR)
)

const prazoRevisaoEmEdicao = computed(() => prazoRevisaoForm.value.id !== null)

let debounceTimer: number | undefined

onMounted(async () => {
    await carregarApoio()
    await carregarProcessos({ page: 1, itemsPerPage: pageSize.value })
})

watch(
    [
        () => filters.value.nome,
        () => filters.value.dataInicial,
        () => filters.value.dataFinal,
        () => filters.value.status,
        () => filters.value.analistaId,
        () => unidadeId.value.id,
    ],
    () => {
        if (debounceTimer) globalThis.clearTimeout(debounceTimer)
        debounceTimer = globalThis.setTimeout(() => {
            void carregarProcessos({ page: 1, itemsPerPage: pageSize.value })
        }, 350)
    }
)

async function carregarApoio(): Promise<void> {
    loadingApoio.value = true
    try {
        const [indicadoresData, analistasData, notificacoesData, prazosData] = await Promise.all([
            acompanhamentoService.indicadores(),
            acompanhamentoService.listarAnalistas(),
            acompanhamentoService.listarNotificacoes(),
            acompanhamentoService.listarPrazosRevisao(),
        ])
        indicadores.value = indicadoresData
        analistas.value = analistasData
        notificacoes.value = notificacoesData
        prazos.value = prazosData
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao carregar dados de acompanhamento."), "error")
    } finally {
        loadingApoio.value = false
    }
}

async function carregarProcessos(options: { page: number; itemsPerPage: number }): Promise<void> {
    loadingProcessos.value = true
    try {
        const page = options.page || 1
        const itemsPerPage = options.itemsPerPage || pageSize.value
        const response = await acompanhamentoService.listarProcessos(page, itemsPerPage, {
            nome: filters.value.nome,
            dataInicial: filters.value.dataInicial,
            dataFinal: filters.value.dataFinal,
            unidadeId: unidadeId.value.id,
            status: filters.value.status || "",
            analistaId: filters.value.analistaId,
        })
        processos.value = response.content
        totalProcessos.value = response.totalElements
        currentPage.value = page
        pageSize.value = itemsPerPage
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao carregar processos."), "error")
    } finally {
        loadingProcessos.value = false
    }
}

function limparFiltros(): void {
    filters.value = {
        nome: "",
        dataInicial: "",
        dataFinal: "",
        status: "",
        analistaId: null,
    }
    unidadeId.value = { id: null }
}

function statusLabel(status: StatusAcompanhamentoProcesso | null): string {
    const labels: Record<StatusAcompanhamentoProcesso, string> = {
        RASCUNHO: "Rascunho",
        AGUARDANDO_ANALISE: "Aguardando análise",
        EM_ANALISE: "Em análise",
        EM_AJUSTE: "Em ajuste",
        CONCLUIDO: "Concluído",
        PENDENTE_REVISAO: "Pendente de revisão",
    }
    return status ? labels[status] : ""
}

function statusColor(status: StatusAcompanhamentoProcesso | null): string {
    const colors: Record<StatusAcompanhamentoProcesso, string> = {
        RASCUNHO: "grey",
        AGUARDANDO_ANALISE: "blue",
        EM_ANALISE: "indigo",
        EM_AJUSTE: "orange",
        CONCLUIDO: "green",
        PENDENTE_REVISAO: "purple",
    }
    return status ? colors[status] : "grey"
}

function analistasDoProcesso(processo: AcompanhamentoProcessoResumo): UsuarioResumo[] {
    return [processo.analistaResponsavel, processo.segundoAnalista].filter(
        (analista): analista is UsuarioResumo => Boolean(analista)
    )
}

function iniciaisAnalista(nome: string | null | undefined): string {
    const iniciais = nome
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0))
        .join("")
        .toLocaleUpperCase("pt-BR")

    return iniciais || "?"
}

function formatarDataHora(dataIso: string | null): string {
    if (!dataIso) return "-"
    const data = new Date(dataIso)
    return `${data.toLocaleDateString("pt-BR")} ${data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`
}

function formatarData(dataIso: string | null): string {
    if (!dataIso) return "-"
    return new Date(`${dataIso}T00:00:00`).toLocaleDateString("pt-BR")
}

function unidadeProcessoTexto(processo: AcompanhamentoProcessoResumo): string {
    return processo.setorSigla || processo.setorNome || processo.unidadeSigla || processo.unidadeNome || "-"
}

function unidadeProcessoNome(processo: AcompanhamentoProcessoResumo): string | null {
    return processo.setorNome || processo.unidadeNome
}

function tipoMovimentacaoLabel(tipo: string): string {
    return tipo
        .toLowerCase()
        .split("_")
        .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" ")
}

async function visualizarProcesso(processo: AcompanhamentoProcessoResumo): Promise<void> {
    await router.push({
        name: "AcompanhamentoProcesso",
        params: { processoId: String(processo.id) },
        query: { modo: "acompanhamento" },
    })
}

async function abrirHistorico(processo: AcompanhamentoProcessoResumo): Promise<void> {
    processoSelecionado.value = processo
    dialogHistorico.value = true
    loadingDialog.value = true
    try {
        historico.value = await acompanhamentoService.listarHistorico(processo.id)
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao carregar histórico."), "error")
    } finally {
        loadingDialog.value = false
    }
}

function abrirCadastroPrazo(): void {
    limparFormularioPrazo()
    dialogPrazo.value = true
}

function fecharDialogPrazo(): void {
    if (loadingPrazo.value) return
    dialogPrazo.value = false
    limparFormularioPrazo()
}

function atualizarVisibilidadeDialogPrazo(aberto: boolean): void {
    if (!aberto && !loadingPrazo.value) {
        limparFormularioPrazo()
    }
}

async function salvarPrazoRevisao(): Promise<void> {
    const anoReferencia = Number(prazoRevisaoForm.value.anoReferencia)

    if (!Number.isInteger(anoReferencia) || anoReferencia < 1900 || anoReferencia > 2200) {
        showMessage("Informe um ano de referência válido.", "info")
        return
    }

    if (!prazoRevisaoForm.value.prazo) {
        showMessage("Informe o prazo para envio.", "info")
        return
    }

    loadingPrazo.value = true
    try {
        const payload = {
            anoReferencia,
            prazo: prazoRevisaoForm.value.prazo,
        }

        if (prazoRevisaoForm.value.id !== null) {
            await acompanhamentoService.atualizarPrazoRevisao(prazoRevisaoForm.value.id, payload)
            showMessage("Prazo de envio atualizado com sucesso.", "success")
        } else {
            await acompanhamentoService.salvarPrazoRevisao(payload)
            showMessage("Prazo de envio salvo com sucesso.", "success")
        }

        dialogPrazo.value = false
        limparFormularioPrazo()
        await carregarApoio()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao salvar prazo de envio."), "error")
    } finally {
        loadingPrazo.value = false
    }
}

function editarPrazoRevisao(prazo: PrazoRevisao): void {
    prazoRevisaoForm.value = {
        id: prazo.id,
        anoReferencia: prazo.anoReferencia,
        prazo: prazo.prazo,
    }
    dialogPrazo.value = true
}

function limparFormularioPrazo(): void {
    prazoRevisaoForm.value = {
        id: null,
        anoReferencia: new Date().getFullYear(),
        prazo: "",
    }
}

function abrirRemocaoPrazo(prazo: PrazoRevisao): void {
    prazoParaRemocao.value = prazo
    dialogRemoverPrazo.value = true
}

function fecharDialogRemocaoPrazo(): void {
    if (loadingPrazo.value) return
    dialogRemoverPrazo.value = false
    prazoParaRemocao.value = null
}

function atualizarVisibilidadeDialogRemocaoPrazo(aberto: boolean): void {
    if (!aberto && !loadingPrazo.value) {
        prazoParaRemocao.value = null
    }
}

async function confirmarRemocaoPrazo(): Promise<void> {
    const prazo = prazoParaRemocao.value
    if (!prazo) return

    loadingPrazo.value = true
    try {
        await acompanhamentoService.removerPrazoRevisao(prazo.id)
        if (prazoRevisaoForm.value.id === prazo.id) {
            limparFormularioPrazo()
        }
        dialogRemoverPrazo.value = false
        prazoParaRemocao.value = null
        showMessage("Prazo de envio removido com sucesso.", "success")
        await carregarApoio()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao remover prazo de envio."), "error")
    } finally {
        loadingPrazo.value = false
    }
}

async function abrirNotificacao(notificacao: NotificacaoAcompanhamento): Promise<void> {
    try {
        await acompanhamentoService.marcarNotificacaoComoLida(notificacao.id)
        await carregarApoio()
    } catch (error) {
        console.error(error)
    }

    if (notificacao.destino === "DOCUMENTOS") {
        await router.push({ name: "Documentos" })
        return
    }

    if (notificacao.destino === "HISTORICO") {
        let processo = processos.value.find((item) => item.id === notificacao.processoId)
        if (!processo && notificacao.processoId) {
            processo = await acompanhamentoService.detalhar(notificacao.processoId)
        }
        if (!processo) return
        await abrirHistorico(processo)
        return
    }

    if (notificacao.processoId) {
        await visualizarProcesso({
            id: notificacao.processoId,
        } as AcompanhamentoProcessoResumo)
    }
}

function validarDataFinal(value: string): boolean | string {
    if (!filters.value.dataInicial || !value) return true
    return value >= filters.value.dataInicial || "Data final não pode ser anterior à inicial."
}
</script>

<template>
    <VContainer fluid class="acompanhamento-page">
        <div class="page-header">
            <div>
                <h2>Acompanhamento</h2>
                <h4>Fila de análise, revisões, prazos e retornos dos processos.</h4>
            </div>
            <div class="page-header-actions">
                <VBtn
                    v-if="podeDistribuirProcessos"
                    color="primary"
                    variant="flat"
                    @click="router.push({ name: 'DistribuicaoProcessos' })"
                >
                    <IconUserCheck size="18" />
                    Distribuir processos
                </VBtn>
                <VBtn variant="outlined" :loading="loadingApoio" @click="carregarApoio">
                    <IconRefresh size="18" />
                    Atualizar
                </VBtn>
            </div>
        </div>

        <div class="summary-grid">
            <VCard class="summary-card">
                <IconSend class="summary-icon blue" />
                <div class="summary-content">
                    <span>Aguardando</span>
                    <strong>{{ indicadores.aguardandoAnalise }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card">
                <IconPlayerPlay class="summary-icon indigo" />
                <div class="summary-content">
                    <span>Em análise</span>
                    <strong>{{ indicadores.emAnalise }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card">
                <IconAlertTriangle class="summary-icon orange" />
                <div class="summary-content">
                    <span>Em ajuste</span>
                    <strong>{{ indicadores.emAjuste }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card">
                <IconRotateClockwise class="summary-icon purple" />
                <div class="summary-content">
                    <span>Revisão</span>
                    <strong>{{ indicadores.pendenteRevisao }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card">
                <IconCircleCheck class="summary-icon green" />
                <div class="summary-content">
                    <span>Concluídos</span>
                    <strong>{{ indicadores.concluidos }}</strong>
                </div>
            </VCard>
        </div>

        <VTabs v-model="tab" color="primary" class="tabs">
            <VTab value="processos">Processos</VTab>
            <VTab value="analistas">Analistas</VTab>
            <VTab value="prazos">Prazos</VTab>
            <VTab value="notificacoes">
                Notificações
                <VBadge
                    v-if="notificacoesNaoLidas"
                    color="error"
                    :content="notificacoesNaoLidas"
                    inline
                />
            </VTab>
        </VTabs>

        <VWindow v-model="tab">
            <VWindowItem value="processos">
                <VCard class="filter-card">
                    <div class="filter-field name-field">
                        Busca por nome
                        <VTextField
                            v-model="filters.nome"
                            density="compact"
                            prepend-inner-icon="Search"
                            hide-details
                            variant="solo"
                            bg-color="hsl(0,0%,95%)"
                            placeholder="Digite o nome do processo"
                        />
                    </div>
                    <div class="filter-field date-field">
                        Data inicial
                        <DatePicker v-model="filters.dataInicial" hide-details />
                    </div>
                    <div class="filter-field date-field">
                        Data final
                        <DatePicker
                            v-model="filters.dataFinal"
                            :min="filters.dataInicial"
                            hide-details
                            :rules="[validarDataFinal as (value: string | null | undefined) => string | boolean]"
                        />
                    </div>
                    <div class="filter-field select-field">
                        Unidade
                        <TreeViewField
                            v-model="unidadeId"
                            placeholder="Selecione"
                            bg-color="hsl(0,0%,95%)"
                            color="none"
                            border="none"
                            :hide-details="true"
                            :items="unidadesTree"
                            density="compact"
                            :max-chars="24"
                        />
                    </div>
                    <div class="filter-field select-field">
                        Status
                        <VSelect
                            v-model="filters.status"
                            :items="statusOptions"
                            density="compact"
                            hide-details
                            clearable
                            variant="solo"
                            bg-color="hsl(0,0%,95%)"
                        />
                    </div>
                    <div class="filter-field select-field">
                        Analista
                        <VSelect
                            v-model="filters.analistaId"
                            :items="analistaOptions"
                            density="compact"
                            hide-details
                            clearable
                            variant="solo"
                            bg-color="hsl(0,0%,95%)"
                        />
                    </div>
                    <div class="filter-actions">
                        <VBtn v-if="hasActiveFilters" variant="outlined" @click="limparFiltros">
                            <IconEraser size="18" />
                            Limpar
                        </VBtn>
                    </div>
                </VCard>

                <VDataTableServer
                    :headers="headers"
                    :items="processos"
                    :loading="loadingProcessos"
                    :items-length="totalProcessos"
                    :items-per-page="pageSize"
                    :page="currentPage"
                    class="custom-table"
                    no-data-text="Nenhum processo encontrado."
                    @update:options="carregarProcessos"
                >
                    <template #[`item.unidadeProcessoSigla`]="{ item }">
                        <VTooltip v-if="unidadeProcessoNome(item)" :text="unidadeProcessoNome(item) ?? ''" location="top">
                            <template #activator="{ props }">
                                <span v-bind="props" class="acronym-cell">
                                    {{ unidadeProcessoTexto(item) }}
                                </span>
                            </template>
                        </VTooltip>
                        <span v-else class="acronym-cell">{{ unidadeProcessoTexto(item) }}</span>
                    </template>
                    <template #[`item.analistaResponsavel`]="{ item }">
                        <div class="analysts-cell">
                            <template v-if="analistasDoProcesso(item).length">
                                <VTooltip
                                    v-for="analista in analistasDoProcesso(item)"
                                    :key="analista.id"
                                    :text="analista.nome"
                                    location="top"
                                >
                                    <template #activator="{ props }">
                                        <span
                                            v-bind="props"
                                            class="analyst-avatar"
                                            :aria-label="analista.nome"
                                        >
                                            {{ iniciaisAnalista(analista.nome) }}
                                        </span>
                                    </template>
                                </VTooltip>
                            </template>
                            <span v-else class="empty-analyst">-</span>
                        </div>
                    </template>
                    <template #[`item.statusAcompanhamento`]="{ item }">
                        <VChip
                            size="small"
                            :color="statusColor(item.statusAcompanhamento)"
                            variant="tonal"
                        >
                            {{ statusLabel(item.statusAcompanhamento) }}
                        </VChip>
                    </template>
                    <template #[`item.enviadoParaAnaliseEm`]="{ item }">
                        {{ formatarDataHora(item.enviadoParaAnaliseEm) }}
                    </template>
                    <template #[`item.prazoAjuste`]="{ item }">
                        <VChip
                            v-if="item.prazoAjuste"
                            size="small"
                            :color="item.prazoAjusteVencido ? 'red' : 'orange'"
                            variant="tonal"
                        >
                            {{ formatarData(item.prazoAjuste) }}
                        </VChip>
                        <div v-else-if="item.envioPendente && item.prazoEnvio" class="deadline-cell">
                            <VChip
                                size="small"
                                :color="item.envioAtrasado ? 'red' : 'orange'"
                                variant="tonal"
                            >
                                <IconAlertTriangle
                                    v-if="item.envioAtrasado"
                                    size="15"
                                    class="deadline-icon"
                                />
                                {{ item.envioAtrasado ? "Envio atrasado" : "Envio pendente" }}
                            </VChip>
                            <small>
                                {{
                                    item.envioAtrasado
                                        ? `Limite ${formatarData(item.limiteAtrasoPrazoEnvio)}`
                                        : `Prazo ${formatarData(item.prazoEnvio)}`
                                }}
                            </small>
                        </div>
                        <span v-else>-</span>
                    </template>
                    <template #[`item.actions`]="{ item }">
                        <div class="table-actions">
                            <VTooltip text="Visualizar processo" location="top">
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        icon
                                        size="small"
                                        variant="outlined"
                                        @click="visualizarProcesso(item)"
                                    >
                                        <IconEye size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>

                            <VTooltip text="Histórico" location="top">
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        icon
                                        size="small"
                                        variant="outlined"
                                        @click="abrirHistorico(item)"
                                    >
                                        <IconHistory size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>

                        </div>
                    </template>
                </VDataTableServer>
            </VWindowItem>

            <VWindowItem value="analistas">
                <VDataTable
                    :headers="analistasHeaders"
                    :items="analistas"
                    :loading="loadingApoio"
                    class="custom-table"
                    no-data-text="Nenhum analista encontrado."
                />
            </VWindowItem>

            <VWindowItem value="prazos">
                <div class="deadlines-toolbar">
                    <div class="deadlines-heading">
                        <span class="deadlines-heading-icon">
                            <IconCalendarDue size="20" />
                        </span>
                        <div>
                            <h3>Prazos de envio</h3>
                            <small>{{ prazos.length }} {{ prazos.length === 1 ? "ano configurado" : "anos configurados" }}</small>
                        </div>
                    </div>
                    <VBtn color="primary" :disabled="loadingApoio" @click="abrirCadastroPrazo">
                        <IconPlus size="18" />
                        Novo prazo
                    </VBtn>
                </div>

                <VDataTable
                    :headers="prazosHeaders"
                    :items="prazos"
                    :loading="loadingApoio"
                    class="custom-table"
                    no-data-text="Nenhum prazo cadastrado."
                >
                    <template #[`item.anoReferencia`]="{ item }">
                        <VChip size="small" color="primary" variant="tonal">
                            {{ item.anoReferencia }}
                        </VChip>
                    </template>
                    <template #[`item.prazo`]="{ item }">
                        <span class="date-value">{{ formatarData(item.prazo) }}</span>
                    </template>
                    <template #[`item.limiteAtraso`]="{ item }">
                        <span class="date-value">{{ formatarData(item.limiteAtraso) }}</span>
                    </template>
                    <template #[`item.responsavel`]="{ item }">
                        {{ item.responsavel?.nome ?? "-" }}
                    </template>
                    <template #[`item.atualizadoEm`]="{ item }">
                        {{ formatarDataHora(item.atualizadoEm) }}
                    </template>
                    <template #[`item.situacao`]="{ item }">
                        <VChip
                            size="small"
                            :color="item.prazoAtrasoVencido ? 'red' : item.prazoVencido ? 'orange' : 'green'"
                            variant="tonal"
                        >
                            {{ item.prazoAtrasoVencido ? "Atraso vigente" : item.prazoVencido ? "Prazo vencido" : "Regular" }}
                        </VChip>
                    </template>
                    <template #[`item.actions`]="{ item }">
                        <div class="table-actions">
                            <VTooltip text="Editar prazo" location="top">
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        icon
                                        size="small"
                                        variant="outlined"
                                        @click="editarPrazoRevisao(item)"
                                    >
                                        <IconPencil size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>
                            <VTooltip text="Remover prazo" location="top">
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        icon
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        @click="abrirRemocaoPrazo(item)"
                                    >
                                        <IconTrash size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>
                        </div>
                    </template>
                </VDataTable>
            </VWindowItem>

            <VWindowItem value="notificacoes">
                <VDataTable
                    :headers="notificacoesHeaders"
                    :items="notificacoes"
                    :loading="loadingApoio"
                    class="custom-table"
                    no-data-text="Nenhuma notificação encontrada."
                >
                    <template #[`item.titulo`]="{ item }">
                        <div class="notification-cell">
                            <IconBell size="20" :class="item.lida ? 'muted-icon' : 'active-icon'" />
                            <div>
                                <strong>{{ item.titulo }}</strong>
                                <span>{{ item.descricao }}</span>
                            </div>
                        </div>
                    </template>
                    <template #[`item.criadoEm`]="{ item }">
                        {{ formatarDataHora(item.criadoEm) }}
                    </template>
                    <template #[`item.lida`]="{ item }">
                        <VChip size="small" :color="item.lida ? 'grey' : 'primary'" variant="tonal">
                            {{ item.lida ? "Lida" : "Nova" }}
                        </VChip>
                    </template>
                    <template #[`item.actions`]="{ item }">
                        <VBtn icon size="small" variant="outlined" @click="abrirNotificacao(item)">
                            <IconEye size="18" />
                        </VBtn>
                    </template>
                </VDataTable>
            </VWindowItem>
        </VWindow>

        <VDialog
            v-model="dialogPrazo"
            max-width="520"
            :persistent="loadingPrazo"
            @update:model-value="atualizarVisibilidadeDialogPrazo"
        >
            <VCard class="deadline-dialog-card">
                <div class="deadline-dialog-header">
                    <div class="deadline-dialog-title">
                        <span class="deadline-dialog-icon">
                            <IconCalendarDue size="20" />
                        </span>
                        <h3>{{ prazoRevisaoEmEdicao ? "Editar prazo" : "Novo prazo" }}</h3>
                    </div>
                    <VBtn
                        icon
                        variant="text"
                        aria-label="Fechar modal de prazo"
                        :disabled="loadingPrazo"
                        @click="fecharDialogPrazo"
                    >
                        <IconX size="20" />
                    </VBtn>
                </div>

                <div class="deadline-form-grid">
                    <div class="filter-field">
                        Ano de referência
                        <VTextField
                            v-model.number="prazoRevisaoForm.anoReferencia"
                            type="number"
                            min="1900"
                            max="2200"
                            density="compact"
                            hide-details
                            variant="solo"
                            bg-color="hsl(0,0%,95%)"
                        />
                    </div>
                    <div class="filter-field">
                        Prazo para envio
                        <DatePicker v-model="prazoRevisaoForm.prazo" hide-details />
                    </div>
                </div>

                <div class="deadline-dialog-actions">
                    <VBtn variant="outlined" :disabled="loadingPrazo" @click="fecharDialogPrazo">
                        Cancelar
                    </VBtn>
                    <VBtn color="primary" :loading="loadingPrazo" @click="salvarPrazoRevisao">
                        <IconCalendarDue size="18" />
                        {{ prazoRevisaoEmEdicao ? "Salvar alterações" : "Cadastrar prazo" }}
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <VDialog
            v-model="dialogRemoverPrazo"
            max-width="460"
            :persistent="loadingPrazo"
            @update:model-value="atualizarVisibilidadeDialogRemocaoPrazo"
        >
            <VCard class="deadline-dialog-card">
                <div class="deadline-dialog-header">
                    <div class="deadline-dialog-title">
                        <span class="deadline-dialog-icon danger">
                            <IconTrash size="20" />
                        </span>
                        <h3>Excluir prazo</h3>
                    </div>
                    <VBtn
                        icon
                        variant="text"
                        aria-label="Fechar confirmação de exclusão"
                        :disabled="loadingPrazo"
                        @click="fecharDialogRemocaoPrazo"
                    >
                        <IconX size="20" />
                    </VBtn>
                </div>

                <div class="deadline-delete-box">
                    <strong>{{ prazoParaRemocao?.anoReferencia ?? "-" }}</strong>
                    <span>Prazo {{ formatarData(prazoParaRemocao?.prazo ?? null) }}</span>
                </div>

                <div class="deadline-dialog-actions">
                    <VBtn
                        variant="outlined"
                        :disabled="loadingPrazo"
                        @click="fecharDialogRemocaoPrazo"
                    >
                        Cancelar
                    </VBtn>
                    <VBtn color="error" :loading="loadingPrazo" @click="confirmarRemocaoPrazo">
                        <IconTrash size="18" />
                        Excluir
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <VDialog v-model="dialogHistorico" max-width="880">
            <VCard class="dialog-card">
                <div class="dialog-header">
                    <h3>Histórico do processo</h3>
                    <VBtn icon variant="text" @click="dialogHistorico = false">
                        <IconX size="20" />
                    </VBtn>
                </div>
                <VProgressLinear v-if="loadingDialog" indeterminate color="primary" />
                <div class="history-list">
                    <div v-for="item in historico" :key="item.id" class="history-item">
                        <div>
                            <strong>{{ tipoMovimentacaoLabel(item.tipo) }}</strong>
                            <span>{{ formatarDataHora(item.criadoEm) }}</span>
                        </div>
                        <p>
                            {{ statusLabel(item.statusAnterior) || "-" }} →
                            {{ statusLabel(item.statusNovo) || "-" }}
                        </p>
                        <small>
                            {{ item.usuario?.nome ?? "Sistema" }}
                            <template v-if="item.observacao"> · {{ item.observacao }}</template>
                        </small>
                    </div>
                </div>
            </VCard>
        </VDialog>

    </VContainer>
</template>

<style scoped>
.acompanhamento-page {
    min-height: 100%;
    padding: 24px;
    background: #f5f7fb;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
}

.page-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}

.page-header h2,
.page-header h4 {
    padding: 0;
}

.page-header h4 {
    color: #4b5563;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
}

.summary-card {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 86px;
    gap: 12px;
    padding: 14px;
    border: var(--border);
    border-radius: 8px;
    box-shadow: none;
}

.summary-content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    gap: 2px;
    text-align: center;
}

.summary-content span {
    color: #4b5563;
    font-size: 13px;
    line-height: 1.25;
}

.summary-content strong {
    color: #111827;
    font-size: 26px;
    line-height: 1;
}

.summary-icon {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    padding: 7px;
    border-radius: 8px;
    background: #eef2ff;
}

.blue {
    color: #2563eb;
}

.indigo {
    color: #4f46e5;
}

.orange {
    color: #ea580c;
}

.purple {
    color: #7c3aed;
}

.red {
    color: #dc2626;
}

.tabs {
    margin-bottom: 12px;
    border-bottom: var(--border);
}

.filter-card {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    border: var(--border);
    border-radius: 8px;
    box-shadow: none;
}

.deadlines-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
    padding: 14px 16px;
    border: var(--border);
    border-radius: 8px;
    background: #ffffff;
}

.deadlines-heading {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
}

.deadlines-heading-icon,
.deadline-dialog-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    border-radius: 8px;
    background: #eef2ff;
    color: #2563eb;
}

.deadline-dialog-icon.danger {
    background: #fef2f2;
    color: #dc2626;
}

.deadlines-heading h3,
.deadline-dialog-title h3 {
    margin: 0;
    color: #111827;
    font-size: 18px;
    font-weight: 650;
    line-height: 1.2;
}

.deadlines-heading small {
    display: block;
    margin-top: 2px;
    color: #4b5563;
    font-size: 13px;
    line-height: 1.2;
}

.filter-field {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 6px;
    color: #213547;
    font-size: 14px;
    text-align: start;
}

.name-field {
    flex: 2 1 260px;
}

.date-field,
.select-field {
    flex: 1 1 170px;
}

.filter-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
}

.custom-table {
    border: var(--border);
    border-radius: 8px;
    box-shadow: none;
}

.custom-table :deep(.v-table__wrapper) {
    overflow-x: auto;
}

.table-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    white-space: nowrap;
}

.table-actions .v-btn {
    width: 38px;
    height: 38px;
    border-radius: 8px;
}

.acronym-cell {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
}

.analysts-cell {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: 6px;
}

.analyst-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    border: 1px solid #bfdbfe;
    border-radius: 50%;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    text-transform: uppercase;
    cursor: default;
}

.empty-analyst {
    color: #64748b;
    font-size: 13px;
}

.deadline-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    min-width: 128px;
}

.deadline-cell small {
    color: #4b5563;
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
}

.deadline-icon {
    margin-right: 4px;
}

.date-value {
    color: #111827;
    font-weight: 500;
}

.deadline-dialog-card {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 20px !important;
    border: var(--border);
    border-radius: 8px !important;
    background: #ffffff;
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18) !important;
}

.deadline-dialog-header,
.deadline-dialog-title,
.deadline-dialog-actions {
    display: flex;
    align-items: center;
}

.deadline-dialog-header {
    justify-content: space-between;
    gap: 12px;
}

.deadline-dialog-title {
    min-width: 0;
    gap: 12px;
}

.deadline-form-grid {
    display: grid;
    grid-template-columns: minmax(130px, 0.6fr) minmax(180px, 1fr);
    gap: 12px;
}

.deadline-delete-box {
    display: grid;
    gap: 4px;
    padding: 14px;
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fef2f2;
}

.deadline-delete-box strong {
    color: #991b1b;
    font-size: 20px;
    line-height: 1.1;
}

.deadline-delete-box span {
    color: #7f1d1d;
    font-size: 14px;
}

.deadline-dialog-actions {
    justify-content: flex-end;
    gap: 10px;
}

.notification-cell span {
    color: #4b5563;
    font-size: 13px;
}

.dialog-card {
    padding: 18px;
    border-radius: 8px;
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.dialog-header h3 {
    margin: 0;
}

.history-item span,
.history-item small {
    color: #4b5563;
    font-size: 13px;
}

.history-list {
    display: grid;
    gap: 10px;
    max-height: 60vh;
    overflow: auto;
}

.history-item {
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
}

.history-item div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.history-item p {
    margin: 4px 0;
    padding: 0;
}

.notification-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-cell div {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.active-icon {
    color: #2563eb;
}

.muted-icon {
    color: #9ca3af;
}

@media (max-width: 760px) {
    .page-header,
    .filter-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .filter-actions {
        width: 100%;
        margin-left: 0;
    }

    .deadlines-toolbar,
    .deadline-dialog-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .deadline-form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
