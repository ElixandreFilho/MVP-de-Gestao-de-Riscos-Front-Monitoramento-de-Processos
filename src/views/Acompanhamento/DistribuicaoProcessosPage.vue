<script setup lang="ts">
import {
    IconArrowLeft,
    IconCheck,
    IconEraser,
    IconEye,
    IconPlayerPlay,
    IconRefresh,
    IconSend,
    IconUserCheck,
    IconUserCircle,
    IconUserMinus,
    IconUserPlus,
    IconX,
} from "@tabler/icons-vue"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import type { DataTableHeader } from "vuetify"
import { showMessage } from "../../components/snackbar/SnackbarState"
import { getHttpErrorMessage } from "../../core/httpError"
import acompanhamentoService from "../../services/acompanhamentoService"
import {
    StatusAcompanhamentoProcesso,
    type AcompanhamentoProcessoResumo,
    type AnalistaCarga,
} from "../../types/acompanhamento"

const router = useRouter()

const processos = ref<AcompanhamentoProcessoResumo[]>([])
const analistas = ref<AnalistaCarga[]>([])
const loading = ref(false)
const busca = ref("")
const statusFiltro = ref<StatusAcompanhamentoProcesso | "" | null>("")
const analistaFiltro = ref<number | null>(null)
const dialogVinculo = ref(false)
const processoEmEdicao = ref<AcompanhamentoProcessoResumo | null>(null)
const quantidadeAnalistasModal = ref<1 | 2>(1)
const primeiroAnalistaSelecionadoModal = ref<number | null>(null)
const segundoAnalistaSelecionadoModal = ref<number | null>(null)

const headers: DataTableHeader<AcompanhamentoProcessoResumo>[] = [
    { title: "Processo", value: "nome", minWidth: "240px" },
    { title: "Unidade", value: "unidadeProcessoSigla", minWidth: "120px" },
    { title: "Status", value: "statusAcompanhamento", minWidth: "160px" },
    {
        title: "Vínculo dos analistas",
        value: "vinculoAnalista",
        minWidth: "430px",
        sortable: false,
    },
]

const statusOptions = [
    { title: "Aguardando análise", value: StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE },
    { title: "Em análise", value: StatusAcompanhamentoProcesso.EM_ANALISE },
]

const quantidadeAnalistasOptions = [
    { title: "1 analista", value: 1 },
    { title: "2 analistas", value: 2 },
]

const analistaOptions = computed(() =>
    analistas.value.map((analista) => ({
        title: analista.nome,
        value: analista.id,
        subtitle: `${analista.processosAtribuidos} processo${
            analista.processosAtribuidos === 1 ? "" : "s"
        } atribuído${analista.processosAtribuidos === 1 ? "" : "s"}`,
    }))
)

const indicadores = computed(() => ({
    aguardando: processos.value.filter(
        (processo) => processo.statusAcompanhamento === StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE
    ).length,
    emAnalise: processos.value.filter(
        (processo) => processo.statusAcompanhamento === StatusAcompanhamentoProcesso.EM_ANALISE
    ).length,
    semAnalista: processos.value.filter((processo) => !processo.analistaResponsavel).length,
    comSegundoAnalista: processos.value.filter((processo) => processo.segundoAnalista).length,
    distribuidos: processos.value.filter((processo) => processo.analistaResponsavel).length,
}))

const processosFiltrados = computed(() => {
    const termo = busca.value.trim().toLowerCase()

    return processos.value.filter((processo) => {
        const textoBusca = [
            processo.nome,
            processo.unidadeNome,
            processo.setorNome,
            processo.analistaResponsavel?.nome,
            processo.segundoAnalista?.nome,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

        const matchesBusca = !termo || textoBusca.includes(termo)
        const matchesStatus = !statusFiltro.value || processo.statusAcompanhamento === statusFiltro.value
        const matchesAnalista =
            !analistaFiltro.value ||
            processo.analistaResponsavel?.id === analistaFiltro.value ||
            processo.segundoAnalista?.id === analistaFiltro.value

        return matchesBusca && matchesStatus && matchesAnalista
    })
})

const hasActiveFilters = computed(
    () => Boolean(busca.value.trim()) || Boolean(statusFiltro.value) || Boolean(analistaFiltro.value)
)

onMounted(async () => {
    await carregarDados()
})

async function carregarDados(): Promise<void> {
    loading.value = true
    try {
        const [analistasData, aguardando, emAnalise] = await Promise.all([
            acompanhamentoService.listarAnalistas(),
            acompanhamentoService.listarProcessos(1, 1000, {
                status: StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE,
            }),
            acompanhamentoService.listarProcessos(1, 1000, {
                status: StatusAcompanhamentoProcesso.EM_ANALISE,
            }),
        ])

        analistas.value = analistasData
        processos.value = [...aguardando.content, ...emAnalise.content]
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao carregar distribuição de processos."), "error")
    } finally {
        loading.value = false
    }
}

function limparFiltros(): void {
    busca.value = ""
    statusFiltro.value = ""
    analistaFiltro.value = null
}

function iniciaisAnalista(nome: string | null | undefined): string {
    const partesNome = nome?.trim().split(/\s+/).filter(Boolean) ?? []
    if (!partesNome.length) return ""

    return partesNome
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("")
}

function unidadeProcessoTexto(processo: AcompanhamentoProcessoResumo): string {
    return processo.setorSigla || processo.setorNome || processo.unidadeSigla || processo.unidadeNome || "-"
}

function unidadeProcessoNome(processo: AcompanhamentoProcessoResumo): string | null {
    return processo.setorNome || processo.unidadeNome
}

const primeiroAnalistaModalSelecionado = computed(
    () =>
        analistaOptions.value.find((analista) => analista.value === primeiroAnalistaSelecionadoModal.value) ??
        null
)

const segundoAnalistaModalSelecionado = computed(
    () =>
        analistaOptions.value.find((analista) => analista.value === segundoAnalistaSelecionadoModal.value) ??
        null
)

const segundoAnalistaHabilitado = computed(() => quantidadeAnalistasModal.value === 2)

const vinculoModalAlterado = computed(
    () =>
        primeiroAnalistaSelecionadoModal.value !==
            (processoEmEdicao.value?.analistaResponsavel?.id ?? null) ||
        (segundoAnalistaHabilitado.value
            ? segundoAnalistaSelecionadoModal.value
            : null) !== (processoEmEdicao.value?.segundoAnalista?.id ?? null)
)

const analistasModalRepetidos = computed(
    () =>
        Boolean(primeiroAnalistaSelecionadoModal.value) &&
        Boolean(segundoAnalistaSelecionadoModal.value) &&
        primeiroAnalistaSelecionadoModal.value === segundoAnalistaSelecionadoModal.value
)

const podeSalvarVinculoModal = computed(() => {
    if (!primeiroAnalistaSelecionadoModal.value || !vinculoModalAlterado.value) {
        return false
    }

    if (!segundoAnalistaHabilitado.value) {
        return true
    }

    return Boolean(segundoAnalistaSelecionadoModal.value) && !analistasModalRepetidos.value
})

function abrirModalVinculo(processo: AcompanhamentoProcessoResumo): void {
    processoEmEdicao.value = processo
    quantidadeAnalistasModal.value = processo.segundoAnalista ? 2 : 1
    primeiroAnalistaSelecionadoModal.value = processo.analistaResponsavel?.id ?? null
    segundoAnalistaSelecionadoModal.value = processo.segundoAnalista?.id ?? null
    dialogVinculo.value = true
}

function fecharModalVinculo(): void {
    if (loading.value) return

    dialogVinculo.value = false
    processoEmEdicao.value = null
    quantidadeAnalistasModal.value = 1
    primeiroAnalistaSelecionadoModal.value = null
    segundoAnalistaSelecionadoModal.value = null
}

async function salvarVinculoAnalista(): Promise<void> {
    if (!processoEmEdicao.value) return

    const analistaResponsavelId = primeiroAnalistaSelecionadoModal.value
    const segundoAnalistaId = segundoAnalistaHabilitado.value
        ? segundoAnalistaSelecionadoModal.value
        : null

    if (!analistaResponsavelId) {
        showMessage("Selecione o primeiro analista.", "info")
        return
    }

    if (segundoAnalistaHabilitado.value && !segundoAnalistaId) {
        showMessage("Selecione o segundo analista.", "info")
        return
    }

    if (analistasModalRepetidos.value) {
        showMessage("Selecione analistas diferentes.", "info")
        return
    }

    if (!vinculoModalAlterado.value) {
        showMessage("Nenhuma alteração para salvar.", "info")
        return
    }

    loading.value = true
    try {
        await acompanhamentoService.atribuirAnalista(processoEmEdicao.value.id, {
            analistaResponsavelId,
            segundoAnalistaId,
        })
        showMessage("Processo distribuído com sucesso.", "success")
        dialogVinculo.value = false
        processoEmEdicao.value = null
        quantidadeAnalistasModal.value = 1
        primeiroAnalistaSelecionadoModal.value = null
        segundoAnalistaSelecionadoModal.value = null
        await carregarDados()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao distribuir processo."), "error")
    } finally {
        loading.value = false
    }
}

async function desvincularAnalista(): Promise<void> {
    if (!processoEmEdicao.value?.analistaResponsavel) {
        showMessage("Este processo não possui primeiro analista vinculado.", "info")
        return
    }

    loading.value = true
    try {
        await acompanhamentoService.desvincularAnalista(processoEmEdicao.value.id)
        showMessage("Analistas desvinculados com sucesso.", "success")
        dialogVinculo.value = false
        processoEmEdicao.value = null
        quantidadeAnalistasModal.value = 1
        primeiroAnalistaSelecionadoModal.value = null
        segundoAnalistaSelecionadoModal.value = null
        await carregarDados()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao desvincular analista."), "error")
    } finally {
        loading.value = false
    }
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
</script>

<template>
    <VContainer fluid class="distribution-page">
        <div class="page-header">
            <div>
                <h2>Distribuir processos</h2>
                <h4>Defina ou remova analistas responsáveis por processos em análise.</h4>
            </div>
            <div class="page-header-actions">
                <VBtn
                    variant="text"
                    color="black"
                    style="text-transform: none"
                    @click="router.push({ name: 'Acompanhamento' })"
                >
                    <IconArrowLeft size="18" style="vertical-align: bottom; margin-right: 5px" />
                    Voltar
                </VBtn>
                <VBtn variant="outlined" :loading="loading" @click="carregarDados">
                    <IconRefresh size="18" />
                    Atualizar
                </VBtn>
            </div>
        </div>

        <div class="summary-grid">
            <VCard class="summary-card" elevation="0">
                <div class="summary-icon-box summary-icon-box--blue">
                    <IconSend size="20" />
                </div>
                <div class="summary-content">
                    <span>Aguardando</span>
                    <strong>{{ indicadores.aguardando }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card" elevation="0">
                <div class="summary-icon-box summary-icon-box--indigo">
                    <IconPlayerPlay size="20" />
                </div>
                <div class="summary-content">
                    <span>Em análise</span>
                    <strong>{{ indicadores.emAnalise }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card" elevation="0">
                <div class="summary-icon-box summary-icon-box--orange">
                    <IconUserCheck size="20" />
                </div>
                <div class="summary-content">
                    <span>Sem primeiro</span>
                    <strong>{{ indicadores.semAnalista }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card" elevation="0">
                <div class="summary-icon-box summary-icon-box--slate">
                    <IconEye size="20" />
                </div>
                <div class="summary-content">
                    <span>Com segundo</span>
                    <strong>{{ indicadores.comSegundoAnalista }}</strong>
                </div>
            </VCard>
            <VCard class="summary-card" elevation="0">
                <div class="summary-icon-box summary-icon-box--green">
                    <IconUserCheck size="20" />
                </div>
                <div class="summary-content">
                    <span>Distribuídos</span>
                    <strong>{{ indicadores.distribuidos }}</strong>
                </div>
            </VCard>
        </div>

        <VCard class="filter-card">
            <div class="filter-field name-field">
                Busca por processo
                <VTextField
                    v-model="busca"
                    density="compact"
                    prepend-inner-icon="Search"
                    hide-details
                    variant="solo"
                    bg-color="hsl(0,0%,95%)"
                    placeholder="Digite nome, unidade, setor ou analista"
                />
            </div>
            <div class="filter-field select-field">
                Status
                <VSelect
                    v-model="statusFiltro"
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
                    v-model="analistaFiltro"
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

        <VDataTable
            :headers="headers"
            :items="processosFiltrados"
            :loading="loading"
            class="custom-table"
            no-data-text="Nenhum processo disponível para distribuição."
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

            <template #[`item.statusAcompanhamento`]="{ item }">
                <VChip
                    size="small"
                    :color="statusColor(item.statusAcompanhamento)"
                    variant="tonal"
                >
                    {{ statusLabel(item.statusAcompanhamento) }}
                </VChip>
            </template>

            <template #[`item.vinculoAnalista`]="{ item }">
                <div
                    class="assignment-panel"
                    :class="{
                        'assignment-panel--empty': !item.analistaResponsavel,
                    }"
                >
                    <div class="assignment-status">
                        <VAvatar
                            :color="item.analistaResponsavel ? 'primary' : 'grey-lighten-2'"
                            :class="{ 'assignment-avatar--empty': !item.analistaResponsavel }"
                            size="36"
                        >
                            <span v-if="item.analistaResponsavel">
                                {{ iniciaisAnalista(item.analistaResponsavel.nome) }}
                            </span>
                            <IconUserCircle v-else size="20" />
                        </VAvatar>

                        <div class="assignment-copy">
                            <span>
                                {{ item.analistaResponsavel ? "Primeiro analista" : "Sem primeiro analista" }}
                            </span>
                            <strong>{{ item.analistaResponsavel?.nome ?? "Selecione um responsável" }}</strong>
                            <small v-if="item.segundoAnalista">
                                Segundo analista: {{ item.segundoAnalista.nome }}
                            </small>
                        </div>
                    </div>

                    <div class="assignment-controls">
                        <VTooltip
                            :text="item.analistaResponsavel ? 'Gerenciar vínculo' : 'Vincular analista'"
                            location="top"
                        >
                            <template #activator="{ props }">
                                <VBtn
                                    v-bind="props"
                                    class="assignment-manage-button"
                                    color="primary"
                                    size="small"
                                    :variant="item.analistaResponsavel ? 'outlined' : 'flat'"
                                    @click="abrirModalVinculo(item)"
                                >
                                    <IconUserCheck v-if="item.analistaResponsavel" size="18" />
                                    <IconUserPlus v-else size="18" />
                                    {{ item.analistaResponsavel ? "Gerenciar" : "Vincular" }}
                                </VBtn>
                            </template>
                        </VTooltip>
                    </div>
                </div>
            </template>
        </VDataTable>

        <VDialog v-model="dialogVinculo" max-width="620">
            <VCard class="assignment-dialog" elevation="0">
                <div class="assignment-dialog-header">
                    <div class="assignment-dialog-icon">
                        <IconUserCheck size="20" />
                    </div>
                    <div>
                        <h3>Gerenciar analistas</h3>
                        <p>Defina a distribuição de análise deste processo.</p>
                    </div>
                    <VBtn
                        icon
                        size="small"
                        variant="text"
                        :disabled="loading"
                        @click="fecharModalVinculo"
                    >
                        <IconX size="20" />
                    </VBtn>
                </div>

                <div v-if="processoEmEdicao" class="assignment-dialog-body">
                    <div class="assignment-dialog-process">
                        <span>Processo</span>
                        <strong>{{ processoEmEdicao.nome }}</strong>
                        <small>
                            {{ processoEmEdicao.unidadeNome ?? "-" }}
                            <template v-if="processoEmEdicao.setorNome">
                                · {{ processoEmEdicao.setorNome }}
                            </template>
                        </small>
                    </div>

                    <div class="assignment-mode-row">
                        <span>Avaliação por</span>
                        <VBtnToggle
                            v-model="quantidadeAnalistasModal"
                            mandatory
                            divided
                            density="comfortable"
                            variant="outlined"
                            color="primary"
                        >
                            <VBtn
                                v-for="option in quantidadeAnalistasOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.title }}
                            </VBtn>
                        </VBtnToggle>
                    </div>

                    <div class="assignment-dialog-grid">
                        <div class="assignment-dialog-card">
                            <span>Vínculo atual</span>
                            <div class="assignment-dialog-person">
                                <VAvatar
                                    :color="processoEmEdicao.analistaResponsavel ? 'primary' : 'grey-lighten-2'"
                                    :class="{
                                        'assignment-avatar--empty':
                                            !processoEmEdicao.analistaResponsavel,
                                    }"
                                    size="40"
                                >
                                    <span v-if="processoEmEdicao.analistaResponsavel">
                                        {{ iniciaisAnalista(processoEmEdicao.analistaResponsavel.nome) }}
                                    </span>
                                    <IconUserCircle v-else size="22" />
                                </VAvatar>
                                <div>
                                    <strong>
                                        {{
                                            processoEmEdicao.analistaResponsavel?.nome ??
                                            "Sem analista vinculado"
                                        }}
                                    </strong>
                                    <small>
                                        {{
                                            processoEmEdicao.analistaResponsavel?.email ??
                                            "Processo disponível para distribuição"
                                        }}
                                    </small>
                                </div>
                            </div>
                            <div v-if="processoEmEdicao.segundoAnalista" class="assignment-dialog-person">
                                <VAvatar color="secondary" size="40">
                                    <span>{{ iniciaisAnalista(processoEmEdicao.segundoAnalista.nome) }}</span>
                                </VAvatar>
                                <div>
                                    <strong>{{ processoEmEdicao.segundoAnalista.nome }}</strong>
                                    <small>{{ processoEmEdicao.segundoAnalista.email }}</small>
                                </div>
                            </div>
                        </div>

                        <div class="assignment-dialog-card">
                            <span>Nova distribuição</span>
                            <div class="assignment-select-field">
                                <label>Primeiro analista</label>
                                <VSelect
                                    v-model="primeiroAnalistaSelecionadoModal"
                                    :items="analistaOptions"
                                    density="compact"
                                    hide-details
                                    clearable
                                    variant="outlined"
                                    placeholder="Escolha o primeiro analista"
                                    :menu-props="{ maxHeight: 320 }"
                                >
                                    <template #item="{ props, item: option }">
                                        <VListItem
                                            v-bind="props"
                                            :subtitle="option.raw.subtitle"
                                            density="compact"
                                        />
                                    </template>
                                    <template #selection="{ item: option }">
                                        <span class="assignment-selection">{{ option.title }}</span>
                                    </template>
                                </VSelect>
                                <div class="assignment-dialog-preview">
                                    <IconCheck v-if="primeiroAnalistaModalSelecionado" size="17" />
                                    <IconUserCircle v-else size="17" />
                                    <span>
                                        {{
                                            primeiroAnalistaModalSelecionado
                                                ? primeiroAnalistaModalSelecionado.subtitle
                                                : "Selecione para habilitar o vínculo"
                                        }}
                                    </span>
                                </div>
                            </div>

                            <div v-if="segundoAnalistaHabilitado" class="assignment-select-field">
                                <label>Segundo analista</label>
                                <VSelect
                                    v-model="segundoAnalistaSelecionadoModal"
                                    :items="analistaOptions"
                                    density="compact"
                                    hide-details
                                    clearable
                                    variant="outlined"
                                    placeholder="Escolha o segundo analista"
                                    :menu-props="{ maxHeight: 320 }"
                                >
                                    <template #item="{ props, item: option }">
                                        <VListItem
                                            v-bind="props"
                                            :subtitle="option.raw.subtitle"
                                            density="compact"
                                        />
                                    </template>
                                    <template #selection="{ item: option }">
                                        <span class="assignment-selection">{{ option.title }}</span>
                                    </template>
                                </VSelect>
                                <div
                                    class="assignment-dialog-preview"
                                    :class="{ 'assignment-dialog-preview--error': analistasModalRepetidos }"
                                >
                                    <IconEye v-if="segundoAnalistaModalSelecionado" size="17" />
                                    <IconUserCircle v-else size="17" />
                                    <span>
                                        {{
                                            analistasModalRepetidos
                                                ? "Escolha um usuário diferente do primeiro"
                                                : segundoAnalistaModalSelecionado
                                                  ? segundoAnalistaModalSelecionado.subtitle
                                                  : "Selecione o segundo vínculo"
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="assignment-dialog-actions">
                    <VBtn variant="text" :disabled="loading" @click="fecharModalVinculo">
                        Cancelar
                    </VBtn>
                    <VBtn
                        v-if="processoEmEdicao?.analistaResponsavel"
                        color="error"
                        variant="tonal"
                        :loading="loading"
                        @click="desvincularAnalista"
                    >
                        <IconUserMinus size="18" />
                        Desvincular
                    </VBtn>
                    <VBtn
                        color="primary"
                        variant="flat"
                        :disabled="!podeSalvarVinculoModal"
                        :loading="loading"
                        @click="salvarVinculoAnalista"
                    >
                        <IconCheck size="18" />
                        Salvar distribuição
                    </VBtn>
                </div>
            </VCard>
        </VDialog>
    </VContainer>
</template>

<style scoped>
.distribution-page {
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
    display: flex !important;
    align-items: center;
    min-width: 0;
    min-height: 86px;
    gap: 12px;
    padding: 14px !important;
    background: #ffffff;
    border: var(--border);
    border-radius: 8px !important;
    box-shadow: none !important;
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

.summary-icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    border-radius: 8px;
    background: #eef2ff;
}

.summary-icon-box--blue {
    color: #2563eb;
}

.summary-icon-box--indigo {
    color: #4f46e5;
}

.summary-icon-box--orange {
    color: #ea580c;
}

.summary-icon-box--green {
    color: #16a34a;
}

.summary-icon-box--slate {
    color: #475569;
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

.select-field {
    flex: 1 1 180px;
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

.acronym-cell {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
}

.assignment-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-width: 300px;
    gap: 12px;
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
}

.assignment-panel--empty {
    background: #f9fafb;
}

.assignment-status {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
    gap: 10px;
}

.assignment-status :deep(.v-avatar),
.assignment-dialog-person :deep(.v-avatar) {
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
}

.assignment-avatar--empty {
    color: #6b7280 !important;
}

.assignment-copy {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
}

.assignment-copy span {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.2;
}

.assignment-copy strong {
    overflow: hidden;
    color: #111827;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.assignment-copy small {
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.assignment-controls {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 8px;
}

.assignment-manage-button {
    border-radius: 8px;
    text-transform: none;
}

.assignment-manage-button :deep(.v-btn__content) {
    gap: 6px;
}

.assignment-selection {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.assignment-dialog {
    display: flex !important;
    flex-direction: column;
    gap: 18px;
    padding: 18px !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}

.assignment-dialog-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.assignment-dialog-header h3 {
    margin: 0;
    color: #111827;
    font-size: 18px;
    line-height: 1.2;
}

.assignment-dialog-header p {
    margin: 4px 0 0;
    color: #4b5563;
    font-size: 13px;
}

.assignment-dialog-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    border-radius: 8px;
    background: #dbeafe;
    color: #2563eb;
}

.assignment-dialog-header .v-btn {
    margin-left: auto;
}

.assignment-dialog-body {
    display: grid;
    gap: 14px;
}

.assignment-dialog-process,
.assignment-dialog-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 6px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
}

.assignment-mode-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
}

.assignment-mode-row span {
    color: #4b5563;
    font-size: 13px;
    font-weight: 700;
}

.assignment-mode-row :deep(.v-btn) {
    text-transform: none;
}

.assignment-dialog-process span,
.assignment-dialog-card > span {
    color: #6b7280;
    font-size: 12px;
}

.assignment-dialog-process strong,
.assignment-dialog-card strong {
    overflow-wrap: anywhere;
    color: #111827;
    font-size: 14px;
}

.assignment-dialog-process small,
.assignment-dialog-card small,
.assignment-dialog-preview {
    color: #6b7280;
    font-size: 12px;
}

.assignment-dialog-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 12px;
}

.assignment-dialog-person {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
}

.assignment-select-field {
    display: grid;
    min-width: 0;
    gap: 6px;
}

.assignment-select-field label {
    color: #4b5563;
    font-size: 12px;
    font-weight: 700;
}

.assignment-dialog-person div {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
}

.assignment-dialog-person strong,
.assignment-dialog-person small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.assignment-dialog-preview {
    display: flex;
    align-items: center;
    min-height: 26px;
    gap: 6px;
}

.assignment-dialog-preview svg {
    flex: 0 0 auto;
    color: #2563eb;
}

.assignment-dialog-preview--error,
.assignment-dialog-preview--error svg {
    color: #dc2626;
}

.assignment-dialog-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
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

    .assignment-panel {
        align-items: stretch;
        min-width: 260px;
        flex-direction: column;
    }

    .assignment-controls {
        width: 100%;
    }

    .assignment-manage-button {
        width: 100%;
    }

    .assignment-dialog-grid {
        grid-template-columns: 1fr;
    }

    .assignment-mode-row {
        align-items: stretch;
        flex-direction: column;
    }

    .assignment-dialog-actions {
        justify-content: stretch;
    }

    .assignment-dialog-actions .v-btn {
        flex: 1 1 auto;
    }
}
</style>
