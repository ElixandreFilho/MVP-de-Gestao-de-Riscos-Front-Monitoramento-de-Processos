import type { Risco } from "./risco"
import type { StatusImplementacao } from "./enums/statusImplementacao"

export type AtividadeControle = {
    id: number
    statusImplementacao: StatusImplementacao
    responsavelTratamento: string
    dataInicio: string
    dataTermino: string
    gatilho: string
    acoesContingencia: string
    responsavelContingencia: string
    risco: Risco
    atualizadoEm: Date
    acoesPreventivas: string
    monitoramentoAcoesPreventivas: string
}
