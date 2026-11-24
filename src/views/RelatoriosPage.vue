<script setup lang="ts">
import { IconFileText, IconAlertTriangle, IconTrendingUp } from "@tabler/icons-vue"
import { ref } from "vue"
import TreeViewField from "../components/TreeViewField.vue"
import { unidadesTree, type TreeNode } from "../core/unidades"

withDefaults(
    defineProps<{
        processesCount?: number
        risksCount?: number
        occurrencesCount?: number
    }>(),
    {
        processesCount: 5,
        risksCount: 14,
        occurrencesCount: 2,
    }
)

const filters = ref<{ unit: Partial<TreeNode> | undefined; period: string }>({
    unit: undefined,
    period: "",
})

const periodos = [
    "Todo o período",
    "Última semana",
    "Último mês",
    "Últimos 3 meses",
    "Últimos 6 meses",
    "Último ano",
]
</script>

<template>
    <VContainer class="col containerGap" fluid>
        <div class="row headerRow">
            <div style="text-align: start">
                <h2 class="pageTitle">Relatórios</h2>
                <h4 class="pageSubtitle">
                    Visualize estatísticas e métricas dos processos de gestão de riscos
                </h4>
            </div>
        </div>

        <VCard class="row filtersRow">
            <div class="filterField">
                Unidade
                <TreeViewField
                    v-model="filters.unit"
                    placeholder="Todas as unidades"
                    bg-color="hsl(0,0%,95%)"
                    color="none"
                    border="none"
                    :hide-details="true"
                    :items="unidadesTree"
                    :max-chars="30"
                    density="compact"
                />
            </div>

            <div class="filterField">
                Período
                <VSelect
                    v-model="filters.period"
                    :items="periodos"
                    placeholder="Todo o período"
                    density="compact"
                    variant="solo"
                    bg-color="hsl(0,0%,95%)"
                    class="filledField periodControl"
                    hide-details
                />
            </div>
        </VCard>

        <div class="cardsRow">
            <VCard class="vcard infoCard">
                <div class="col infoCardContent">
                    <div class="infoCardTitle">Total de Processos</div>
                    <div class="infoCardNumber">{{ processesCount }}</div>
                    <div class="infoCardSubtitle">Todos os processos da sua unidade</div>
                </div>
                <div class="iconContainer iconProcessos">
                    <IconFileText :size="15" />
                </div>
            </VCard>

            <VCard class="vcard infoCard">
                <div class="col infoCardContent">
                    <div class="infoCardTitle">Total de Riscos</div>
                    <div class="infoCardNumber">{{ risksCount }}</div>
                    <div class="infoCardSubtitle">Total de riscos identificados</div>
                </div>
                <div class="iconContainer iconRiscos">
                    <IconAlertTriangle :size="15" />
                </div>
            </VCard>

            <VCard class="vcard infoCard">
                <div class="col infoCardContent">
                    <div class="infoCardTitle">Ocorrências na Última Semana</div>
                    <div class="infoCardNumber">{{ occurrencesCount }}</div>
                    <div class="infoCardSubtitle">Ocorrências registradas</div>
                </div>
                <div class="iconContainer iconOcorrencias">
                    <IconTrendingUp :size="15" />
                </div>
            </VCard>
        </div>
    </VContainer>

</template>

<style scoped>
.containerGap {
    gap: 20px;
}
.headerRow {
    justify-content: space-between;
    align-items: center;
}
.pageTitle {
    padding: 0;
}
.pageSubtitle {
    text-wrap: wrap;
    color: hsl(0, 0%, 30%);
    padding: 0;
}
.filtersRow {
    justify-content: space-between;
    gap: 20px;
    flex: 1;
}
.filterField {
    font-size: 14px;
    text-align: start;
    flex: 1;
    min-width: 175px;
}

.infoCard {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.infoCardContent {
    gap: 6px;
    width: 100%;
}

.infoCardTitle {
    font-size: 12px;
    color: hsl(0, 0%, 40%);
}

.infoCardNumber {
    font-size: 28px;
    font-weight: 700;
}

.infoCardSubtitle {
    font-size: 12px;
    color: hsl(0, 0%, 50%);
}

.iconContainer {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.iconProcessos {
    background: hsl(210, 100%, 95%);
    color: hsl(210, 100%, 50%);
}
.iconRiscos {
    background: hsl(15, 100%, 95%);
    color: hsl(15, 100%, 50%);
}
.iconOcorrencias {
    background: hsl(0, 100%, 95%);
    color: hsl(0, 100%, 50%);
}
.periodControl .v-field {
    height: 40px !important;
    display: flex;
    align-items: center;
}

.periodControl .v-field__input {
    height: 40px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    display: flex;
    align-items: center;
}
.cardsRow {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}
@media (max-width: 900px) {
    .cardsRow {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 600px) {
    .cardsRow {
        grid-template-columns: 1fr;
    }
}
</style>
