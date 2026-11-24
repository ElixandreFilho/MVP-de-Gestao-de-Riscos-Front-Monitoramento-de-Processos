<script setup lang="ts">
import { IconEdit, IconPencilPlus } from "@tabler/icons-vue"
import { reactive, ref, watch } from "vue"
import { type VForm } from "vuetify/components"
import type { Setor } from "../../../views/Organizacoes/organizacao"

interface Props {
    closeDialog: () => void
    isEditing?: boolean
    editingSetor?: Setor | null
}

const props = withDefaults(defineProps<Props>(), {
    isEditing: false,
    editingSetor: null,
})

const emit = defineEmits<{
    setorCreated: [data: { nome: string }]
    setorUpdated: [data: { nome: string }]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)
const setorForm = reactive({
    nome: "",
})

const resetForm = () => {
    setorForm.nome = ""
    formRef.value?.resetValidation()
}

watch(
    () => props.editingSetor,
    (editingSetor) => {
        setorForm.nome = editingSetor && props.isEditing ? editingSetor.nome : ""
        formRef.value?.resetValidation()
    },
    { immediate: true }
)

const nameRules = [
    (value: string) => !!value || "O nome do setor e obrigatorio.",
    (value: string) =>
        value.length <= 100 || "O nome do setor deve ter no maximo 100 caracteres.",
]

const submitForm = async () => {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    isLoading.value = true

    try {
        const payload = { nome: setorForm.nome.trim() }
        if (props.isEditing) {
            emit("setorUpdated", payload)
        } else {
            emit("setorCreated", payload)
        }
        resetForm()
        props.closeDialog()
    } catch (error) {
        console.error("Erro ao processar setor:", error)
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
                    {{ isEditing ? "Editar Setor" : "Novo Setor" }}
                </h2>
            </div>

            <div class="col" style="padding: 0 20px; gap: 15px">
                <VTextField
                    v-model="setorForm.nome"
                    label="Nome do Setor"
                    :rules="nameRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Digite o nome do setor"
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
