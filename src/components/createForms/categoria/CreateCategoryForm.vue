<script setup lang="ts">
import { IconEdit, IconPencilPlus } from "@tabler/icons-vue"
import { reactive, ref, watch } from "vue"
import { type VForm } from "vuetify/components"
import type { Categoria } from "../../../views/CategoriaRisco/categoria"
import { categoriaDefault } from "./categoria"

interface Props {
    closeDialog: () => void
    createCategory: (data: { nome: string }) => Promise<void>
    updateCategory: (data: { nome: string }) => Promise<void>
    isEditing?: boolean
    editingCategoria?: Categoria | null
}

const props = withDefaults(defineProps<Props>(), {
    isEditing: false,
    editingCategoria: null,
})

const formRef = ref<VForm>()
const isLoading = ref(false)
const categoriaForm = reactive({ nome: categoriaDefault.nome })



const resetForm = () => {
    categoriaForm.nome = categoriaDefault.nome
    formRef.value?.resetValidation()
}

watch(
    () => props.editingCategoria,
    (editingCategory) => {
        if (editingCategory && props.isEditing) {
            categoriaForm.nome = editingCategory.nome
            return
        }
        resetForm()
    },
    { immediate: true }
)

const nameRules = [
    (value: string) => !!value || "O nome da categoria e obrigatorio.",
    (value: string) =>
        value.length <= 100 || "O nome da categoria deve ter no maximo 100 caracteres.",
]

const submitForm = async () => {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    isLoading.value = true

    try {
        const payload = {
            nome: categoriaForm.nome.trim(),
        }

        if (props.isEditing) {
            await props.updateCategory(payload)
        } else {
            await props.createCategory(payload)
        }

        formRef.value.reset()
        props.closeDialog()
    } catch (error) {
        console.error("Erro ao processar categoria:", error)
    } finally {
        isLoading.value = false
    }
}

const cancelForm = () => {
    resetForm()
    props.closeDialog()
}
</script>

<template>
    <VForm ref="formRef" @submit.prevent="submitForm">
        <VCard class="col" style="padding: 20px; min-width: 500px">
            <div class="row" style="align-items: center; margin-bottom: 20px; gap: 10px">
                <div
                    style="
                        padding: 8px;
                        border-radius: 8px;
                        background: rgb(var(--v-theme-primary));
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    "
                >
                    <IconEdit v-if="isEditing" color="white" :size="20" />
                    <IconPencilPlus v-else color="white" :size="20" />
                </div>
                <h2 style="margin: 0">
                    {{ isEditing ? "Editar Categoria" : "Nova Categoria" }}
                </h2>
            </div>

            <div class="col" style="padding: 0 20px; gap: 15px">
                <VTextField
                    v-model="categoriaForm.nome"
                    label="Nome da Categoria"
                    :rules="nameRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Digite o nome da categoria"
                    required
                />
            </div>

            <div
                class="row"
                style="justify-content: flex-end; gap: 12px; margin-top: 20px; padding: 0 20px"
            >
                <VBtn variant="outlined" type="button" :disabled="isLoading" @click="cancelForm">
                    Cancelar
                </VBtn>

                <VBtn color="primary" type="button" :loading="isLoading" @click="submitForm">
                    {{ isEditing ? "Atualizar" : "Confirmar" }}
                </VBtn>
            </div>
        </VCard>
    </VForm>
</template>

<style scoped>
.row {
    display: flex;
    align-items: center;
}
</style>
