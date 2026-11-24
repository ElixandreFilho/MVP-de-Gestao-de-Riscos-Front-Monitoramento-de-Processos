<script setup lang="ts">
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconBan,
    IconCircleCheck,
    IconFileSpreadsheet,
    IconInfoCircle,
    IconPlayerPlay,
    IconRefresh,
    IconRotateClockwise,
    IconSend,
    IconX,
} from "@tabler/icons-vue"
import { computed, onMounted, ref, shallowRef, watch, type Component, type ShallowRef } from "vue"
import DatePicker from "../../components/DatePicker.vue"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import IdentificacaoRiscosPage from "./IdentificacaoRiscosTab.vue"
import AvaliacaoRiscoControle from "./AvaliacaoRiscoControleTab.vue"
import RespostaRiscoPage from "./RespostaRiscoTab.vue"
import AtividadeControlePage from "./AtividadeControleTab.vue"
import OcorrenciasRiscoPage from "./OcorrenciasRiscoTab.vue"
import ProcessInfoCard from "./ProcessInfoCard.vue"
import DetailsProcess from "./DetailsProcess.vue"
import type { Processo } from "../../types/processo"
import { selectedProcesso } from "./processoPage"
import processoService from "../../services/processoService"
import { showMessage } from "../../components/snackbar/SnackbarState"
import acompanhamentoService, {
    type AcompanhamentoActionPayload,
} from "../../services/acompanhamentoService"
import { getHttpErrorMessage } from "../../core/httpError"
import { useUnidadeStore } from "../../stores/unidadeStore"
import {
    AcompanhamentoAcao,
    StatusAcompanhamentoProcesso,
    type AcompanhamentoAcao as AcompanhamentoAcaoTipo,
    type AcompanhamentoProcessoResumo,
    type PendenciasProcesso,
    type StatusAcompanhamentoProcesso as StatusAcompanhamento,
} from "../../types/acompanhamento"

type StateColor = {
    highlight: string
    text: string
    highlightText: string
    hover: string
}
type StatusPalette = {
    accent: string
    border: string
    surface: string
    chip: string
}
type StepState = "warning" | "selected" | "unfocused" | "success" | "focused"
type Step = { title: string; state: StepState; comp: Component }

const stateColors: Record<StepState, StateColor> = {
    warning: {
        highlight: "hsl(40,100%,45%)",
        text: "hsl(35,100%,30%)",
        highlightText: "white",
        hover: "40,100%",
    },
    success: {
        highlight: "hsl(100,60%,45%)",
        text: "hsl(100,100%,30%)",
        highlightText: "white",
        hover: "100,60%",
    },
    selected: {
        highlight: "hsl(200,50%,50%)",
        text: "hsl(200,70%,30%)",
        highlightText: "white",
        hover: "200,50%",
    },
    unfocused: {
        highlight: "hsl(0,0%,80%)",
        text: "hsl(0,0%,50%)",
        highlightText: "200,10%",
        hover: "white",
    },
    focused: {
        highlight: "rgb(var(--v-theme-primary))",
        text: "hsl(220,80%,30%)",
        highlightText: "white",
        hover: "220,80%",
    },
}

const steps: ShallowRef<Step[]> = shallowRef([
    { title: "Identificação de Riscos", state: "focused", comp: IdentificacaoRiscosPage },
    { title: "Avaliação de Riscos e Controles", state: "unfocused", comp: AvaliacaoRiscoControle },
    { title: "Resposta aos Riscos", state: "unfocused", comp: RespostaRiscoPage },
    { title: "Atividades de Controle", state: "unfocused", comp: AtividadeControlePage },
    { title: "Ocorrências de Risco", state: "unfocused", comp: OcorrenciasRiscoPage },
])

const props = defineProps<{
    changeTab: () => void
    backLabel?: string
    processo?: Processo | null
    setor?: string
    unidade?: string
    somenteLeitura?: boolean
    modoAcompanhamento?: boolean
}>()

const showModal = ref(false)
const exportLoading = ref(false)
const unidadeStore = useUnidadeStore()
const acompanhamentoLoading = ref(false)
const acompanhamentoResumo = ref<AcompanhamentoProcessoResumo | null>(null)
const pendenciasProcesso = ref<PendenciasProcesso | null>(null)
const dialogEnvioParaAnalise = ref(false)
const dialogCancelarEnvio = ref(false)
const dialogAjustes = ref(false)
const dialogFinalizar = ref(false)
const dialogCancelarAnalise = ref(false)
const observacaoAnalise = ref("")
const justificativaCancelamento = ref("")
const prazoAjuste = ref("")

const isAdmin = computed(() => unidadeStore.isAdmin)
const modoSomenteLeitura = computed(() => props.somenteLeitura === true)
const podeOperarAcompanhamento = computed(
    () => isAdmin.value && props.modoAcompanhamento === true && !modoSomenteLeitura.value
)
const backButtonLabel = computed(() => props.backLabel ?? "Voltar para Lista de Processos")

const formatarData = (dataString: string | undefined): string => {
    if (!dataString) return "-"

    const data = new Date(dataString)

    if (Number.isNaN(data.getTime())) {
        return "-"
    }

    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}


const processoInfo = computed(() => ({
    nome: props.processo?.nome ?? "-",
    unidade: props.unidade ?? "-", 
    setor: props.setor ?? "-",     
    responsavel: props.processo?.responsavel?.nome ?? "-",
    dataCriacao: formatarData(props.processo?.criadoEm),   
    ultimaAtualizacao: formatarData(props.processo?.atualizadoEm) ?? "-", 
    objetivosGerais: props.processo?.objetivosGerais ?? "-",
    objetivosEstrategicos: props.processo?.objetivosEstrategicos ?? "-",
}))

const statusAtual = computed<StatusAcompanhamento>(() => {
    return (
        acompanhamentoResumo.value?.statusAcompanhamento ??
        props.processo?.statusAcompanhamento ??
        StatusAcompanhamentoProcesso.RASCUNHO
    )
})

const emCicloRevisao = computed(() => {
    return Boolean(acompanhamentoResumo.value?.emCicloRevisao ?? props.processo?.emCicloRevisao)
})

const destinoEnvio = computed(() => (emCicloRevisao.value ? "revisão" : "análise"))

const prazoAjusteAtual = computed(() => {
    return acompanhamentoResumo.value?.prazoAjuste ?? props.processo?.prazoAjuste ?? null
})

const statusPermiteEnvioParaAnalise = computed(() => {
    return (
        !isAdmin.value &&
        Boolean(props.processo?.id) &&
        (statusAtual.value === StatusAcompanhamentoProcesso.RASCUNHO ||
            statusAtual.value === StatusAcompanhamentoProcesso.PENDENTE_REVISAO)
    )
})

const podeEnviarParaAnalise = computed(() => {
    return statusPermiteEnvioParaAnalise.value && Boolean(pendenciasProcesso.value?.aptoParaEnvio)
})

const acoesDisponiveis = computed(() => acompanhamentoResumo.value?.acoesDisponiveis ?? [])

const possuiAcaoAcompanhamento = (acao: AcompanhamentoAcaoTipo) => {
    return acoesDisponiveis.value.includes(acao)
}

const mostrarBotaoIniciarRevisao = computed(() => {
    return podeOperarAcompanhamento.value && possuiAcaoAcompanhamento(AcompanhamentoAcao.INICIAR_ANALISE)
})

const mostrarBotaoSolicitarAjustes = computed(() => {
    return podeOperarAcompanhamento.value && possuiAcaoAcompanhamento(AcompanhamentoAcao.SOLICITAR_AJUSTES)
})

const mostrarBotaoFinalizarAnalise = computed(() => {
    return podeOperarAcompanhamento.value && possuiAcaoAcompanhamento(AcompanhamentoAcao.FINALIZAR_ANALISE)
})

const mostrarBotaoCancelarAnalise = computed(() => {
    return podeOperarAcompanhamento.value && possuiAcaoAcompanhamento(AcompanhamentoAcao.CANCELAR_ANALISE)
})

const mostrarBotaoCancelarEnvio = computed(() => {
    return (
        !isAdmin.value &&
        statusAtual.value === StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE &&
        possuiAcaoAcompanhamento(AcompanhamentoAcao.CANCELAR_ENVIO)
    )
})

const mostrarBotaoAbrirCicloRevisao = computed(() => {
    return podeOperarAcompanhamento.value && possuiAcaoAcompanhamento(AcompanhamentoAcao.INICIAR_REVISAO)
})

const mostrarBotaoReenviarAjustado = computed(() => {
    return (
        !isAdmin.value &&
        Boolean(props.processo?.id) &&
        statusAtual.value === StatusAcompanhamentoProcesso.EM_AJUSTE
    )
})

const desabilitarEnvioParaAnalise = computed(() => {
    return acompanhamentoLoading.value || !pendenciasProcesso.value?.aptoParaEnvio
})

const motivoBotaoEnvio = computed(() => {
    if (acompanhamentoLoading.value) {
        return "Verificando pendências do processo."
    }

    if (!pendenciasProcesso.value) {
        return "Atualize o status para verificar as pendências."
    }

    if (!pendenciasProcesso.value.aptoParaEnvio) {
        return "Conclua as pendências obrigatórias para habilitar o envio."
    }

    return `Enviar processo para ${destinoEnvio.value} da SecGov.`
})

const textoBotaoEnvio = computed(() => {
    return `Enviar para ${destinoEnvio.value}`
})

const mensagemConfirmacaoEnvio = computed(() => {
    return `Enviar este processo para ${destinoEnvio.value} da SecGov?`
})

const mensagemSucessoEnvio = computed(() => {
    return `Processo enviado para ${destinoEnvio.value}.`
})

const textoBotaoCancelarEnvio = computed(() => {
    return `Cancelar envio para ${destinoEnvio.value}`
})

const mensagemConfirmacaoCancelamentoEnvio = computed(() => {
    return `Cancelar o envio deste processo para ${destinoEnvio.value} da SecGov?`
})

const normalizarPendencia = (pendencia: string): string => {
    return pendencia
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

const obterAbaDaPendencia = (pendencia: string): string => {
    const grupo = pendencia.split(":")[0]?.trim() || pendencia.trim()
    const grupoNormalizado = normalizarPendencia(grupo)

    if (grupoNormalizado.startsWith("dados gerais")) return "Dados gerais"
    if (grupoNormalizado.startsWith("identificacao")) return "Identificação de riscos"
    if (grupoNormalizado.startsWith("avaliacao")) return "Avaliação de riscos e controles"
    if (grupoNormalizado.startsWith("respostas")) return "Resposta aos riscos"
    if (grupoNormalizado.startsWith("atividades")) return "Atividades de controle"
    if (grupoNormalizado.startsWith("ocorrencias")) return "Ocorrências de risco"

    return grupo
}

const pendenciasAbas = computed(() => {
    const abas = (pendenciasProcesso.value?.pendencias ?? [])
        .map(obterAbaDaPendencia)
        .filter(Boolean)

    return Array.from(new Set(abas))
})

const temPendencias = computed(() => {
    return Boolean(
        pendenciasProcesso.value &&
            !pendenciasProcesso.value.aptoParaEnvio &&
            pendenciasAbas.value.length > 0
    )
})

const statusLabel = computed(() => {
    const labels: Record<StatusAcompanhamento, string> = {
        RASCUNHO: "Rascunho",
        AGUARDANDO_ANALISE: "Aguardando análise",
        EM_ANALISE: "Em análise",
        EM_AJUSTE: "Em ajuste",
        CONCLUIDO: "Concluído",
        PENDENTE_REVISAO: "Pendente de revisão",
    }
    return labels[statusAtual.value]
})

const statusColor = computed(() => {
    const colors: Record<StatusAcompanhamento, string> = {
        RASCUNHO: "grey",
        AGUARDANDO_ANALISE: "blue",
        EM_ANALISE: "indigo",
        EM_AJUSTE: "orange",
        CONCLUIDO: "green",
        PENDENTE_REVISAO: "purple",
    }
    return colors[statusAtual.value]
})

const statusIcon = computed<Component>(() => {
    const icons: Record<StatusAcompanhamento, Component> = {
        RASCUNHO: IconInfoCircle,
        AGUARDANDO_ANALISE: IconSend,
        EM_ANALISE: IconPlayerPlay,
        EM_AJUSTE: IconAlertTriangle,
        CONCLUIDO: IconCircleCheck,
        PENDENTE_REVISAO: IconRotateClockwise,
    }

    return icons[statusAtual.value]
})

const statusPalette = computed<StatusPalette>(() => {
    const palettes: Record<StatusAcompanhamento, StatusPalette> = {
        RASCUNHO: {
            accent: "#64748b",
            border: "#cbd5e1",
            surface: "#f8fafc",
            chip: "#e2e8f0",
        },
        AGUARDANDO_ANALISE: {
            accent: "#2563eb",
            border: "#bfdbfe",
            surface: "#eff6ff",
            chip: "#dbeafe",
        },
        EM_ANALISE: {
            accent: "#4f46e5",
            border: "#c7d2fe",
            surface: "#eef2ff",
            chip: "#e0e7ff",
        },
        EM_AJUSTE: {
            accent: "#ea580c",
            border: "#fed7aa",
            surface: "#fff7ed",
            chip: "#ffedd5",
        },
        CONCLUIDO: {
            accent: "#15803d",
            border: "#bbf7d0",
            surface: "#f0fdf4",
            chip: "#dcfce7",
        },
        PENDENTE_REVISAO: {
            accent: "#7c3aed",
            border: "#ddd6fe",
            surface: "#f5f3ff",
            chip: "#ede9fe",
        },
    }

    return palettes[statusAtual.value]
})

const statusCardStyle = computed<Record<string, string>>(() => ({
    "--status-accent": statusPalette.value.accent,
    "--status-border": statusPalette.value.border,
    "--status-surface": statusPalette.value.surface,
    "--status-chip": statusPalette.value.chip,
}))

const statusMessage = computed(() => {
    if (statusAtual.value === StatusAcompanhamentoProcesso.EM_AJUSTE) {
        return "A SecGov solicitou ajustes. Após corrigir as etapas necessárias, reenvie o processo para análise."
    }

    if (podeEnviarParaAnalise.value) {
        return `O processo atende aos requisitos obrigatórios e pode ser enviado para ${destinoEnvio.value}.`
    }

    if (temPendencias.value) {
        return `Complete as pendências obrigatórias antes de enviar o processo para ${destinoEnvio.value}.`
    }

    if (statusAtual.value === StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE) {
        return `O processo está aguardando ${destinoEnvio.value} da SecGov.`
    }

    if (statusAtual.value === StatusAcompanhamentoProcesso.EM_ANALISE) {
        return "O processo está em análise pela SecGov."
    }

    if (statusAtual.value === StatusAcompanhamentoProcesso.CONCLUIDO) {
        return "A análise do processo foi concluída pela SecGov."
    }

    return "Acompanhe aqui a situação do processo no fluxo de análise."
})

const openDetails = () => {
    showModal.value = true
}

const exportProcessSpreadsheet = async () => {
    const processoId = props.processo?.id

    if (!processoId) {
        showMessage("Processo inválido para exportação.", "error")
        return
    }

    exportLoading.value = true

    try {
        const blob = await processoService.exportSpreadsheet(processoId)
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")

        try {
            link.href = url
            link.download = `processo-${processoId}-riscos.xlsx`
            document.body.appendChild(link)
            link.click()
            link.remove()
        } finally {
            URL.revokeObjectURL(url)
        }

        showMessage("Download da planilha iniciado.", "success")
    } catch {
        showMessage("Erro ao exportar planilha.", "error")
    } finally {
        exportLoading.value = false
    }
}

const carregarAcompanhamento = async () => {
    const processoId = props.processo?.id

    if (!processoId) {
        acompanhamentoResumo.value = null
        pendenciasProcesso.value = null
        return
    }

    acompanhamentoLoading.value = true

    try {
        const [resumo, pendencias] = await Promise.all([
            acompanhamentoService.detalhar(processoId),
            acompanhamentoService.consultarPendencias(processoId),
        ])
        acompanhamentoResumo.value = resumo
        pendenciasProcesso.value = pendencias
        atualizarProcessoSelecionado(resumo)
    } catch (error) {
        console.error(error)
        showMessage(
            getHttpErrorMessage(error, "Erro ao carregar status de acompanhamento."),
            "error"
        )
    } finally {
        acompanhamentoLoading.value = false
    }
}

const atualizarProcessoSelecionado = (resumo: AcompanhamentoProcessoResumo) => {
    if (!selectedProcesso.value || selectedProcesso.value.id !== resumo.id) {
        return
    }

    Object.assign(selectedProcesso.value, {
        statusAcompanhamento: resumo.statusAcompanhamento,
        analistaResponsavel: resumo.analistaResponsavel,
        segundoAnalista: resumo.segundoAnalista,
        enviadoParaAnaliseEm: resumo.enviadoParaAnaliseEm,
        reenviadoParaAnaliseEm: resumo.reenviadoParaAnaliseEm,
        analiseIniciadaEm: resumo.analiseIniciadaEm,
        analiseConcluidaEm: resumo.analiseConcluidaEm,
        ajusteSolicitadoEm: resumo.ajusteSolicitadoEm,
        prazoAjuste: resumo.prazoAjuste,
        cicloAcompanhamento: resumo.cicloAcompanhamento,
        emCicloRevisao: resumo.emCicloRevisao,
    })
}

const enviarParaAnalise = async () => {
    if (modoSomenteLeitura.value) return

    const processoId = props.processo?.id
    if (!processoId) return

    acompanhamentoLoading.value = true

    try {
        const resumo = await acompanhamentoService.enviarParaAnalise(processoId)
        acompanhamentoResumo.value = resumo
        atualizarProcessoSelecionado(resumo)
        dialogEnvioParaAnalise.value = false
        showMessage(mensagemSucessoEnvio.value, "success")
        await carregarAcompanhamento()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao enviar processo para análise."), "error")
    } finally {
        acompanhamentoLoading.value = false
    }
}

const reenviarAjustado = async () => {
    if (modoSomenteLeitura.value) return

    const processoId = props.processo?.id
    if (!processoId) return

    const observacao = globalThis.prompt("Observação sobre os ajustes realizados") ?? ""
    if (!globalThis.confirm("Reenviar este processo ajustado para análise?")) return

    acompanhamentoLoading.value = true

    try {
        const resumo = await acompanhamentoService.reenviarAjustado(processoId, { observacao })
        acompanhamentoResumo.value = resumo
        atualizarProcessoSelecionado(resumo)
        showMessage("Processo reenviado para análise.", "success")
        await carregarAcompanhamento()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao reenviar processo para análise."), "error")
    } finally {
        acompanhamentoLoading.value = false
    }
}

const prepararAcaoAnalise = () => {
    observacaoAnalise.value = ""
    justificativaCancelamento.value = ""
    prazoAjuste.value = calcularDataPadraoAjuste()
}

const fecharDialogsAnalise = () => {
    dialogCancelarEnvio.value = false
    dialogAjustes.value = false
    dialogFinalizar.value = false
    dialogCancelarAnalise.value = false
}

const executarAcaoAcompanhamento = async (
    acao: (
        processoId: number,
        payload: AcompanhamentoActionPayload
    ) => Promise<AcompanhamentoProcessoResumo>,
    mensagemSucesso: string,
    payload: AcompanhamentoActionPayload = {}
) => {
    if (!podeOperarAcompanhamento.value) return

    const processoId = props.processo?.id
    if (!processoId) return

    acompanhamentoLoading.value = true

    try {
        const resumo = await acao(processoId, payload)
        acompanhamentoResumo.value = resumo
        atualizarProcessoSelecionado(resumo)
        fecharDialogsAnalise()
        showMessage(mensagemSucesso, "success")
        await carregarAcompanhamento()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao executar ação de acompanhamento."), "error")
    } finally {
        acompanhamentoLoading.value = false
    }
}

const iniciarRevisao = async () => {
    if (!globalThis.confirm("Iniciar revisão deste processo?")) return

    await executarAcaoAcompanhamento(
        acompanhamentoService.iniciarAnalise.bind(acompanhamentoService),
        "Revisão iniciada com sucesso."
    )
}

const abrirCicloRevisao = async () => {
    if (!globalThis.confirm("Abrir novo ciclo de revisão deste processo?")) return

    await executarAcaoAcompanhamento(
        acompanhamentoService.iniciarRevisao.bind(acompanhamentoService),
        "Ciclo de revisão aberto com sucesso."
    )
}

const abrirEnvioParaAnalise = () => {
    if (modoSomenteLeitura.value) return

    dialogEnvioParaAnalise.value = true
}

const fecharEnvioParaAnalise = () => {
    if (acompanhamentoLoading.value) return

    dialogEnvioParaAnalise.value = false
}

const abrirCancelamentoEnvio = () => {
    if (modoSomenteLeitura.value) return

    dialogCancelarEnvio.value = true
}

const fecharCancelamentoEnvio = () => {
    if (acompanhamentoLoading.value) return

    dialogCancelarEnvio.value = false
}

const abrirSolicitacaoAjustes = () => {
    if (modoSomenteLeitura.value) return

    prepararAcaoAnalise()
    dialogAjustes.value = true
}

const confirmarSolicitacaoAjustes = async () => {
    await executarAcaoAcompanhamento(
        acompanhamentoService.solicitarAjustes.bind(acompanhamentoService),
        "Ajustes solicitados com sucesso.",
        {
            observacao: observacaoAnalise.value,
            prazoAjuste: prazoAjuste.value,
        }
    )
}

const confirmarCancelamentoEnvio = async () => {
    await executarAcaoAcompanhamento(
        acompanhamentoService.cancelarEnvio.bind(acompanhamentoService),
        "Envio cancelado com sucesso."
    )
}

const abrirFinalizacaoAnalise = () => {
    if (modoSomenteLeitura.value) return

    prepararAcaoAnalise()
    dialogFinalizar.value = true
}

const confirmarFinalizacaoAnalise = async () => {
    await executarAcaoAcompanhamento(
        acompanhamentoService.concluirAnalise.bind(acompanhamentoService),
        "Análise concluída com sucesso.",
        {
            observacao: observacaoAnalise.value,
        }
    )
}

const abrirCancelamentoAnalise = () => {
    if (modoSomenteLeitura.value) return

    prepararAcaoAnalise()
    dialogCancelarAnalise.value = true
}

const confirmarCancelamentoAnalise = async () => {
    if (!justificativaCancelamento.value.trim()) {
        showMessage("Informe a justificativa do cancelamento.", "info")
        return
    }

    await executarAcaoAcompanhamento(
        acompanhamentoService.cancelarAnalise.bind(acompanhamentoService),
        "Análise cancelada com sucesso.",
        {
            justificativa: justificativaCancelamento.value,
        }
    )
}

const calcularDataPadraoAjuste = (): string => {
    const data = new Date()
    data.setDate(data.getDate() + 15)
    return data.toISOString().slice(0, 10)
}

const formatarDataSimples = (dataString: string | null | undefined): string => {
    if (!dataString) return "-"
    return new Date(`${dataString}T00:00:00`).toLocaleDateString("pt-BR")
}

const currentTab = ref(0)
const lastTab = ref(0)

watch(currentTab, (newTab) => {
    if (steps.value[lastTab.value]?.state === "focused")
        steps.value[lastTab.value]!.state = "unfocused"
    if (steps.value[newTab]!.state === "unfocused") steps.value[newTab]!.state = "focused"
    lastTab.value = newTab
})

watch(
    () => props.processo?.id,
    () => {
        void carregarAcompanhamento()
    }
)

onMounted(() => {
    void carregarAcompanhamento()
})

const style = document.createElement("style")
style.innerHTML = Object.entries(stateColors)
    .map(([k, v]) => `.ripple-${k}{color:${v.highlight} !important;}`)
    .join("")
document.head.appendChild(style)
</script>
<template>
    <VContainer class="col" fluid style="gap: 20px">
        <div class="process-actions">
            <VBtn
                variant="text"
                style="text-transform: none"
                color="black"
                @click="changeTab"
            >
                <IconArrowLeft size="18" style="vertical-align: bottom; margin-right: 5px" />
                {{ backButtonLabel }}
            </VBtn>
            <div class="process-actions__right">
                <VTooltip text="Baixar planilha">
                    <template #activator="{ props: tooltipProps }">
                        <VBtn
                            v-bind="tooltipProps"
                            color="primary"
                            class="processActionButton exportSpreadsheetButton"
                            :loading="exportLoading"
                            :disabled="exportLoading || !processo?.id"
                            aria-label="Exportar planilha"
                            @click="exportProcessSpreadsheet"
                        >
                            <IconFileSpreadsheet size="18" />
                        </VBtn>
                    </template>
                </VTooltip>
                <VTooltip text="Ver detalhes">
                    <template #activator="{ props: tooltipProps }">
                        <VBtn
                            v-bind="tooltipProps"
                            color="primary"
                            class="detailsButton processActionButton iconOnlyActionButton"
                            aria-label="Ver detalhes"
                            @click="openDetails"
                        >
                            <IconInfoCircle size="18" />
                        </VBtn>
                    </template>
                </VTooltip>
            </div>
        </div>
        <ProcessInfoCard
            :unidade="unidade"
            :setor="setor"
            :processo="selectedProcesso"
        />

        <VCard class="acompanhamento-status-card" :style="statusCardStyle" elevation="0">
            <div class="acompanhamento-status-main">
                <div class="status-emblem" aria-hidden="true">
                    <component :is="statusIcon" size="22" />
                </div>

                <div class="status-copy">
                    <div class="status-heading">
                        <span class="status-label">Status do processo</span>
                        <VChip :color="statusColor" variant="tonal" size="small" class="status-chip">
                            {{ statusLabel }}
                        </VChip>
                    </div>
                    <strong>{{ statusMessage }}</strong>
                    <div
                        v-if="
                            prazoAjusteAtual ||
                            acompanhamentoResumo?.analistaResponsavel ||
                            acompanhamentoResumo?.segundoAnalista
                        "
                        class="status-meta"
                    >
                        <div v-if="prazoAjusteAtual" class="status-meta-item">
                            <span>Prazo de ajuste</span>
                            <strong>{{ formatarDataSimples(prazoAjusteAtual) }}</strong>
                        </div>
                        <div v-if="acompanhamentoResumo?.analistaResponsavel" class="status-meta-item">
                            <span>Primeiro analista</span>
                            <strong>{{ acompanhamentoResumo.analistaResponsavel.nome }}</strong>
                        </div>
                        <div v-if="acompanhamentoResumo?.segundoAnalista" class="status-meta-item">
                            <span>Segundo analista</span>
                            <strong>{{ acompanhamentoResumo.segundoAnalista.nome }}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="acompanhamento-status-actions">
                <VTooltip text="Atualizar status">
                    <template #activator="{ props: tooltipProps }">
                        <VBtn
                            v-bind="tooltipProps"
                            icon
                            variant="outlined"
                            class="status-icon-button"
                            :loading="acompanhamentoLoading"
                            :disabled="acompanhamentoLoading || !processo?.id"
                            @click="carregarAcompanhamento"
                        >
                            <IconRefresh size="18" />
                        </VBtn>
                    </template>
                </VTooltip>

                <VBtn
                    v-if="!modoSomenteLeitura && statusPermiteEnvioParaAnalise"
                    color="primary"
                    class="send-analysis-button"
                    :loading="acompanhamentoLoading"
                    :disabled="desabilitarEnvioParaAnalise"
                    :title="motivoBotaoEnvio"
                    @click="abrirEnvioParaAnalise"
                >
                    <IconSend size="18" />
                    {{ textoBotaoEnvio }}
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoCancelarEnvio"
                    color="red"
                    variant="outlined"
                    class="analysis-action-button"
                    :loading="acompanhamentoLoading"
                    @click="abrirCancelamentoEnvio"
                >
                    <IconBan size="18" />
                    {{ textoBotaoCancelarEnvio }}
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoReenviarAjustado"
                    color="primary"
                    class="send-analysis-button"
                    :loading="acompanhamentoLoading"
                    @click="reenviarAjustado"
                >
                    <IconRotateClockwise size="18" />
                    Reenviar para análise
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoIniciarRevisao"
                    color="primary"
                    class="analysis-action-button"
                    :loading="acompanhamentoLoading"
                    @click="iniciarRevisao"
                >
                    <IconPlayerPlay size="18" />
                    Iniciar revisão
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoSolicitarAjustes"
                    color="warning"
                    class="analysis-action-button"
                    :loading="acompanhamentoLoading"
                    @click="abrirSolicitacaoAjustes"
                >
                    <IconAlertTriangle size="18" />
                    Solicitar ajustes
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoFinalizarAnalise"
                    color="success"
                    class="analysis-action-button"
                    :loading="acompanhamentoLoading"
                    @click="abrirFinalizacaoAnalise"
                >
                    <IconCircleCheck size="18" />
                    Finalizar análise
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoCancelarAnalise"
                    color="red"
                    class="analysis-action-button"
                    :loading="acompanhamentoLoading"
                    @click="abrirCancelamentoAnalise"
                >
                    <IconX size="18" />
                    Cancelar análise
                </VBtn>

                <VBtn
                    v-if="!modoSomenteLeitura && mostrarBotaoAbrirCicloRevisao"
                    color="primary"
                    variant="outlined"
                    class="analysis-action-button"
                    :loading="acompanhamentoLoading"
                    @click="abrirCicloRevisao"
                >
                    <IconRotateClockwise size="18" />
                    Abrir revisão
                </VBtn>
            </div>

            <div v-if="temPendencias" class="pendencias-box">
                <div class="pendencias-title">
                    <IconAlertTriangle size="18" />
                    Pendências para envio
                </div>
                <ul>
                    <li v-for="pendencia in pendenciasAbas" :key="pendencia">
                        {{ pendencia }}
                    </li>
                </ul>
            </div>
        </VCard>

        <VDialog
            v-model="dialogEnvioParaAnalise"
            max-width="460"
            :persistent="acompanhamentoLoading"
        >
            <VCard class="analysis-dialog-card send-analysis-dialog-card" elevation="0">
                <div class="analysis-dialog-header">
                    <div class="send-analysis-dialog-heading">
                        <span class="send-analysis-dialog-icon">
                            <IconSend size="20" />
                        </span>
                        <h3>{{ textoBotaoEnvio }}</h3>
                    </div>
                    <VBtn
                        icon
                        variant="text"
                        aria-label="Fechar confirmação de envio"
                        :disabled="acompanhamentoLoading"
                        @click="fecharEnvioParaAnalise"
                    >
                        <IconX size="20" />
                    </VBtn>
                </div>
                <p class="analysis-dialog-message send-analysis-dialog-message">
                    {{ mensagemConfirmacaoEnvio }}
                </p>
                <div class="analysis-dialog-actions">
                    <VBtn
                        variant="outlined"
                        :disabled="acompanhamentoLoading"
                        @click="fecharEnvioParaAnalise"
                    >
                        Cancelar
                    </VBtn>
                    <VBtn :loading="acompanhamentoLoading" @click="enviarParaAnalise">
                        Confirmar
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <VDialog
            v-model="dialogCancelarEnvio"
            max-width="460"
            :persistent="acompanhamentoLoading"
        >
            <VCard class="analysis-dialog-card send-analysis-dialog-card" elevation="0">
                <div class="analysis-dialog-header">
                    <div class="send-analysis-dialog-heading">
                        <span class="send-analysis-dialog-icon">
                            <IconBan size="20" />
                        </span>
                        <h3>{{ textoBotaoCancelarEnvio }}</h3>
                    </div>
                    <VBtn
                        icon
                        variant="text"
                        aria-label="Fechar confirmação de cancelamento de envio"
                        :disabled="acompanhamentoLoading"
                        @click="fecharCancelamentoEnvio"
                    >
                        <IconX size="20" />
                    </VBtn>
                </div>
                <p class="analysis-dialog-message send-analysis-dialog-message">
                    {{ mensagemConfirmacaoCancelamentoEnvio }}
                </p>
                <div class="analysis-dialog-actions">
                    <VBtn
                        variant="outlined"
                        :disabled="acompanhamentoLoading"
                        @click="fecharCancelamentoEnvio"
                    >
                        Voltar
                    </VBtn>
                    <VBtn
                        color="red"
                        :loading="acompanhamentoLoading"
                        @click="confirmarCancelamentoEnvio"
                    >
                        Confirmar
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <VDialog v-model="dialogAjustes" max-width="560">
            <VCard class="analysis-dialog-card">
                <div class="analysis-dialog-header">
                    <h3>Solicitar ajustes</h3>
                    <VBtn icon variant="text" @click="dialogAjustes = false">
                        <IconX size="20" />
                    </VBtn>
                </div>
                <VTextarea v-model="observacaoAnalise" label="Observação" variant="outlined" rows="4" />
                <DatePicker v-model="prazoAjuste" />
                <div class="analysis-dialog-actions">
                    <VBtn variant="outlined" @click="dialogAjustes = false">Cancelar</VBtn>
                    <VBtn :loading="acompanhamentoLoading" @click="confirmarSolicitacaoAjustes">
                        Solicitar
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <VDialog v-model="dialogFinalizar" max-width="560">
            <VCard class="analysis-dialog-card">
                <div class="analysis-dialog-header">
                    <h3>Finalizar análise</h3>
                    <VBtn icon variant="text" @click="dialogFinalizar = false">
                        <IconX size="20" />
                    </VBtn>
                </div>
                <VTextarea
                    v-model="observacaoAnalise"
                    label="Observação final"
                    variant="outlined"
                    rows="4"
                />
                <div class="analysis-dialog-actions">
                    <VBtn variant="outlined" @click="dialogFinalizar = false">Cancelar</VBtn>
                    <VBtn :loading="acompanhamentoLoading" @click="confirmarFinalizacaoAnalise">
                        Concluir
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <VDialog v-model="dialogCancelarAnalise" max-width="560">
            <VCard class="analysis-dialog-card">
                <div class="analysis-dialog-header">
                    <h3>Cancelar análise</h3>
                    <VBtn icon variant="text" @click="dialogCancelarAnalise = false">
                        <IconX size="20" />
                    </VBtn>
                </div>
                <VTextarea
                    v-model="justificativaCancelamento"
                    label="Justificativa"
                    variant="outlined"
                    rows="4"
                />
                <div class="analysis-dialog-actions">
                    <VBtn variant="outlined" @click="dialogCancelarAnalise = false">Cancelar</VBtn>
                    <VBtn
                        color="red"
                        :loading="acompanhamentoLoading"
                        @click="confirmarCancelamentoAnalise"
                    >
                        Confirmar
                    </VBtn>
                </div>
            </VCard>
        </VDialog>

        <DetailsProcess v-model:show="showModal" :processo="processoInfo" />

        <VContainer class="row" fluid style="padding: 0">
            <VCard
                class="tabButton"
                :style="{
                    borderColor: stateColors[step.state].highlight + '!important',
                    '--selected': currentTab === index ? '80%' : '95%',
                }"
                :ripple="{ class: `ripple-${step.state}` }"
                v-for="(step, index) in steps"
                :key="index"
                rounded="lg"
                elevation="0"
                @click="
                    () => {
                        currentTab = index
                    }
                "
            >
                <div style="display: flex; justify-content: space-between; align-items: center">
                    <div
                        style="
                            width: 36px;
                            height: 36px;
                            padding: 0;
                            border-radius: 100%;
                            place-content: center;
                            text-align: center;
                        "
                        variant="flat"
                        :style="{
                            background: stateColors[step.state].highlight,
                            color: stateColors[step.state].highlightText,
                        }"
                    >
                        <IconCircleCheck
                            v-if="step.state === 'success'"
                            style="width: 30px; height: 100%"
                        ></IconCircleCheck>
                        <template v-else>
                            {{ index + 1 }}
                        </template>
                    </div>
                    <div v-if="index > 0 && index < steps.length - 1">
                        <div
                            style="
                                font-size: small;
                                border-radius: 5px;
                                color: white;
                                padding: 2px 8px;
                            "
                            :style="{
                                background: stateColors[step.state].highlight,
                                color: stateColors[step.state].highlightText,
                            }"
                        >
                            1
                        </div>
                    </div>
                </div>
                <div style="text-align: start" :style="{ color: stateColors[step.state].text }">
                    {{ step.title }}
                </div>
                <div
                    class="selectedHint"
                    style="width: 100%; position: absolute; bottom: 0; left: 0"
                    :style="{
                        height: currentTab === index ? '10px' : '0',
                        background: stateColors[step.state].highlight,
                    }"
                ></div>
            </VCard>
        </VContainer>
        <TabTransition v-model="currentTab" :tab-slots="steps.length">
            <template v-for="(step, index) in steps" #[index] :key="index">
                <component :is="step.comp" :somente-leitura="modoSomenteLeitura"></component>
            </template>
        </TabTransition>
    </VContainer>
</template>

<style>
.tabButton {
    display: flex !important;
    flex-direction: column;
    flex: 1;
    gap: 10px !important;
    border: 2px solid !important;
    background-color: hsl(var(--hover-color), var(--selected)) !important;
    justify-content: flex-start !important;
    min-width: 150px;
}
.selectedHint {
    transition: all 0.1s !important;
}
.infoHeader {
    color: hsl(0, 0%, 30%);
}
.process-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
}

.process-actions__right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
    margin-left: auto;
}

.detailsButton {
    text-transform: none;
}

.processActionButton {
    height: 38px !important;
}

.processActionIcon {
    margin-right: 6px;
}

.exportSpreadsheetButton {
    width: 38px;
    min-width: 38px !important;
    padding: 0 !important;
}

.iconOnlyActionButton {
    width: 38px;
    min-width: 38px !important;
    padding: 0 !important;
}

.acompanhamento-status-card {
    position: relative;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 18px;
    overflow: hidden;
    padding: 18px 18px 18px 22px !important;
    border: 1px solid var(--status-border) !important;
    border-radius: 8px !important;
    background: linear-gradient(135deg, var(--status-surface), #ffffff 54%) !important;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08) !important;
}

.acompanhamento-status-card::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--status-accent);
    content: "";
}

.acompanhamento-status-main {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 14px;
}

.status-emblem {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    flex: 0 0 46px;
    border: 1px solid color-mix(in srgb, var(--status-accent) 22%, transparent);
    border-radius: 8px;
    background: var(--status-chip);
    color: var(--status-accent);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.status-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.status-chip {
    color: var(--status-accent) !important;
    font-weight: 700 !important;
}

.status-label {
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
}

.status-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 8px;
    text-align: start;
}

.status-copy strong {
    color: #0f172a;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
}

.status-meta {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    flex-wrap: wrap;
    gap: 6px 12px;
    max-width: 100%;
    padding: 7px 10px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.76);
    color: #475569;
    font-size: 13px;
}

.status-meta-item {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: 6px;
}

.status-meta span {
    color: #64748b;
    font-weight: 600;
}

.status-meta strong {
    overflow-wrap: anywhere;
    color: #1e293b;
    font-size: 13px;
    font-weight: 700;
}

.acompanhamento-status-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    max-width: 440px;
    padding-left: 18px;
    border-left: 1px solid rgba(148, 163, 184, 0.28);
}

.status-icon-button {
    width: 40px !important;
    height: 40px !important;
    border-radius: 8px !important;
    border-color: rgba(39, 70, 117, 0.28) !important;
    color: rgb(var(--v-theme-primary)) !important;
    background: rgba(255, 255, 255, 0.68) !important;
}

.send-analysis-button {
    min-height: 40px !important;
    gap: 8px;
    border-radius: 8px !important;
    text-transform: none;
    white-space: normal;
    box-shadow: 0 10px 22px rgba(39, 70, 117, 0.18) !important;
}

.analysis-action-button {
    min-height: 40px !important;
    gap: 8px;
    border-radius: 8px !important;
    text-transform: none;
    white-space: normal;
}

.analysis-dialog-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
}

div.send-analysis-dialog-card {
    gap: 14px;
    padding: 18px !important;
    border: var(--border);
    border-radius: 8px !important;
    background: white;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.16) !important;
}

.analysis-dialog-header,
.analysis-dialog-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.analysis-dialog-header h3 {
    margin: 0;
}

.send-analysis-dialog-heading {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
}

.send-analysis-dialog-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 8px;
    background: #eef2ff;
    color: rgb(var(--v-theme-primary));
}

.analysis-dialog-message {
    margin: 0;
    color: #374151;
    text-align: start;
}

.send-analysis-dialog-message {
    padding: 12px;
    border: var(--border);
    border-radius: 8px;
    background: #f5f7fb;
    font-size: 14px;
    line-height: 1.45;
}

.analysis-dialog-actions {
    justify-content: flex-end;
}

.pendencias-box {
    flex-basis: 100%;
    padding: 12px;
    border: 1px solid #fed7aa;
    border-radius: 8px;
    background: #fff7ed;
    color: #7c2d12;
    text-align: start;
}

.pendencias-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 700;
}

.pendencias-box ul {
    margin: 0;
    padding-left: 22px;
}

.pendencias-box li {
    margin: 4px 0;
}

@media (max-width: 760px) {
    .acompanhamento-status-card {
        grid-template-columns: 1fr;
        padding: 16px 14px 16px 18px !important;
    }

    .acompanhamento-status-actions {
        width: 100%;
    }

    .acompanhamento-status-main {
        align-items: flex-start;
    }

    .acompanhamento-status-actions {
        justify-content: flex-start;
        max-width: none;
        padding-top: 14px;
        padding-left: 0;
        border-top: 1px solid rgba(148, 163, 184, 0.28);
        border-left: 0;
    }
}
</style>
