import type { Risco } from "./risco"

export type AvaliacaoRiscoControle = {
    id: number
    risco: Risco
    probabilidade: number
    impacto: number
    fac: number
    controlesPreventivos: string
    controlesAtenuacao: string
    atualizadoEm: Date
    dataUltimaAvaliacao: string
}
