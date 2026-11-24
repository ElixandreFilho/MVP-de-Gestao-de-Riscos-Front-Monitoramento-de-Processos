import type { UnidadeOrganizacional } from "./unidadeOrganizacional"
import type { Usuario } from "./usuario"
import type { StatusAcompanhamentoProcesso } from "./acompanhamento"

export type Processo = {
    id: number
    nome: string
    unidadeOrganizacional: UnidadeOrganizacional
    responsavel: Usuario
    objetivosGerais: string
    objetivosEstrategicos: string
    criadoEm: string
    atualizadoEm: string
    dataConclusao: string
    statusAcompanhamento?: StatusAcompanhamentoProcesso
    analistaResponsavel?: Usuario | null
    segundoAnalista?: Usuario | null
    enviadoParaAnaliseEm?: string | null
    reenviadoParaAnaliseEm?: string | null
    analiseIniciadaEm?: string | null
    analiseConcluidaEm?: string | null
    ajusteSolicitadoEm?: string | null
    prazoAjuste?: string | null
    cicloAcompanhamento?: number
    emCicloRevisao?: boolean
    anoReferenciaPrazoEnvio?: number | null
    prazoEnvio?: string | null
    limiteAtrasoPrazoEnvio?: string | null
    envioPendente?: boolean
    envioAtrasado?: boolean
    riscos: Riscos[]
}
