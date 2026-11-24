import type { CategoriaRisco } from "./categoriaRisco"
import type { TipoRisco } from "./enums/tipoRisco"
import type { OcorrenciaRisco } from "./ocorrenciaRisco"
import type { TipoRiscoIntegridade } from "./tipoRiscoIntegridade"

export type Risco = {
    id: number
    nome: string
    faseProcesso: string
    tipoRisco: TipoRisco
    categoria: CategoriaRisco
    tipoRiscoIntegridade: TipoRiscoIntegridade
    causa: string
    consequencias: string
    criadoEm: Date
    atualizadoEm: Date
    processo: Processo
    avaliacaoRiscoControle: AvaliacaoRiscoControle[]
    respostaRisco: RespostaRisco[]
    atividadeControle: AtividadeControle[]
    ocorrenciaRisco: OcorrenciaRisco[]
}
