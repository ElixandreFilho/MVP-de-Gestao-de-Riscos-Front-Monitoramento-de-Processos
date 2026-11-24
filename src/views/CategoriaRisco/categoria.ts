import { ref } from "vue"
import axios from "axios"
import "../../core/axiosConfig"
import type { SpringPage } from "../../types/page"

const categoriaRoute = "/categoriasRisco"
export const errorMessage = ref<string>("")

export interface Categoria {
    id?: number 
    nome: string
    persistente: boolean
}

export const categorias = ref<Categoria[]>([])
export const showNewDialog = ref(false)
export const isEditing = ref(false)
export const editingCategoria = ref<Categoria | null>(null)

const normalizeNome = (nome: string) => nome.trim().toLowerCase()

const hasDuplicateCategoria = (nome: string, ignoreId?: number) => {
    const normalizedNome = normalizeNome(nome)

    return categorias.value.some(
        categoria => categoria.id !== ignoreId && normalizeNome(categoria.nome) === normalizedNome,
    )
}

export const fetchCategorias = async () => {
    try {
        const pageSize = 100
        const firstResponse = await axios.get<SpringPage<Categoria>>(
            `${categoriaRoute}?page=0&size=${pageSize}`
        )

        const firstPage = firstResponse.data
        const allCategorias = [...(firstPage.content ?? [])]

        for (let page = 1; page < firstPage.totalPages; page++) {
            const response = await axios.get<SpringPage<Categoria>>(
                `${categoriaRoute}?page=${page}&size=${pageSize}`
            )
            allCategorias.push(...(response.data.content ?? []))
        }

        categorias.value = allCategorias
    } catch (error) {
        console.error("Erro ao carregar categorias:", error)
    }
}

export const addCategoria = async (nome: string) => {
    try {
        const normalizedNome = nome.trim()

        if (hasDuplicateCategoria(normalizedNome)) {
            throw new Error("Já existe uma categoria com esse nome.")
        }

        const response = await axios.post(categoriaRoute, { nome: normalizedNome })
        categorias.value.push(response.data)
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = typeof error.response?.data === "string"
                ? error.response.data
                : error.response?.data?.message ?? "Erro ao cadastrar categoria."

            throw new Error(message)
        }

        throw error
    }
}

export const updateCategoria = async (id: number, novoNome: string) => {
    try {
        const normalizedNome = novoNome.trim()

        if (hasDuplicateCategoria(normalizedNome, id)) {
            throw new Error("Já existe uma categoria com esse nome.")
        }

        const response = await axios.put(`${categoriaRoute}/${id}`, { 
            nome: normalizedNome 
        })

        const index = categorias.value.findIndex(c => c.id === id)
        
        if (index !== -1) {
            categorias.value[index] = response.data
        }

        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = typeof error.response?.data === "string"
                ? error.response.data
                : error.response?.data?.message ?? "Erro ao atualizar categoria."

            throw new Error(message)
        }

        throw error
    }
}

export const deleteCategoria = async (categoria: Categoria) => {
    if(categoria.persistente) {
        throw new Error("Esta categoria não pode ser excluída.")
    }
    try {
        await axios.delete(`${categoriaRoute}/${categoria.id}`)
        await fetchCategorias()
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message = typeof error.response?.data === "string"
                ? error.response.data
                : error.response?.data?.message ?? "Erro ao excluir categoria."

            throw new Error(message)
        }

        throw error
    }
}


const resetDialogState = () => {
    isEditing.value = false
    editingCategoria.value = null
    errorMessage.value = ""
}

export const openNewCategory = () => {
    resetDialogState()
    showNewDialog.value = true
}

export const openEditCategoriaDialog = (categoria: Categoria) => {
    if(categoria.persistente) {
        throw new Error("Esta categoria não pode ser editada.")
    }

    resetDialogState()
    isEditing.value = true
    editingCategoria.value = { ...categoria }
    showNewDialog.value = true
}

export const closeDialog = () => {
    showNewDialog.value = false
    resetDialogState()
}
