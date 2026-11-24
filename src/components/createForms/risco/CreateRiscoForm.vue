<script setup lang="ts">
import { onBeforeUnmount, ref, type Ref } from "vue"
import { notEmptyRule, objectNotEmptyRule } from "../../../core/textFieldRules"
import { categoriaIntegridade, risco, selectItems } from "./risco"
import type { VForm } from "vuetify/components"
import { type Icon } from "@tabler/icons-vue"
import tipoRiscoIntegridadeService from "../../../services/tipoRiscoIntegridadeService"
import categoriaService from "../../../services/categoriaService"

defineProps<{
    closeDialog: () => void
    save: () => Promise<void>
    title: string
    icon: Icon
}>()
;(async () => {
    selectItems.value = {
        tipoRiscoIntegridade: (await tipoRiscoIntegridadeService.getAll()).content,
        categoria: (await categoriaService.getAll()).content,
    }

    categoriaIntegridade.value = selectItems.value.categoria.find(
        (cat) => cat.nome.toUpperCase() === "INTEGRIDADE"
    )
})()

const form: Ref<VForm | undefined> = ref()

onBeforeUnmount(() => {
    form.value?.reset()
})
</script>

<template>
    <VForm ref="form">
        <VCard class="col">
            <div class="row" style="align-items: center; margin-bottom: 20px; margin-left: 5px">
                <div
                    style="
                        padding: 6px;
                        border-radius: 8px;
                        background: rgb(var(--v-theme-primary));
                    "
                >
                    <component :is="icon" color="white" style="vertical-align: bottom"></component>
                </div>
                <h2>{{ title }}</h2>
            </div>
            <div style="padding: 0 20px; gap: 15px" class="col">
                <VTextField
                    label="Fase do Processo"
                    :rules="[notEmptyRule]"
                    v-model="risco.faseProcesso"
                ></VTextField>
                <VTextField
                    v-model="risco.nome"
                    :rules="[notEmptyRule]"
                    label="Nome do Risco"
                ></VTextField>
                <VSelect
                    label="Tipo de Risco"
                    :rules="[objectNotEmptyRule]"
                    :items="[
                        ['AMEACA', 'Ameaça'],
                        ['OPORTUNIDADE', 'Oportunidade'],
                    ]"
                    item-value="[0]"
                    item-title="[1]"
                    v-model="risco.tipoRisco"
                ></VSelect>
                <VSelect
                    item-value="id"
                    item-title="nome"
                    label="Categoria"
                    :rules="[objectNotEmptyRule]"
                    v-model="risco.categoria.id"
                    :items="selectItems.categoria"
                ></VSelect>
                <VSelect
                    v-if="
                        risco.categoria.id === categoriaIntegridade?.id &&
                        risco.tipoRiscoIntegridade
                    "
                    item-value="id"
                    item-title="nome"
                    label="Tipo de risco de Integridade"
                    :rules="[objectNotEmptyRule]"
                    v-model="risco.tipoRiscoIntegridade.id"
                    :items="selectItems.tipoRiscoIntegridade"
                ></VSelect>
                <VTextField
                    label="Causas"
                    :rules="[notEmptyRule]"
                    v-model="risco.causa"
                ></VTextField>
                <VTextField
                    label="Consequências"
                    :rules="[notEmptyRule]"
                    v-model="risco.consequencias"
                ></VTextField>
            </div>
            <div class="row" style="justify-content: end">
                <VBtn variant="outlined" @click="closeDialog()">Cancelar</VBtn>
                <VBtn
                    :onclick="
                        async () => {
                            form?.validate()
                            await save()
                            closeDialog()
                        }
                    "
                    >Confirmar</VBtn
                >
            </div>
        </VCard>
    </VForm>
</template>

<style>
.treeField {
    height: 56px !important;
    margin-bottom: 23px;
    place-content: center start;
    color: black !important;
    border: 1px solid hsl(0, 0%, 70%);
}
</style>
