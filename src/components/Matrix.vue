<script setup lang="ts">
import { onMounted, ref } from "vue"
import avaliacaoRiscoControleService from "../services/avaliacaoRiscoControleService"
import dashboardService from "../services/dashboardService"
import SummaryCardsHome from "./SummaryCardsHome.vue"
import ButtonFilter from "./ButtonFilter.vue"

const matrixData = ref<number[][]>([
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
])

const labels = ["Risco Baixo", "Risco Médio", "Risco Alto", "Risco Extremo"]

const axisTitles = ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"]

const xTitles =  axisTitles
const yTitles =  axisTitles

const colorIndexMap: Record<number, string> = {
    1: "verde",
    2: "amarelo",
    3: "laranja",
    4: "vermelho"
}

const colorMap: Record<string, string> = {
    
    verde: "hsl(150, 50%, 40%)",
    
    amarelo: "hsl(50, 80%, 50%)", 
    
    laranja: "hsl(30, 80%, 50%)", 
    
    vermelho: "hsl(5, 70%, 52%)", 
}

const weights = [1, 2, 5, 8, 10]
const levelFor = (severity: number) => {
    if (severity <= 8) return colorMap.verde
    if (severity <= 25) return colorMap.amarelo
    if (severity <= 64) return colorMap.laranja
    return colorMap.vermelho
}

const summaryStats = ref({
    processesCount: 0,
    risksCount: 0,
    occurrencesCount: 0,
})

const currentFilters = ref({
    unidadeId: null as number | null,
    initialDate: "",
    finalDate: "",
})

const loadData = async () => {
    try {
        const data = await avaliacaoRiscoControleService.getRiskMatrixData(currentFilters.value)
        if (Array.isArray(data) && data.length === 5 && data.every((row) => Array.isArray(row) && row.length === 5)) {
            matrixData.value = data
        }
    } catch (error) {
        console.error("Erro ao carregar matriz de riscos", error)
    }

    try {
        summaryStats.value = await dashboardService.getOverview(currentFilters.value)
    } catch (error) {
        console.error("Erro ao carregar resumo do dashboard", error)
    }
}

const handleApplyFilters = async (payload: {
    name: string
    initialDate: string
    finalDate: string
    unitId: number | null
}) => {
    currentFilters.value = {
        unidadeId: payload.unitId,
        initialDate: payload.initialDate,
        finalDate: payload.finalDate,
    }
    await loadData()
}

const handleClearFilters = async () => {
    currentFilters.value = {
        unidadeId: null,
        initialDate: "",
        finalDate: "",
    }
    await loadData()
}

onMounted(loadData)

</script>

<template>
    <ButtonFilter @apply="handleApplyFilters" @clear="handleClearFilters"/>
    <SummaryCardsHome
        :processes-count="summaryStats.processesCount"
        :risks-count="summaryStats.risksCount"
        :occurrences-count="summaryStats.occurrencesCount"
        :selected-unit-id="currentFilters.unidadeId"
    />
    <div
        style="
            background: white;
            border: 1px solid hsl(0, 0%, 80%);
            border-radius: 10px;
            padding: 20px 20px;
            overflow: auto;
        "
    >
        <div
            style="display: grid; text-align: center"
            :style="{
                gridTemplateColumns: `fit-content(200px) fit-content(200px) repeat(${yTitles.length},2fr) fit-content(200px)`,
            }"
        >
            <div
                style="
                    place-content: center;
                    border: var(--border);
                    grid-column: 1/3;
                    grid-row: 1/3;
                    border-radius: 10px;
                    padding: 20px;
                "
            >
                Matriz de Riscos
            </div>
            <div
                style="
                    border-left: var(--border);
                    border-bottom: var(--border);
                    border-radius: 10px;
                    writing-mode: sideways-lr;
                    padding: 10px;
                    place-content: center;
                "
                :style="{ gridRow: `3/${3 + xTitles.length}`, gridColumn: 1 }"
            >
                Probabilidade
            </div>

            <div
                style="
                    border-right: var(--border);
                    border-top: var(--border);
                    border-radius: 10px;
                    padding: 5px;
                "
                :style="{ gridColumn: `3/${3 + xTitles.length}`, gridRow: 1 }"
            >
                Impacto
            </div>
            <div
                v-for="(title, index) in xTitles"
                :key="title"
                :style="{
                    gridColumn: 2,
                    gridRow: `${index + 3}`,
                    borderRadius:
                        index === 0
                            ? '10px 0 0 0'
                            : index === xTitles.length - 1
                            ? '0 0 0 10px'
                            : '',
                    borderBottom: index === xTitles.length - 1 ? 'var(--border)' : '',
                }"
                style="padding: 5px 10px; border-left: var(--border)"
                class="headerCell"
            >
                {{ title }}
            </div>

            <div
                v-for="(title, index) in yTitles"
                :key="title"
                :style="{
                    gridRow: 2,
                    gridColumn: `${index + 3}`,
                    borderRadius:
                        index === 0
                            ? '10px 0 0 0'
                            : index === yTitles.length - 1
                            ? '0 10px 0 0'
                            : '0',
                    borderRight: index === yTitles.length - 1 ? 'var(--border)' : '',
                }"
                style="padding: 5px; border-top: var(--border)"
                class="headerCell"
            >
                {{ title }}
            </div>
            <div :style="{ gridRow: 1, gridColumn: yTitles.length + 3 }"></div>
            <div
                class="headerCell"
                style="margin-left: 20px"
                :style="{ gridRow: 2, gridColumn: yTitles.length + 3 }"
            >
                Níveis
            </div>
            <div
                :style="{
                    gridColumn: yTitles.length + 3,
                    gridRow: index + 3,
                    backgroundColor: colorMap[colorIndexMap[index + 1] as string],
                    borderRadius:
                        index === 0
                            ? '10px 10px 0 0'
                            : index === labels.length - 1
                            ? '0 0 10px 10px'
                            : '',
                }"
                class="labelCell"
                v-for="(label, index) in labels"
                :key="label"
            >
                {{ index + 1 }} - {{ label }}
            </div>
            <template v-for="(row, indexX) in matrixData" :key="indexX">
                <div
                    v-for="(value, indexY) in row"
                    :key="indexY"
                    :style="{
                        borderRadius:
                            indexX === xTitles.length - 1 && indexY === yTitles.length - 1
                                ? '0 0 10px 0'
                                : indexX === 0 && indexY === 0
                                ? '10px 0px 0px 0'
                                : indexX === 0 && indexY === yTitles.length - 1
                                ? '0 10px 0 0'
                                : indexX === xTitles.length - 1 && indexY === 0
                                ? '0 0 0 10px'
                                : '0',

                        backgroundColor: levelFor(weights[indexX]! * weights[indexY]!),
                    }"
                    class="cell"
                    :class="
                        indexY === xTitles.length - 1 && indexX === 0
                            ? 'bottomLeft'
                            : indexY === 0 && indexX === yTitles.length - 1
                            ? 'topRight'
                            : ''
                    "
                >
                    {{ value }}
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.headerCell {
    font-size: 14px;
    color: hsl(0, 0%, 40%);
    place-content: center;
}
.cell,
.labelCell {
    outline: 1px solid white;
    color: white;
}
.cell {
    font-size: 2rem;
    position: relative;
    padding: 10px;
}
.labelCell {
    margin-left: 20px;
    padding: 5px 20px;
    place-content: center;
}

.bottomLeft,
.topRight {
    position: relative;
}

.topRight::before,
.bottomLeft::before {
    content: "";
    background: transparent;
    position: absolute;
    left: 0;
    top: 0;
}
.topRight::before {
    width: 7px;
    height: 100%;
    border-bottom: 1px solid hsl(0, 0%, 80%);
    transform: translate(-1px, 0px);
}
.bottomLeft::before {
    width: 100%;
    height: 7px;
    border-right: 1px solid hsl(0, 0%, 80%);
    transform: translate(0px, -1px);
}

</style>
