<script setup lang="ts">
import { IconEdit, IconPencilPlus } from "@tabler/icons-vue"
import { reactive, ref, watch } from "vue"
import { type VForm } from "vuetify/components"
import { unidadeTipoOptions } from "./unidade" 
import type { UnidadeOrganizacional } from "../../../types/unidadeOrganizacional"
import { TipoUnidade } from "../../../types/enums/tipoUnidade"

export interface UnidadePayload {
    id?: number
    codigo: string | null
    nome: string
    sigla: string
    isAdmin: boolean
    tipoUnidade: TipoUnidade | string | null 
    unidadeOrganizacionalPai: { id: number } | null
}
interface Props {
    closeDialog: () => void
    isEditing?: boolean
    editingUnidade?: UnidadeOrganizacional | null
    unidadePaiId?: number | null 
    isSector?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    closeDialog: () => {},
    isEditing: false,
    editingUnidade: null,
    unidadePaiId: null,
    isSector: false
})

const emit = defineEmits<{
    unitCreated: [data: UnidadePayload]
    unitUpdated: [data: UnidadePayload]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)


// Estado inicial conforme o banco
const unidadeForm = reactive({
    codigo: "",
    nome: "",
    sigla: "",
    isAdmin: false,
    tipoUnidade: null as string | null,
    unidadeOrganizacionalPai: props.unidadePaiId
})

const isRequiredTextFilled = (v: string | null) => !!v?.trim()

const rules = {
    required: [
        (v: string | null) => isRequiredTextFilled(v) || "Este campo é obrigatório"
    ],
    sigla: [
        (v: string) => isRequiredTextFilled(v) || "Sigla é obrigatória",
        (v: string) => /^[a-zA-Z\s-/]+$/.test(v) || "Apenas letras, espaços, hífen (-) e barra (/) são permitidos"]
}

const selectedTipo = ref<string | null>(null)
const resetForm = () => {
    unidadeForm.codigo = ""
    unidadeForm.nome = ""
    unidadeForm.sigla = ""
    selectedTipo.value = null
    unidadeForm.tipoUnidade = null
    formRef.value?.resetValidation()
}

// Observa se estamos editando para preencher os campos
watch(() => props.editingUnidade, (val) => {
    // 1. Se temos um valor e estamos editando, populamos o form
    if (val && props.isEditing) {
        unidadeForm.codigo = val.codigo || ""
        unidadeForm.nome = val.nome || ""
        unidadeForm.sigla = val.sigla || ""

        const t = val.tipoUnidade
        if (t === TipoUnidade.UNIDADE_ADMINISTRATIVA || String(t) === "UNIDADE_ADMINISTRATIVA") {
            unidadeForm.tipoUnidade = "Administrativa"
        } 
        else if (t === TipoUnidade.UNIDADE_ACADEMICA || String(t) === "UNIDADE_ACADEMICA") {
            unidadeForm.tipoUnidade = "Acadêmica"
        } 
        else if (typeof t === "object" && t !== null) {
            const objTipo = t as Record<string, unknown>
            const nomeEnum = String(objTipo.nome || objTipo.valor || "")            
            if (nomeEnum === "UNIDADE_ADMINISTRATIVA") unidadeForm.tipoUnidade = "Administrativa"
            else if (nomeEnum === "UNIDADE_ACADEMICA") unidadeForm.tipoUnidade = "Acadêmica"
        }
    } else {
        resetForm()
    }
}, { immediate: true })


const submitForm = async () => {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()
    if (!valid) return

    isLoading.value = true
    try {
        let tipoFinal: string | null = null
        if (unidadeForm.tipoUnidade === "Administrativa") tipoFinal = "UNIDADE_ADMINISTRATIVA"
        if (unidadeForm.tipoUnidade === "Acadêmica") tipoFinal = "UNIDADE_ACADEMICA"

        const payload = {
            codigo: unidadeForm.codigo.trim() || null,
            nome: unidadeForm.nome.trim(),
            sigla: unidadeForm.sigla.trim(),
            isAdmin: false,
            tipoUnidade: tipoFinal,
            unidadeOrganizacionalPai: props.unidadePaiId ? { id: props.unidadePaiId } : null
        }

        if (props.isEditing && props.editingUnidade) {
            emit("unitUpdated", { ...payload, id: props.editingUnidade.id })
        } else {
            emit("unitCreated", payload)
        }
    } finally {
        isLoading.value = false
    }
}


</script>

<template>
    <VForm ref="formRef" @submit.prevent="submitForm">
        <VCard class="col" style="padding: 20px; min-width: 500px">
            <div class="row" style="align-items: center; margin-bottom: 20px; gap: 10px">
                <div class="icon-container">
                    <IconEdit v-if="isEditing" color="white" :size="20" />
                    <IconPencilPlus v-else color="white" :size="20" />
                </div>
                <h2 style="margin: 0">
                    {{ isEditing ? 'Editar' : (isSector ? 'Novo' : 'Nova') }} 
                    {{ isSector ? 'Setor' : 'Unidade' }}
                </h2>            </div>

            <div class="col" style="padding: 0 20px; gap: 15px">
                <div class="row" style="gap: 15px">
                    <VTextField 
                        v-model="unidadeForm.codigo" 
                        label="Código" 
                        variant="outlined" 
                        density="comfortable" 
                        style="flex: 1" 
                    />
                    <VTextField 
                        v-model="unidadeForm.sigla" 
                        label="Sigla *"
                        variant="outlined" 
                        density="comfortable" 
                        style="flex: 1" 
                        :rules="rules.sigla" 
                    />
                </div>

                <VTextField 
                    v-model="unidadeForm.nome" 
                    label="Nome Completo *"
                    variant="outlined" 
                    density="comfortable" 
                    :rules="rules.required" 
                />

                <VSelect
                    v-model="unidadeForm.tipoUnidade"
                    label="Tipo *"
                    :items="unidadeTipoOptions"
                    variant="outlined"
                    density="comfortable"
                    :rules="rules.required"
                />
            </div>

            <div class="row" style="justify-content: flex-end; gap: 12px; margin-top: 20px; padding: 0 20px">
                <VBtn type="button" variant="outlined" @click="closeDialog">Cancelar</VBtn>
                <VBtn color="primary" :loading="isLoading" type="submit">
                    {{ isEditing ? "Atualizar" : "Confirmar" }}
                </VBtn>
            </div>
        </VCard>
    </VForm>
</template>

<style scoped>
.col { display: flex; flex-direction: column; }
.row { display: flex; align-items: center; }
.icon-container {
    padding: 8px; border-radius: 8px; background: rgb(var(--v-theme-primary));
    display: flex; align-items: center; justify-content: center;
}
</style>
