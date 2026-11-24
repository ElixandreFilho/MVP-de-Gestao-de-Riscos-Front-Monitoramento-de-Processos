import type { UnidadeOrganizacional } from "./unidadeOrganizacional"
import type { FuncaoKeycloak, Papel } from "./enums/papel"

export type Usuario = {
    id: number
    nome: string
    email: string
    senha: string
    cargo: string
    papel: Papel | null
    funcaoKeycloak?: FuncaoKeycloak | null
    unidadeOrganizacional: UnidadeOrganizacional | null
    idKeycloak: string
    ativo: boolean
}

export type AtualizacaoPerfilUsuario = {
    email: string
    nomeSocial: string
    nome: string
    idKeycloak: string
    papeis: Papel[]
}
