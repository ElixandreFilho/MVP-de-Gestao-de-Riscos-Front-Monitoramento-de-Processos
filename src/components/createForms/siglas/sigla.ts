export interface SiglaFormData {
    sigla: string
    descricao: string
    processId: number | null 
}

export const siglaDefault: SiglaFormData = {
    sigla: "",
    descricao: "",
    processId: null
}