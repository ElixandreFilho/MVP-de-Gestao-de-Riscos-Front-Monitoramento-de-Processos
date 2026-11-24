<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from "vue"
import {
    IconChevronDown,
    IconChevronUp,
    IconDeviceFloppy,
    IconEdit,
    IconShieldCheck,
    IconX,
} from "@tabler/icons-vue"
import type { AvaliacaoRiscoControle } from "../../types/avaliacaoRiscoControle"
import avaliacaoRiscoControleService, {
    type FacOption,
} from "../../services/avaliacaoRiscoControleService"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import DatePicker from "../../components/DatePicker.vue"
import TooltipLabel from "../../components/TooltipLabel.vue"
import riscoService from "../../services/riscoService"
import type { DeepPartial } from "../../types/types"
import type { Risco } from "../../types/risco"
import { selectedProcesso } from "./processoPage"
import type { VForm } from "vuetify/components"
import { notEmptyRule, objectNotEmptyRule } from "../../core/textFieldRules"
import BackToTopButton from "../../components/BackToTopButton.vue"
import { formatDateForDisplay } from "../../core/utils"

const props = defineProps<{
    somenteLeitura?: boolean
}>()

const avaliacoes: Ref<DeepPartial<AvaliacaoRiscoControle & { index: number }>[]> = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const listLength = ref(0)
const facOptions = ref<FacOption[]>([])

const riscoName = ref("")
const typingTimeout = ref(null as ReturnType<typeof setTimeout> | null)

watch(riscoName, () => {
    if (typingTimeout.value) clearTimeout(typingTimeout.value)
    typingTimeout.value = setTimeout(async () => {
        await setUncompletedRiscos()
    }, 400)
})

const uncompletedRiscos: Ref<Partial<Risco>[]> = ref([])
const totalUncompletedRiscos = computed(() =>
    props.somenteLeitura ? 0 : uncompletedRiscos.value.length
)

type AvaliacaoTabRefs = {
    opened: Ref<number>
    update: Ref<number>
    avaliacao: Ref<number>
    model: Ref<DeepPartial<AvaliacaoRiscoControle>>
    formRef: Ref<VForm | undefined | null>
}

const tabRefs: Map<number, AvaliacaoTabRefs> = new Map()

const probabilidadeLabels = new Map([
    [1, "Muito baixa"],
    [2, "Baixa"],
    [5, "Média"],
    [8, "Alta"],
    [10, "Muito alta"],
])

const impactoLabels = new Map([
    [1, "Muito baixo"],
    [2, "Baixo"],
    [5, "Médio"],
    [8, "Alto"],
    [10, "Muito alto"],
])

const FAC_TOLERANCE = 0.000001

const classificacaoLabels = computed(
    () =>
        new Map<number, string>(
            facOptions.value.map((option) => [option.value, option.label])
        )
)

const findFacOption = (value?: number | null) => {
    if (value == null) return null

    return (
        facOptions.value.find(
            (option) => Math.abs(option.value - value) <= FAC_TOLERANCE
        ) ?? null
    )
}

const normalizeFac = (value?: number | null) => {
    if (value == null) return null
    if (facOptions.value.length === 0) return value
    return findFacOption(value)?.value ?? null
}

const getFacLabel = (value?: number | null) => {
    const normalizedValue = normalizeFac(value)
    if (normalizedValue == null) return "-"

    return classificacaoLabels.value.get(normalizedValue) ?? "-"
}

type RiscoLevel = {
    max: number
    label: string
    color: string
    textColor: string
}

const riscoLevels: RiscoLevel[] = [
    {
        max: 10,
        label: "Risco Baixo",
        color: "hsl(150, 50%, 40%)",
        textColor: "white",
    },
    {
        max: 40,
        label: "Risco Médio",
        color: "hsl(50, 80%, 50%)",
        textColor: "hsl(0, 0%, 20%)",
    },
    {
        max: 80,
        label: "Risco Alto",
        color: "hsl(30, 80%, 50%)",
        textColor: "white",
    },
    {
        max: Infinity,
        label: "Risco Extremo",
        color: "hsl(5, 70%, 52%)",
        textColor: "white",
    },
]

const getRiscoLevel = (riscoValue?: number | null) => {
    if (riscoValue == null || riscoValue <= 0) return null
    return riscoLevels.find((level) => riscoValue < level.max) ?? null
}

const getRiscoInerente = (tabRefs: AvaliacaoTabRefs | DeepPartial<AvaliacaoRiscoControle>) => {
    if ("update" in tabRefs) {
        const impacto = tabRefs.model.value?.impacto
        const probabilidade = tabRefs.model.value?.probabilidade
        if (impacto == null || probabilidade == null) return null
        return impacto * probabilidade
    } else {
        const impacto = tabRefs.impacto
        const probabilidade = tabRefs.probabilidade
        if (impacto == null || probabilidade == null) return null
        return impacto * probabilidade
    }
}

const getRiscoInerenteLabel = (tabRefs: AvaliacaoTabRefs | DeepPartial<AvaliacaoRiscoControle>) => {
    const riscoInerente = getRiscoInerente(tabRefs)
    return getRiscoLevel(riscoInerente)?.label ?? null
}

const calcRiscoResidual = (fac?: number | null, probabilidade?: number | null, impacto?: number | null) => {
    if (fac == null || probabilidade == null || impacto == null) return null
    return fac * probabilidade * impacto
}

type AvaliacaoComRiscoResidual = DeepPartial<AvaliacaoRiscoControle & { index: number }> & {
    riscoResidual: number | null
}

const avaliacoesComRiscoResidual = computed<AvaliacaoComRiscoResidual[]>(() =>
    avaliacoes.value.map((item) => ({
        ...item,
        riscoResidual: calcRiscoResidual(item.fac, item.probabilidade, item.impacto),
    }))
)

const getRiscoResidual = (tabRefs: AvaliacaoTabRefs) => {
    return calcRiscoResidual(
        tabRefs.model.value.fac,
        tabRefs.model.value.probabilidade,
        tabRefs.model.value.impacto
    )
}

const getRiscoResidualLabel = (tabRefs: AvaliacaoTabRefs) => {
    const riscoResidual = getRiscoResidual(tabRefs)
    return getRiscoLevel(riscoResidual)?.label ?? null
}

const getRiscoInerenteStyle = (tabRefs: AvaliacaoTabRefs | DeepPartial<AvaliacaoRiscoControle>) => {
    const level = getRiscoLevel(getRiscoInerente(tabRefs))
    return {
        borderRadius: "5px",
        padding: "2px 8px",
        width: "fit-content",
        background: level?.color ?? "hsl(0, 0%, 95%)",
        color: level?.textColor ?? "hsl(0, 0%, 40%)",
    }
}

const formatRiscoValue = (riscoValue?: number | null) => riscoValue ?? "-"

const getRiscoResidualStyle = (riscoResidual?: number | null) => {
    const level = getRiscoLevel(riscoResidual)
    return {
        borderRadius: "5px",
        padding: "2px 8px",
        width: "fit-content",
        background: level?.color ?? "hsl(0, 0%, 95%)",
        color: level?.textColor ?? "hsl(0, 0%, 40%)",
    }
}

const loadItems = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
    loading.value = true
    let offset = totalUncompletedRiscos.value - itemsPerPage * (page - 1)
    if (offset < 0) {
        offset = 0
    }
    let pageOffset = (totalUncompletedRiscos.value - offset) / itemsPerPage
    if (pageOffset > page) {
        pageOffset = page
    }
    if (offset > itemsPerPage) {
        offset = itemsPerPage
    }

    const res = await avaliacaoRiscoControleService.getAllByProcesso(
        page - pageOffset,
        itemsPerPage - offset,
        selectedProcesso.value!.id
    )
    const addedAvaliacoes: DeepPartial<AvaliacaoRiscoControle & { index: number }>[] = []
    for (let i = 0; i < offset; i++) {
        tabRefs.delete(-(i + 1))
        addedAvaliacoes.push({
            index: -(i + 1),
            risco: uncompletedRiscos.value[i + pageOffset * itemsPerPage],
        })
    }
    avaliacoes.value = addedAvaliacoes.concat(offset === itemsPerPage ? [] : res.content ?? [])
    loading.value = false
    pageSize.value = itemsPerPage
    currentPage.value = page
    listLength.value = res.totalElements + totalUncompletedRiscos.value
}

const getTabRefs = (id: number) => {
    const oldRefs = tabRefs.get(id)
    if (oldRefs !== undefined && props.somenteLeitura) {
        oldRefs.update.value = 0
    }

    if (oldRefs === undefined) {
        const newRefs: AvaliacaoTabRefs = {
            opened: ref(0),
            update: ref(!props.somenteLeitura && id < 0 ? 1 : 0),
            avaliacao: ref(0),
            model: ref({} as DeepPartial<AvaliacaoRiscoControle>),
            formRef: ref(),
        }
        tabRefs.set(id, newRefs)
        return newRefs
    }
    return oldRefs
}

const getItemKey = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) =>
    item.id ?? item.index!

const getItemTabRefs = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) =>
    getTabRefs(getItemKey(item))

const hasText = (value?: string | null) => Boolean(value?.trim())

const isItemFilled = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) =>
    item.probabilidade != null &&
    item.impacto != null &&
    item.fac != null &&
    hasText(item.controlesPreventivos) &&
    hasText(item.controlesAtenuacao) &&
    hasText(item.dataUltimaAvaliacao)

const getItemIconStyle = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) => ({
    background: isItemFilled(item) ? "hsl(215, 60%, 45%)" : "hsl(0, 0%, 92%)",
    borderRadius: "100%",
    placeContent: "center",
    padding: "6px",
    opacity: isItemFilled(item) ? "1" : "0.75",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
})

const getItemIconColor = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) =>
    isItemFilled(item) ? "white" : "hsl(0, 0%, 60%)"

const toggleItemDetails = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) => {
    const itemTabRefs = getItemTabRefs(item)
    itemTabRefs.opened.value = itemTabRefs.opened.value === 0 ? 1 : 0
}

const editItem = (item: DeepPartial<AvaliacaoRiscoControle & { index: number }>) => {
    if (props.somenteLeitura) return

    const itemTabRefs = getItemTabRefs(item)
    if (item.id != null) {
        setItemModel(itemTabRefs, item as AvaliacaoRiscoControle)
    }
    itemTabRefs.opened.value = 1
    itemTabRefs.update.value = 1
}

const saveUpdate = async (tabRefs: AvaliacaoTabRefs, id: number) => {
    if (props.somenteLeitura) return

    const formRef = getTabRefs(id).formRef.value
    const formRes = await formRef?.validate()
    if (!formRes?.valid) {
        showMessage("Preencha todos os campos obrigatórios.", "error")
        return
    }
    try {
        await avaliacaoRiscoControleService.update(tabRefs.model.value, id)
        showMessage("Avaliação salva com sucesso", "success")
        tabRefs.formRef.value?.reset()
        tabRefs.update.value = 0
        loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch {
        showMessage("Erro ao salvar avaliação", "error")
    }
}

const savePost = async (tabRefs: AvaliacaoTabRefs, index: number) => {
    if (props.somenteLeitura) return

    const formRef = getTabRefs(index).formRef.value
    const formRes = await formRef?.validate()

    if (!formRes?.valid) {
        showMessage("Preencha todos os campos obrigatórios.", "error")
        return
    }
    try {
        tabRefs.model.value.risco = { id: uncompletedRiscos.value[-index - 1]?.id }
        await avaliacaoRiscoControleService.post(tabRefs.model.value)
        tabRefs.formRef.value?.reset()
        tabRefs.update.value = 0
        showMessage("Avaliação salva com sucesso", "success")
        setUncompletedRiscos()
    } catch {
        showMessage("Erro ao salvar avaliação", "error")
    }
}

const setItemModel = (tabRefs: AvaliacaoTabRefs, item: AvaliacaoRiscoControle) => {
    tabRefs.model.value = {
        fac: normalizeFac(item.fac),
        controlesAtenuacao: item.controlesAtenuacao,
        controlesPreventivos: item.controlesPreventivos,
        impacto: item.impacto,
        probabilidade: item.probabilidade,
        dataUltimaAvaliacao: item.dataUltimaAvaliacao,
    } as Partial<AvaliacaoRiscoControle>
}

const setUncompletedRiscos = async () => {
    if (props.somenteLeitura) {
        uncompletedRiscos.value = []
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
        return
    }

    uncompletedRiscos.value = await riscoService.getWithoutAvalicao(
        selectedProcesso.value!.id,
        riscoName.value
    )
    await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
}

const loadFacOptions = async () => {
    try {
        facOptions.value = await avaliacaoRiscoControleService.getFacOptions()
    } catch {
        showMessage("Erro ao carregar opções de FAC", "error")
    }
}

onMounted(async () => {
    await loadFacOptions()
    await setUncompletedRiscos()
})
</script>
<template>
    <VCard class="col processTab">
        <div class="row" style="justify-content: space-between; align-items: center">
            <div class="col">
                <h3>Avaliação de Riscos e Controle</h3>
                <h4 style="color: hsl(0, 0%, 30%)">
                    Avalie a probabilidade, impacto e controles para cada risco identificado
                </h4>
            </div>
        </div>
        <VTextField
            placeholder="Buscar por nome do risco"
            variant="solo"
            class="filledField"
            bg-color="hsl(0,0%,95%)"
            density="compact"
            hide-details
            v-model="riscoName"
        ></VTextField>
        <VDataTableServer
            :items-per-page="pageSize"
            :page="currentPage"
            :items="avaliacoesComRiscoResidual"
            :loading="loading"
            :items-length="listLength"
            v-on:update:options="loadItems"
            :hide-default-header="true"
            class="plainTable"
        >
            <template #item="{ item }">
                <VCard style="justify-content: start; margin-bottom: 20px" class="col">
                    <div
                        class="row accordionHeader"
                        style="cursor: pointer"
                        @click="toggleItemDetails(item)"
                    >
                        <div class="row accordionHeaderMain">
                            <div :style="getItemIconStyle(item)">
                                <IconShieldCheck
                                    :color="getItemIconColor(item)"
                                    style="vertical-align: middle"
                                ></IconShieldCheck>
                            </div>

                            <h3 class="accordionHeaderTitle">
                                {{ item.risco!.nome }}
                            </h3>
                        </div>

                        <VBtn
                            variant="tonal"
                            style="padding: 5px; flex-shrink: 0"
                            @click.stop="toggleItemDetails(item)"
                        >
                            <IconChevronDown
                                v-if="getItemTabRefs(item).opened.value === 0"
                            ></IconChevronDown>
                            <IconChevronUp v-else></IconChevronUp>
                        </VBtn>
                    </div>
                    <TabTransition v-model="getItemTabRefs(item).opened.value" :tab-slots="2">
                        <template #0></template>
                        <template #1>
                            <div class="col" style="margin-top: 20px">
                                <TabTransition
                                    v-model="getItemTabRefs(item).update.value"
                                    :tab-slots="2"
                                >
                                    <template #0>
                                        <div class="col">
                                            <div
                                                class="row"
                                                style="
                                                    justify-content: space-between;
                                                    align-items: center;
                                                "
                                            >
                                                <span style="color: hsl(0, 0%, 30%)">
                                                    Detalhes da avaliação de riscos e controles
                                                </span>
                                                <VBtn
                                                    v-if="!somenteLeitura"
                                                    @click="() => editItem(item)"
                                                    style="padding: 5px"
                                                    variant="tonal"
                                                >
                                                    <IconEdit></IconEdit>
                                                </VBtn>
                                            </div>
                                            <h4 style="color: hsl(0, 0%, 30%)">
                                                Avaliação dos Riscos
                                            </h4>
                                            <VCard
                                                class="spacedRow"
                                                style="border: none; background: hsl(0, 0%, 95%)"
                                            >
                                                <div>
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 40%)"
                                                        >Probabilidade</span
                                                    ><br />
                                                    {{ probabilidadeLabels.get(item.probabilidade!) }}<br />
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 40%)"
                                                        >Valor: {{ item.probabilidade }}</span
                                                    >
                                                </div>
                                                <div>
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 40%)"
                                                        >Impacto</span
                                                    ><br />
                                                    {{ impactoLabels.get(item.impacto!) }}<br />
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 40%)"
                                                        >Valor: {{ item.impacto }}</span
                                                    >
                                                </div>
                                                <div>
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 40%)"
                                                        >Risco Inerente</span
                                                    ><br />
                                                    <span
                                                        :style="
                                                            getRiscoInerenteStyle(item)
                                                        "
                                                    >
                                                        {{
                                                            getRiscoInerenteLabel(item)
                                                        }}
                                                    </span>
                                                </div>
                                            </VCard>
                                            <h4 style="color: hsl(0, 0%, 30%)">
                                                Avaliação dos Controles
                                            </h4>
                                            <div>
                                                <span style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                    >Controles Preventivos</span
                                                ><br />
                                                <span class="wrapText">
                                                    {{ item.controlesPreventivos }}
                                                </span>
                                            </div>
                                            <div>
                                                <span style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                    >Controles de Atenuação</span
                                                ><br />
                                                <span class="wrapText">
                                                    {{ item.controlesAtenuacao }}
                                                </span>
                                            </div>
                                            <div class="row spacedRow">
                                                <div>
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                        >Avaliação dos Controles</span
                                                    >
                                                    <div
                                                        style="
                                                            width: fit-content;
                                                            background: hsl(0, 0%, 90%);
                                                            border-radius: 5px;
                                                            padding: 3px 8px;
                                                        "
                                                    >
                                                        {{ getFacLabel(item.fac) }}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                    >
                                                        Risco Residual
                                                    </div>
                                                    <div
                                                        :style="getRiscoResidualStyle(item.riscoResidual)"
                                                    >
                                                        {{
                                                            formatRiscoValue(item.riscoResidual)
                                                        }}
                                                    </div>
                                                    <div
                                                        style="font-size: 12px; margin-top: 4px"
                                                        :style="
                                                            getRiscoResidualStyle(item.riscoResidual)
                                                        "
                                                    >
                                                        {{
                                                            getRiscoLevel(item.riscoResidual)
                                                                ?.label ?? "-"
                                                        }}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span
                                                        style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                        >Última Avaliação</span
                                                    ><br />
                                                    <span>{{ formatDateForDisplay(item.dataUltimaAvaliacao!) }} </span>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                    <template #1>
                                        <div
                                            class="row"
                                            style="justify-content: space-between; align-items: center"
                                        >
                                            <div>
                                                <h4 style="color: hsl(0, 0%, 30%)">
                                                    {{
                                                        item.id == null
                                                            ? "Nova avaliação de riscos e controles"
                                                            : "Editar avaliação de riscos e controles"
                                                    }}
                                                </h4>
                                            </div>
                                            <div class="row">
                                                <VBtn
                                                    v-if="item.id != null"
                                                    style="padding: 5px"
                                                    variant="tonal"
                                                    @click="
                                                        () => {
                                                            getItemTabRefs(item).update.value = 0
                                                        }
                                                    "
                                                >
                                                    <IconX></IconX>
                                                </VBtn>
                                                <VBtn
                                                    v-if="!somenteLeitura"
                                                    style="padding: 5px"
                                                    :onclick="
                                                        async () => {
                                                            if (item.id != null) {
                                                                await saveUpdate(
                                                                    getItemTabRefs(item),
                                                                    item.id
                                                                )
                                                                getItemTabRefs(item).update.value = 0
                                                            } else {
                                                                savePost(
                                                                    getItemTabRefs(item),
                                                                    item.index!
                                                                )
                                                            }
                                                        }
                                                    "
                                                >
                                                    <IconDeviceFloppy></IconDeviceFloppy>
                                                </VBtn>
                                            </div>
                                        </div>
                                        <div class="row subTabs" style="background: hsl(0, 0%, 95%)">
                                            <button
                                                @click="
                                                    () => {
                                                        getItemTabRefs(item).avaliacao.value = index
                                                    }
                                                "
                                                :style="{
                                                    background:
                                                        getItemTabRefs(item).avaliacao.value ===
                                                        index
                                                            ? 'white'
                                                            : '',
                                                }"
                                                v-for="(value, index) in [
                                                    'Avaliação dos Riscos',
                                                    'Avaliação dos Controles',
                                                ]"
                                                :key="index"
                                            >
                                                {{ value }}
                                            </button>
                                        </div>
                                        <VForm
                                            :ref="
                                                (el) =>
                                                    (getItemTabRefs(item).formRef.value = el as VForm)
                                            "
                                        >
                                            <TabTransition
                                                v-model="getItemTabRefs(item).avaliacao.value"
                                                :tab-slots="2"
                                                persistent
                                            >
                                    <template #0>
                                        <div class="row spacedRow">
                                            <div class="spacedColumn">
                                                <div>
                                                    <TooltipLabel
                                                        label="Probabilidade (P)"
                                                        tooltip="Chance de ocorrência de um determinado evento de risco."
                                                    />
                                                </div>
                                                <VSelect
                                                    v-model="
                                                    getItemTabRefs(item).model.value.probabilidade
                                                "
                                                    class="filledField"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :items="
                                                        Array.from(probabilidadeLabels.entries())
                                                    "
                                                    item-title="[1]"
                                                    item-value="[0]"
                                                    :rules="[objectNotEmptyRule]"
                                                ></VSelect>
                                            </div>
                                            <div class="spacedColumn">
                                                <div>
                                                    <TooltipLabel
                                                        label="Impacto (I)"
                                                        tooltip="Avaliação da magnitude da ocorrência do evento perante os objetivos estratégicos da organização."
                                                    />
                                                </div>
                                                <VSelect
                                                    v-model="getItemTabRefs(item).model.value.impacto"
                                                    class="filledField"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    item-title="[1]"
                                                    item-value="[0]"
                                                    :items="Array.from(impactoLabels.entries())"
                                                    :rules="[objectNotEmptyRule]"
                                                ></VSelect>
                                            </div>
                                        </div>
                                        <div class="row spacedRow">
                                            <div>
                                                <div>Valor P (Probabilidade)</div>
                                                <div
                                                    style="
                                                        border-radius: 8px;
                                                        background: hsl(0, 0%, 95%);
                                                        padding: 8px 16px;
                                                        width: fit-content;
                                                    "
                                                >
                                                    {{
                                                        getItemTabRefs(item).model.value.probabilidade
                                                    }}
                                                </div>
                                            </div>
                                            <div>
                                                <div>Valor I (Impacto)</div>
                                                <div
                                                    style="
                                                        border-radius: 8px;
                                                        background: hsl(0, 0%, 95%);
                                                        padding: 8px 16px;
                                                        width: fit-content;
                                                    "
                                                >
                                                    {{
                                                        getItemTabRefs(item).model.value.impacto
                                                    }}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="spacedColumn" style="margin-top: 20px">
                                            <div>
                                                <TooltipLabel
                                                    label="Risco Inerente (P x I)"
                                                    tooltip="Probabilidade X Impacto."
                                                />
                                            </div>
                                            <div class="row" style="align-items: center">
                                                <div
                                                    style="
                                                        border-radius: 8px;
                                                        background: hsl(0, 0%, 95%);
                                                        padding: 8px 16px;
                                                        width: fit-content;
                                                    "
                                                >
                                                    {{
                                                        getRiscoInerente(getItemTabRefs(item)) ??
                                                        "Sem Valor"
                                                    }}
                                                </div>
                                                <div
                                                    :style="
                                                        getRiscoInerenteStyle(getItemTabRefs(item))
                                                    "
                                                >
                                                    {{
                                                        getRiscoInerenteLabel(
                                                            getItemTabRefs(item)
                                                        ) ?? "Sem Valor"
                                                    }}
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                    <template #1>
                                        <div class="col">
                                            <div class="spacedColumn">
                                                <div>
                                                    <TooltipLabel
                                                        label="Controles Preventivos"
                                                        tooltip="Medidas que visam diminuir a probabilidade de ocorrência do evento."
                                                    />
                                                </div>
                                                <VTextarea
                                                    v-model="
                                                    getItemTabRefs(item).model.value.controlesPreventivos
                                                "
                                                    class="filledField"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :rules="[notEmptyRule]"
                                                ></VTextarea>
                                            </div>
                                            <div class="spacedColumn">
                                                <div>
                                                    <TooltipLabel
                                                        label="Controles de Atenuação"
                                                        tooltip="Ações imediatas que devem ser executadas em caso de ocorrências do evento, com o objetivo de atenuar seu impacto (consequências)."
                                                    />
                                                </div>
                                                <VTextarea
                                                    v-model="
                                                    getItemTabRefs(item).model.value.controlesAtenuacao
                                                "
                                                    class="filledField"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :rules="[notEmptyRule]"
                                                ></VTextarea>
                                            </div>
                                            <div class="row spacedRow">
                                                <div class="spacedColumn">
                                                    <div>Avaliação dos Controles</div>
                                                    <VSelect
                                                        v-model="getItemTabRefs(item).model.value.fac"
                                                        class="filledField"
                                                        variant="solo-filled"
                                                        density="compact"
                                                        item-value="value"
                                                        item-title="label"
                                                        :items="facOptions"
                                                        :rules="[objectNotEmptyRule]"
                                                    ></VSelect>
                                                </div>
                                                <div class="spacedColumn">
                                                    <div>Risco Residual</div>
                                                    <div class="row">
                                                        <div
                                                            style="
                                                                width: fit-content;
                                                                padding: 9px 16px;
                                                                background: hsl(0, 0%, 95%);
                                                                border-radius: 8px;
                                                            "
                                                        >
                                                            {{
                                                                formatRiscoValue(
                                                                    getRiscoResidual(
                                                                        getItemTabRefs(item)
                                                                    )
                                                                )
                                                            }}
                                                        </div>
                                                        <div style="place-content: center">
                                                            <span
                                                                :style="
                                                                    getRiscoResidualStyle(
                                                                        getRiscoResidual(
                                                                            getItemTabRefs(item)
                                                                        )
                                                                    )
                                                                "
                                                            >
                                                                {{
                                                                    getRiscoResidualLabel(
                                                                        getItemTabRefs(item)
                                                                    ) ?? "Sem Valor"
                                                                }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="spacedColumn">
                                                <div>Data da Última Avaliação</div>
                                                <DatePicker
                                                    v-model="
                                                    getItemTabRefs(item).model.value.dataUltimaAvaliacao
                                                "
                                                    hide-details
                                                    :rules="[notEmptyRule]"
                                                />
                                            </div>
                                        </div>
                                    </template>
                                            </TabTransition>
                                        </VForm>
                                    </template>
                                </TabTransition>
                            </div>
                        </template>
                    </TabTransition>
                </VCard>
            </template>
        </VDataTableServer>
    </VCard>
    <BackToTopButton></BackToTopButton>
</template>

<style>
  .spacedColumn {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

</style>
