import type { Risco } from "./risco"
import type { Usuario } from "./usuario"

export type OcorrenciaRisco = {
    id: number
    risco: Risco
    dataOcorrencia: string
    responsavelRegistro: Usuario
    responsavelSolucao: string
    descricao: string
    criadoEm: Date
    atualizadoEm: Date
    resultados: string
    solucao: stirng
}
