export type CreateObject = {
    id: number | null
}

export interface ProcessoRequest {
    nome: string
    objetivosGerais: string
    objetivosEstrategicos: string
    unidadeOrganizacional: { id: number | null }
    responsavel: CreateObject
}
