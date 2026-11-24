import type { OpcaoTratamento } from "./enums/opcaoTratamento"
import type { Risco } from "./risco"

export type RespostaRisco = {
    id: number
    risco: Risco
    opcaoTratamento: OpcaoTratamento
    justificativa: string
    atualizadoEm: Date
}
