export interface UnidadeFormData {
    nome: string
    tipoUnidade: string
}

export const unidadeDefault: UnidadeFormData = {
    nome: "",
    tipoUnidade: "",
}

export const unidadeTipoOptions: string[] = ["Administrativa", "Acad\u00eamica"]
