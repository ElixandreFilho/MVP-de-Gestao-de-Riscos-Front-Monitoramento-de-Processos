<script setup lang="ts">
import { computed } from "vue"
import type { Icon } from "@tabler/icons-vue"
import type { Risco } from "../../../types/risco"

const props = defineProps<{
    closeDialog: () => void
    risco: Risco
    title: string
    icon: Icon
}>()

const showTipoRiscoIntegridade = computed(() => {
    const categoriaNome = (props.risco.categoria?.nome ?? "").trim().toUpperCase()
    const tipoIntegridadeNome = props.risco.tipoRiscoIntegridade?.nome
    return categoriaNome === "INTEGRIDADE" && Boolean(tipoIntegridadeNome)
})
</script>

<template>
    <VCard class="col detailsCard">
        <div class="row detailsHeader">
            <div class="detailsIcon">
                <component :is="icon" class="detailsIconSvg"></component>
            </div>
            <h2>{{ title }}</h2>
        </div>

        <div class="col detailsContent">
            <div class="detailField">
                <small class="detailLabel">Fase do Processo</small>
                <p class="detailValue">
                    {{ risco.faseProcesso || "-" }}
                </p>
            </div>
            <div class="detailField">
                <small class="detailLabel">Nome do Risco</small>
                <p class="detailValue">
                    {{ risco.nome || "-" }}
                </p>
            </div>
            <div class="row detailsInlineFields">
                <div class="detailField detailsInlineField">
                    <small class="detailLabel">Tipo de Risco</small>
                    <p class="detailValue">
                        {{ risco.tipoRisco || "-" }}
                    </p>
                </div>
                <div class="detailField detailsInlineField">
                    <small class="detailLabel">Categoria</small>
                    <p class="detailValue">
                        {{ risco.categoria?.nome || "-" }}
                    </p>
                </div>
                <div v-if="showTipoRiscoIntegridade" class="detailField detailsInlineField">
                    <small class="detailLabel">Tipo de risco de Integridade</small>
                    <p class="detailValue">
                        {{ risco.tipoRiscoIntegridade?.nome || "-" }}
                    </p>
                </div>
            </div>
            <div class="detailField">
                <small class="detailLabel">Causas</small>
                <p class="detailValue">
                    {{ risco.causa || "-" }}
                </p>
            </div>
            <div class="detailField">
                <small class="detailLabel">Consequências</small>
                <p class="detailValue">
                    {{ risco.consequencias || "-" }}
                </p>
            </div>
        </div>

        <div class="row detailsActions">
            <VBtn variant="outlined" @click="closeDialog()">Fechar</VBtn>
        </div>
    </VCard>
</template>

<style scoped>
.detailsCard {
    max-height: min(760px, calc(100vh - 96px));
    overflow: hidden;
}

.detailsHeader {
    align-items: center;
    margin-bottom: 20px;
    margin-left: 5px;
}

.detailsIcon {
    padding: 6px;
    border-radius: 8px;
    background: rgb(var(--v-theme-primary));
}

.detailsIconSvg {
    color: white;
    vertical-align: bottom;
}

.detailsContent {
    padding: 0 20px;
    overflow-y: auto;
    min-height: 0;
    flex: 1;
}

.detailsInlineFields {
    flex-wrap: nowrap;
}

.detailsInlineField {
    flex: 1;
    min-width: 0;
}

.detailField {
    border: var(--border);
    border-radius: 8px;
    padding: 8px;
    background: hsl(0, 0%, 98%);
}

.detailLabel {
    display: block;
    color: hsl(0, 0%, 40%);
    margin-bottom: 4px;
}

.detailValue {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
}

.detailsActions {
    justify-content: end;
    margin-top: 16px;
}
</style>
