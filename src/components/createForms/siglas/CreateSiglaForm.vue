<script setup lang="ts">
import { IconEdit, IconPencilPlus } from "@tabler/icons-vue"
import { reactive, ref, watch } from "vue"
import { type VForm } from "vuetify/components"
import type { Sigla } from "../../../types/sigla"
import { siglaDefault } from "./sigla"

interface Props {
    closeDialog: () => void
    createSigla: (data: { sigla: string; descricao: string; processId: number | null }) => Promise<void>
    updateSigla: (data: { sigla: string; descricao: string; processId: number | null }) => Promise<void>
    isEditing?: boolean
    editingSigla?: Sigla | null
    processId: number | null
}

const props = withDefaults(defineProps<Props>(), {
    isEditing: false,
    editingSigla: null,
})

const formRef = ref<VForm>()
const isLoading = ref(false)

const siglaForm = reactive({
    sigla: siglaDefault.sigla,
    descricao: siglaDefault.descricao,
    processId: siglaDefault.processId,
})

const resetForm = () => {
    siglaForm.sigla = siglaDefault.sigla
    siglaForm.descricao = siglaDefault.descricao
    siglaForm.processId = props.processId
    formRef.value?.resetValidation()
}

watch(
    () => props.editingSigla,
    (editing) => {
        if (editing && props.isEditing) {
            siglaForm.sigla = editing.sigla
            siglaForm.descricao = editing.descricao ?? ""
            siglaForm.processId = props.processId
            return
        }
        siglaForm.sigla = siglaDefault.sigla
        siglaForm.descricao = siglaDefault.descricao
        siglaForm.processId = props.processId
        formRef.value?.resetValidation()
    },
    { immediate: true }
)

const siglaRules = [
    (value: string) => (value && value.trim() !== "") || "A sigla é obrigatória."
]

const descricaoRules = [
    (value: string) => (value && value.trim() !== "") || "A descrição é obrigatória.",
]

const submitForm = async () => {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    if (!props.processId) {
        console.error("Processo não informado para cadastro/edição da sigla.")
        return
    }

    const payload = {
        sigla: siglaForm.sigla.trim(),
        descricao: siglaForm.descricao.trim(),
        processId: props.processId,
    }

    isLoading.value = true
    try {
        if (props.isEditing) {
            await props.updateSigla(payload)
        } else {
            await props.createSigla(payload)
        }

        formRef.value.reset()
        props.closeDialog()
    } catch (error) {
        console.error("Erro ao processar sigla:", error)
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
                    {{ isEditing ? "Editar Sigla" : "Nova Sigla" }}
                </h2>
            </div>

            <div class="col" style="padding: 0 20px; gap: 15px">
                <VTextField
                    v-model="siglaForm.sigla"
                    label="Sigla*"
                    :rules="siglaRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Digite a sigla"
                    required
                />
                <VTextarea
                    v-model="siglaForm.descricao"
                    label="Descrição*"
                    :rules="descricaoRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Digite a descrição da sigla"
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

.col {
    display: flex;
    flex-direction: column;
}
</style>
