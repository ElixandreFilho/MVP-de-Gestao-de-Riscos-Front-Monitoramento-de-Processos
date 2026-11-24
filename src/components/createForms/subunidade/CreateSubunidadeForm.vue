<script setup lang="ts">
import { IconEdit, IconPencilPlus } from "@tabler/icons-vue"
import { reactive, ref, watch } from "vue"
import { type VForm } from "vuetify/components"
import type { Subunidade } from "../../../views/Organizacoes/organizacao"
import { subunidadeDefault } from "./subunidade"

interface Props {
    closeDialog: () => void
    isEditing?: boolean
    editingSubunidade?: Subunidade | null
}

const props = withDefaults(defineProps<Props>(), {
    isEditing: false,
    editingSubunidade: null,
})

const emit = defineEmits<{
    subunidadeCreated: [data: { nome: string }]
    subunidadeUpdated: [data: { nome: string }]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)
const subunidadeForm = reactive({ ...subunidadeDefault })

const resetForm = () => {
    subunidadeForm.nome = subunidadeDefault.nome
    formRef.value?.resetValidation()
}

watch(
    () => props.editingSubunidade,
    (editingSubunidade) => {
        subunidadeForm.nome =
            editingSubunidade && props.isEditing ? editingSubunidade.nome : subunidadeDefault.nome
        formRef.value?.resetValidation()
    },
    { immediate: true }
)

const nameRules = [
    (value: string) => !!value || "O nome da subunidade e obrigatorio.",
    (value: string) =>
        value.length <= 100 || "O nome da subunidade deve ter no maximo 100 caracteres.",
]

const submitForm = async () => {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    isLoading.value = true

    try {
        const payload = { nome: subunidadeForm.nome.trim() }
        if (props.isEditing) {
            emit("subunidadeUpdated", payload)
        } else {
            emit("subunidadeCreated", payload)
        }
        resetForm()
        props.closeDialog()
    } catch (error) {
        console.error("Erro ao processar subunidade:", error)
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
                    {{ isEditing ? "Editar Subunidade" : "Nova Subunidade" }}
                </h2>
            </div>

            <div class="col" style="padding: 0 20px; gap: 15px">
                <VTextField
                    v-model="subunidadeForm.nome"
                    label="Nome da Subunidade"
                    :rules="nameRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Digite o nome da subunidade"
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
.col {
    display: flex;
    flex-direction: column;
}

.row {
    display: flex;
    align-items: center;
}
</style>
