export type MonitoramentoStatus = "RASCUNHO" | "AGUARDANDO_ANALISE" | "ACEITO" | "REJEITADO" | "AJUSTES_SOLICITADOS"
export type MonitoramentoOrigem = "UNIDADE" | "SECGOV"
export type MonitoramentoPerfil = "UNIDADE" | "SECGOV"
export type MonitoramentoContexto = "AUTORIA" | "ANALISE"
export type MonitoramentoDecisao = "ACEITAR" | "REJEITAR" | "SOLICITAR_AJUSTES"
export type MonitoramentoAcao = "EDITAR" | "ENVIAR_PARA_ANALISE" | "REENVIAR_AJUSTADO" | "ACEITAR" | "REJEITAR" | "SOLICITAR_AJUSTES" | "CANCELAR_ACEITE" | "CANCELAR_REJEICAO" | "CANCELAR_SOLICITACAO"
export type MonitoramentoNotificationType = "PROPOSTA_ENVIADA" | "PROPOSTA_ACEITA" | "PROPOSTA_REJEITADA" | "AJUSTES_SOLICITADOS" | "PROPOSTA_REENVIADA"
export type MonitoramentoAdjustmentStatus = "ABERTO" | "RESPONDIDO" | "ENCERRADO"

export interface MonitoramentoActor { id: string; nome: string; perfil: MonitoramentoPerfil; contexto: MonitoramentoContexto; unidadeSigla?: string; podeExportar: boolean }
export interface MonitoramentoAdjustmentPoint { id: string; descricao: string; campo?: string; status: MonitoramentoAdjustmentStatus; resposta?: string; solicitadoPor: string; solicitadoEm: string; respondidoEm?: string }
export interface MonitoramentoVersion { id: string; numero: number; criadoEm: string; criadoPor: string; resumo: string }
export interface MonitoramentoEvent { id: string; propostaId: string; tipo: string; resumo: string; actorId: string; actorNome: string; criadoEm: string; statusAnterior?: MonitoramentoStatus; statusNovo?: MonitoramentoStatus; versaoId?: string }

export interface MonitoramentoProposal {
    id: string
    nome: string
    unidade: string
    subunidade?: string
    ciclo: string
    status: MonitoramentoStatus
    origem: MonitoramentoOrigem
    responsavel: string
    autorId: string
    analista?: string
    analistaId?: string
    revisor?: string
    atencaoEspecial?: "Sim" | "Não"
    dataAtualizacao?: string
    programa?: string
    statusMapeamento?: string
    statusRiscosOrganizacionais?: string
    statusRiscosIntegridade?: string
    ultimaAtualizacao: string
    ultimaEnvio?: string
    descricao: string
    observacoes?: string
    justificativa?: string
    ajustes?: string
    versaoAtual: number
    versoes: MonitoramentoVersion[]
    pontosAjuste: MonitoramentoAdjustmentPoint[]
    historico: MonitoramentoEvent[]
}

export interface MonitoramentoNotification { id: string; propostaId: string; propostaNome: string; titulo: string; descricao: string; tipo: MonitoramentoNotificationType; eventoOrigemId: string; destinatarioId: string; rota: string; criadoEm: string; lida: boolean }
