import { ref } from "vue"

export interface Unidade {
    id: number
    nome: string
    tipoUnidade: string
    criadoEm: string
    qtdSetores?: number
}

export interface Subunidade {
    id: number
    nome: string
    criadoEm: string
    unidadeId: number
}

export interface Setor {
    id: number
    nome: string
    criadoEm: string
    subunidadeId: number
    descricao?: string
    responsavel?: string
    qtdFuncionarios?: number
}

export const unidades = ref<Unidade[]>([])
export const subunidades = ref<Subunidade[]>([])
export const setores = ref<Setor[]>([])
export const selectedSetor = ref<Setor | null>(null)

export const showNewDialog = ref(false)
export const isEditing = ref(false)
export const editingUnidade = ref<Unidade | null>(null)
export const editingSubunidade = ref<Subunidade | null>(null)
export const editingSetor = ref<Setor | null>(null)

export const formDataSubunidade = ref<{ nome: string }>({
    nome: "",
})

const resetDialogState = () => {
    isEditing.value = false
    editingUnidade.value = null
    editingSubunidade.value = null
    editingSetor.value = null
    formDataSubunidade.value = { nome: "" }
}

export const openNewUnidadeDialog = () => {
    resetDialogState()
    showNewDialog.value = true
}

export const openEditUnidadeDialog = (unidade: Unidade) => {
    resetDialogState()
    isEditing.value = true
    editingUnidade.value = { ...unidade }
    showNewDialog.value = true
}

export const openNewSubunidadeDialog = () => {
    resetDialogState()
    showNewDialog.value = true
}

export const openEditSubunidadeDialog = (subunidade: Subunidade) => {
    resetDialogState()
    isEditing.value = true
    editingSubunidade.value = { ...subunidade }
    formDataSubunidade.value = {
        nome: subunidade.nome,
    }
    showNewDialog.value = true
}

export const openNewSetorDialog = () => {
    resetDialogState()
    showNewDialog.value = true
}

export const openEditSetorDialog = (setor: Setor) => {
    resetDialogState()
    isEditing.value = true
    editingSetor.value = { ...setor }
    showNewDialog.value = true
}

export const closeDialog = () => {
    showNewDialog.value = false
    resetDialogState()
}
