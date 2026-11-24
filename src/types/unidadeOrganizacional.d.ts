import type { TipoUnidade } from "./enums/tipoUnidade"
import type { Processo } from "./processo"
import type { Usuario } from "./usuario"

export type UnidadeOrganizacional = {
    id: number
    nome: string
    tipoUnidade: TipoUnidade
    sigla: string
    unidadeOrganizacionalPai?: UnidadeOrganizacional
    unidadesOrganizacionais: UnidadeOrganizacional[]
    usuarios: Usuario[]
    processos: Processo[]
    isAdmin: boolean
    criadoEm: Date
    atualizadoEm: Date
    codigo: string | null
}
