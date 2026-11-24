import type { SpringPage } from "./page"

export const StatusAcompanhamentoProcesso = {
    RASCUNHO: "RASCUNHO",
    AGUARDANDO_ANALISE: "AGUARDANDO_ANALISE",
    EM_ANALISE: "EM_ANALISE",
    EM_AJUSTE: "EM_AJUSTE",
    CONCLUIDO: "CONCLUIDO",
    PENDENTE_REVISAO: "PENDENTE_REVISAO",
} as const

export type StatusAcompanhamentoProcesso =
    (typeof StatusAcompanhamentoProcesso)[keyof typeof StatusAcompanhamentoProcesso]

export const AcompanhamentoAcao = {
    ENVIAR_ANALISE: "ENVIAR_ANALISE",
    CANCELAR_ENVIO: "CANCELAR_ENVIO",
    ATRIBUIR_ANALISTA: "ATRIBUIR_ANALISTA",
    INICIAR_ANALISE: "INICIAR_ANALISE",
    SOLICITAR_AJUSTES: "SOLICITAR_AJUSTES",
    REENVIAR_AJUSTADO: "REENVIAR_AJUSTADO",
    FINALIZAR_ANALISE: "FINALIZAR_ANALISE",
    CANCELAR_ANALISE: "CANCELAR_ANALISE",
    INICIAR_REVISAO: "INICIAR_REVISAO",
    VER_HISTORICO: "VER_HISTORICO",
    VER_DOCUMENTOS: "VER_DOCUMENTOS",
} as const

export type AcompanhamentoAcao = (typeof AcompanhamentoAcao)[keyof typeof AcompanhamentoAcao]

export type UsuarioResumo = {
    id: number
    nome: string
    email: string
}

export type AcompanhamentoProcessoResumo = {
    id: number
    nome: string
    unidadeId: number | null
    unidadeNome: string | null
    unidadeSigla: string | null
    setorId: number | null
    setorNome: string | null
    setorSigla: string | null
    responsavelId: number | null
    responsavelNome: string | null
    analistaResponsavel: UsuarioResumo | null
    segundoAnalista: UsuarioResumo | null
    statusAcompanhamento: StatusAcompanhamentoProcesso
    enviadoParaAnaliseEm: string | null
    reenviadoParaAnaliseEm: string | null
    analiseIniciadaEm: string | null
    analiseConcluidaEm: string | null
    ajusteSolicitadoEm: string | null
    prazoAjuste: string | null
    alertaPrazoAjuste: boolean
    prazoAjusteVencido: boolean
    anoReferenciaPrazoEnvio: number | null
    prazoEnvio: string | null
    limiteAtrasoPrazoEnvio: string | null
    envioPendente: boolean
    envioAtrasado: boolean
    emCicloRevisao: boolean
    cicloAcompanhamento: number
    acoesDisponiveis: AcompanhamentoAcao[]
}

export type AcompanhamentoIndicadores = {
    aguardandoAnalise: number
    emAnalise: number
    emAjuste: number
    concluidos: number
    pendenteRevisao: number
}

export type PendenciasProcesso = {
    processoId: number
    aptoParaEnvio: boolean
    pendencias: string[]
}

export type HistoricoAcompanhamento = {
    id: number
    tipo: string
    criadoEm: string
    usuario: UsuarioResumo | null
    statusAnterior: StatusAcompanhamentoProcesso | null
    statusNovo: StatusAcompanhamentoProcesso | null
    observacao: string | null
    ciclo: number
}

export type NotificacaoAcompanhamento = {
    id: number
    titulo: string
    descricao: string
    processoId: number | null
    processoNome: string | null
    tipo: string
    destino: "PROCESSO" | "ANALISE" | "HISTORICO" | "DOCUMENTOS"
    criadoEm: string
    lida: boolean
}

export type AnalistaCarga = UsuarioResumo & {
    processosAtribuidos: number
    processosEmAnalise: number
    processosAguardandoAnalise: number
}

export type PrazoRevisao = {
    id: number
    anoReferencia: number
    prazo: string
    limiteAtraso: string
    responsavel: UsuarioResumo | null
    criadoEm: string
    atualizadoEm: string
    prazoProximo: boolean
    prazoVencido: boolean
    prazoAtrasoVencido: boolean
}

export type AcompanhamentoFilters = {
    nome?: string
    dataInicial?: string
    dataFinal?: string
    unidadeId?: number | null
    status?: StatusAcompanhamentoProcesso | ""
    analistaId?: number | null
}

export type AcompanhamentoPage = SpringPage<AcompanhamentoProcessoResumo>

