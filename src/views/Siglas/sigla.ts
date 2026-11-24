import { ref } from "vue"
import type { Sigla } from "../../types/sigla"
import axios from "axios"
import type { SpringPage } from "../../types/page"

const siglaRoute = "/siglas"
export const errorMessage = ref<string>("")

export const siglas = ref<Sigla[]>([])
export const showNewDialog = ref(false)
export const isEditing = ref(false)
export const editingSigla = ref<Sigla | null>(null)
export const isLoadingSiglas = ref(false)
export const hasErrorSiglas = ref(false)

export const fetchSiglas = async (processoId?: number | null, signal? : AbortSignal): Promise<Sigla []> => {
    const pageSize = 100
    const url = processoId ? `${siglaRoute}/processo/${processoId}` : siglaRoute
  
    const firstResponse = await axios.get<SpringPage<Sigla>>(
        `${url}?page=1&size=${pageSize}`,
        { signal }
    )
  
    const allSiglas = [...(firstResponse.data.content ?? [])]
  
    for (let page = 2; page <= firstResponse.data.totalPages; page++) {
        const response = await axios.get<SpringPage<Sigla>>(
            `${url}?page=${page}&size=${pageSize}`,
            { signal }
        )
        allSiglas.push(...(response.data.content ?? []))
    }
    return allSiglas
}

export const addSigla = async (sigla: string, descricao: string, processoId: number) => {
    try {
        const payload = {
            sigla: sigla.trim(),
            descricao: descricao.trim(),
            processo: { id: processoId },
        }

        const response = await axios.post(siglaRoute, payload)
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 409) {
                errorMessage.value = "Já existe uma sigla com essa combinação."
                throw new Error("Já existe uma sigla com essa combinação.")
            }

            const message =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ?? JSON.stringify(error.response?.data) ?? "Erro ao cadastrar sigla"
            errorMessage.value = message
            throw new Error(message)
        }
        throw error
    }
}

export const updateSigla = async (
    id: number,
    sigla: string,
    descricao: string,
    processoId: number
) => {
    try {
        const payload = {
            sigla: sigla.trim(),
            descricao: descricao.trim(),
            processo: { id: processoId },
        }

        const response = await axios.put(`${siglaRoute}/${id}`, payload)
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 409) {
                errorMessage.value = "Já existe uma sigla com essa combinação."
                throw new Error("Já existe uma sigla com essa combinação.")
            }

            const message =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ?? JSON.stringify(error.response?.data) ?? "Erro ao atualizar sigla"
            errorMessage.value = message
            throw new Error(message)
        }
        throw error
    }
}

export const deleteSigla = async (siglaId: number) => {
    try {
        await axios.delete(`${siglaRoute}/${siglaId}`)
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message =
                typeof error.response?.data === "string"
                    ? error.response.data
                    : error.response?.data?.message ?? "Erro ao excluir sigla"
            throw new Error(message)
        }
        throw error
    }
}

const resetDialogState = () => {
    isEditing.value = false
    editingSigla.value = null
    errorMessage.value = ""
}

export const clearSiglasState = () => {
    siglas.value = []
}

export const openNewSigla = () => {
    resetDialogState()
    showNewDialog.value = true
}

export const openEditSiglaDialog = (sigla: Sigla) => {
    resetDialogState()
    isEditing.value = true
    editingSigla.value = { ...sigla }
    showNewDialog.value = true
}

export const closeDialog = () => {
    showNewDialog.value = false
    resetDialogState()
}