<script setup lang="ts">
import { computed, ref, watch, type Ref } from "vue"
import {
    IconChevronDown,
    IconChevronUp,
    IconChecklist,
    IconDeviceFloppy,
    IconEdit,
    IconX,
} from "@tabler/icons-vue"
import atividadeControleService from "../../services/atividadeControleService"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import type { DeepPartial } from "vuetify/lib/composables/theme.mjs"
import type { AtividadeControle } from "../../types/atividadeControle"
import DatePicker from "../../components/DatePicker.vue"
import type { StatusImplementacao } from "../../types/enums/statusImplementacao"
import type { Risco } from "../../types/risco"
import type { RespostaRisco } from "../../types/respostaRisco"
import riscoService from "../../services/riscoService"
import type { VForm } from "vuetify/components"
import { notEmptyRule, nameRule } from "../../core/textFieldRules"
import { respostaTabRefs, selectedProcesso } from "./processoPage"
import { OpcaoTratamento } from "../../types/enums/opcaoTratamento"
import BackToTopButton from "../../components/BackToTopButton.vue"
import TooltipLabel from "../../components/TooltipLabel.vue"
import { formatDateForDisplay } from "../../core/utils"

const props = defineProps<{
    somenteLeitura?: boolean
}>()

const atividades: Ref<DeepPartial<AtividadeControle>[]> = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const listLength = ref(0)
const riscoName = ref("")

const uncompletedRiscos: Ref<Partial<Risco>[]> = ref([])
const totalUncompletedRiscos = computed(() =>
    props.somenteLeitura ? 0 : uncompletedRiscos.value.length
)

const typingTimeout = ref(null as ReturnType<typeof setTimeout> | null)

watch(riscoName, () => {
    if (typingTimeout.value) clearTimeout(typingTimeout.value)
    typingTimeout.value = setTimeout(async () => {
        await setUncompletedRiscos()
    }, 400)
})

type TabRefs = {
    opened: Ref<number>
    update: Ref<number>
    plano: Ref<number>
    model: Ref<DeepPartial<AtividadeControle>>
    formRef: Ref<VForm | undefined>
    aceitar: Ref<boolean>
    datesInOrder: Ref<boolean>
}

const tabRefs: Map<number, TabRefs> = new Map()

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
    const res = await atividadeControleService.getAllByProcesso(
        page - pageOffset,
        itemsPerPage - offset,
        selectedProcesso.value!.id,
        riscoName.value
    )
    const addedAtividades: DeepPartial<AtividadeControle & { index: number }>[] = []
    for (let i = 0; i < offset; i++) {
        tabRefs.delete(-(i + 1))
        addedAtividades.push({
            index: -(i + 1),
            risco: uncompletedRiscos.value[i + pageOffset * itemsPerPage],
        })
    }
    atividades.value = addedAtividades.concat(offset === itemsPerPage ? [] : res.content ?? [])
    loading.value = false
    pageSize.value = itemsPerPage
    currentPage.value = page
    listLength.value = res.totalElements + totalUncompletedRiscos.value
}

const statusImplementacoes: { [K in keyof typeof StatusImplementacao]: string } = {
    EMIMPLEMENTACAO: "Em Implementação",
    IMPLEMENTADO: "Implementado",
    NAOIMPLEMENTADO: "Não Implementado",
}

const getTabRefs = (riscoId: number, isNew: boolean, aceitar?: OpcaoTratamento) => {
    const oldRefs = tabRefs.get(riscoId)
    if (oldRefs !== undefined && props.somenteLeitura) {
        oldRefs.update.value = 0
    }

    if (oldRefs === undefined) {
        const newRefs: TabRefs = {
            opened: ref(0),
            update: ref(!props.somenteLeitura && isNew ? 1 : 0),
            plano: ref(0),
            model: ref({} as DeepPartial<AtividadeControle>),
            formRef: ref(),
            aceitar: computed(
                () =>
                    respostaTabRefs.get(riscoId)?.model.value.opcaoTratamento ===
                        OpcaoTratamento.ACEITAR || aceitar === OpcaoTratamento.ACEITAR
            ),
            datesInOrder: computed(() => {
                const model = tabRefs.get(riscoId)?.model.value
                if (model) {
                    const inicio = model.dataInicio
                    const termino = model.dataTermino
                    if (inicio && termino) {
                        return inicio <= termino
                    }
                }
                return true
            }),
        }
        tabRefs.set(riscoId, newRefs)
        return newRefs
    }
    return oldRefs
}

const getItemTabRefs = (item: DeepPartial<AtividadeControle>) =>
    getTabRefs(item.risco!.id!, item.id == null, item.risco?.respostaRisco?.opcaoTratamento)

const hasText = (value?: string | null) => Boolean(value?.trim())

const getRelatedResposta = (item: DeepPartial<AtividadeControle>) => {
    const respostaFromTab = respostaTabRefs.get(item.risco!.id!)?.model.value
    if (respostaFromTab?.opcaoTratamento != null || hasText(respostaFromTab?.justificativa)) {
        return respostaFromTab
    }

    const respostaFromItem = item.risco?.respostaRisco as
        | DeepPartial<RespostaRisco>
        | DeepPartial<RespostaRisco>[]
        | undefined

    return Array.isArray(respostaFromItem) ? respostaFromItem[0] : respostaFromItem
}

const isRelatedItemFilled = (item: DeepPartial<AtividadeControle>) => {
    if (item.id != null || getItemTabRefs(item).aceitar.value) {
        return true
    }

    const respostaRelacionada = getRelatedResposta(item)
    return respostaRelacionada?.opcaoTratamento != null && hasText(respostaRelacionada?.justificativa)
}

const getItemIconStyle = (item: DeepPartial<AtividadeControle>) => ({
    background: isRelatedItemFilled(item) ? "hsl(200, 65%, 45%)" : "hsl(0, 0%, 92%)",
    borderRadius: "100%",
    placeContent: "center",
    padding: "6px",
    opacity: isRelatedItemFilled(item) ? "1" : "0.75",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
})

const getItemIconColor = (item: DeepPartial<AtividadeControle>) =>
    isRelatedItemFilled(item) ? "white" : "hsl(0, 0%, 60%)"

const toggleItemDetails = (item: DeepPartial<AtividadeControle>) => {
    const itemTabRefs = getItemTabRefs(item)
    itemTabRefs.opened.value = itemTabRefs.opened.value === 0 ? 1 : 0
}

const editItem = (item: DeepPartial<AtividadeControle>) => {
    if (props.somenteLeitura) return

    const itemTabRefs = getItemTabRefs(item)
    setItemModel(itemTabRefs, item as AtividadeControle)
    itemTabRefs.opened.value = 1
    itemTabRefs.update.value = 1
}

const saveUpdate = async (tabRefs: TabRefs, id: number) => {
    if (props.somenteLeitura) return

    try {
        const formRes = await tabRefs.formRef.value?.validate()
        if (!formRes?.valid) {
            showMessage("Existem campos não preenchidos ou inválidos", "error")
            return
        }
        await atividadeControleService.update(tabRefs.model.value, id)
        showMessage("Avaliação salva com sucesso", "success")
        tabRefs.formRef.value?.reset()
        tabRefs.update.value = 0
        loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch {
        showMessage("Erro ao salvar avaliação", "error")
    }
}

const savePost = async (tabRefs: TabRefs, riscoId: number) => {
    if (props.somenteLeitura) return

    try {
        const formRes = await tabRefs.formRef.value?.validate()
        if (!formRes?.valid) {
            showMessage("Existem campos não preenchidos ou inválidos", "error")
            return
        }
        tabRefs.model.value.risco = { id: riscoId }
        await atividadeControleService.post(tabRefs.model.value)
        tabRefs.update.value = 0
        showMessage("Avaliação salva com sucesso", "success")
        setUncompletedRiscos()
    } catch {
        showMessage("Erro ao salvar avaliação", "error")
    }
}

const setItemModel = (tabRefs: TabRefs, item: AtividadeControle) => {
    tabRefs.model.value = {
        acoesContingencia: item.acoesContingencia,
        acoesPreventivas: item.acoesPreventivas,
        dataInicio: item.dataInicio,
        dataTermino: item.dataTermino,
        gatilho: item.gatilho,
        monitoramentoAcoesPreventivas: item.monitoramentoAcoesPreventivas,
        responsavelContingencia: item.responsavelContingencia,
        responsavelTratamento: item.responsavelTratamento,
        statusImplementacao: item.statusImplementacao,
    }
}

const setUncompletedRiscos = async () => {
    if (props.somenteLeitura) {
        uncompletedRiscos.value = []
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
        return
    }

    uncompletedRiscos.value = await riscoService.getWithoutAtividade(
        selectedProcesso.value!.id,
        riscoName.value
    )
    await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
}

setUncompletedRiscos()
</script>
<template>
    <VCard class="col processTab">
        <div class="row" style="justify-content: space-between; align-items: center">
            <div class="col">
                <h3>Atividades de Controle</h3>
                <h4 style="color: hsl(0, 0%, 30%)">
                    Defina planos de tratamento e contingência para cada risco
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
            :items="atividades"
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
                                <IconChecklist
                                    :color="getItemIconColor(item)"
                                    style="vertical-align: middle"
                                ></IconChecklist>
                            </div>
                            <h3 class="accordionHeaderTitle">{{ item.risco!.nome }}</h3>
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
                                <div
                                    style="
                                        background: hsl(200, 50%, 80%);
                                        padding: 5px 10px;
                                        border-radius: 5px;
                                    "
                                    v-if="getItemTabRefs(item).aceitar.value"
                                >
                                    Esse Risco foi aceito e não requer atividades de controle
                                </div>
                                <TabTransition
                                    v-else
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
                                                    Detalhes da atividade de controle
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

                                <span style="color: hsl(0, 0%, 30%)">Plano de Tratamento</span>
                                <div class="row spacedRow">
                                    <div>
                                        <span style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                            <TooltipLabel
                                                label="Responsável pelo Tratamento"
                                                tooltip="Responsável pela implementação das medidas de tratamento, esse deve ser um servidor ou o cargo cujo designado seja automaticamente associado ao Plano de Tratamento."
                                            />
                                        </span>
                                        <div>
                                            {{ item.responsavelTratamento }}
                                        </div>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                            Status
                                        </div>
                                        <div
                                            style="
                                                width: fit-content;
                                                border: 1px solid hsl(0, 0%, 80%);
                                                border-radius: 5px;
                                                padding: 2px 8px;
                                            "
                                        >
                                            {{ statusImplementacoes[item.statusImplementacao!] }}
                                        </div>
                                    </div>
                                </div>
                                <div class="row spacedRow">
                                    <div>
                                        <span style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                            >Data de início prevista</span
                                        >
                                        <div>
                                            {{ formatDateForDisplay(item.dataInicio!) }}
                                        </div>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                            Data de término prevista
                                        </div>
                                        <div>
                                            {{ formatDateForDisplay(item.dataTermino!) }}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                        <TooltipLabel
                                            label="Ações Preventivas"
                                            tooltip="Medidas que visam diminuir a probabilidade de ocorrência do evento."
                                        />
                                    </div>
                                    <div class="wrapText">
                                        {{ item.acoesPreventivas }}
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                        <TooltipLabel
                                            label="Monitoramento"
                                            tooltip="Periodicidade e/ou mecanismos adotados para verificar a implementação das ações."
                                        />
                                    </div>
                                    <div class="wrapText">
                                        {{ item.monitoramentoAcoesPreventivas }}
                                    </div>
                                </div>
                                <VDivider opacity="0.6"></VDivider>
                                <span style="color: hsl(0, 0%, 30%)">Plano de contingência</span>
                                <div>
                                    <span style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                        <TooltipLabel
                                            label="Gatilho"
                                            tooltip="Situação que determina o início das ações de contingência."
                                        />
                                    </span>
                                    <div class="wrapText">
                                        {{ item.gatilho }}
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                        <TooltipLabel
                                            label="Ações de Contingência"
                                            tooltip="Ações imediatas que devem ser executadas em caso de ocorrência do evento, com o objetivo de atenuar seu impacto (consequências)."
                                        />
                                    </div>
                                    <div class="wrapText">
                                        {{ item.acoesContingencia }}
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                        <TooltipLabel
                                            label="Responsável"
                                            tooltip="Responsável pela implementação das medidas de contingência, este deve ser um servidor ou o cargo cujo designado seja automaticamente associado ao Plano de contingência que deve ser imediatamente comunicado em caso de ocorrência do risco para que possa demandar a execução das ações de contingência."
                                        />
                                    </div>
                                    <div>
                                        {{ item.responsavelContingencia }}
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
                                                ? "Nova atividade de controle"
                                                : "Editar atividade de controle"
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
                                        ><IconX></IconX>
                                    </VBtn>
                                    <VBtn
                                        v-if="!somenteLeitura"
                                        style="padding: 5px"
                                        :onclick="
                                            async () => {
                                                if (item.id) {
                                                    await saveUpdate(getItemTabRefs(item), item.id)
                                                } else {
                                                    savePost(getItemTabRefs(item), item.risco!.id!)
                                                }
                                            }
                                        "
                                        ><IconDeviceFloppy></IconDeviceFloppy>
                                    </VBtn>
                                </div>
                            </div>
                            <div class="row subTabs" style="background: hsl(0, 0%, 95%)">
                                <button
                                    @click="
                                        () => {
                                            getItemTabRefs(item).plano.value = index
                                        }
                                    "
                                    :style="{
                                        background:
                                            getItemTabRefs(item).plano.value === index
                                                ? 'white'
                                                : '',
                                    }"
                                    v-for="(value, index) in [
                                        'Plano de Tratamento',
                                        'Plano de contingência',
                                    ]"
                                    :key="index"
                                >
                                    {{ value }}
                                </button>
                            </div>
                            <VForm
                                :ref="(el)=>(getItemTabRefs(item).formRef.value=el as VForm)"
                            >
                                <TabTransition
                                    persistent
                                    v-model="getItemTabRefs(item).plano.value"
                                    :tab-slots="2"
                                >
                                    <template #0>
                                        <div class="col">
                                            <span style="color: hsl(0, 0%, 30%)"
                                                >Plano de Tratamento</span
                                            >
                                            <div class="row spacedRow">
                                                <div class="spacedColumn">
                                                    <div
                                                        style="
                                                            font-size: 12px;
                                                            color: hsl(0, 0%, 30%);
                                                        "
                                                    >
                                                        <TooltipLabel
                                                            label="Responsável pelo Tratamento"
                                                            tooltip="Responsável pela implementação das medidas de tratamento, esse deve ser um servidor ou o cargo cujo designado seja automaticamente associado ao Plano de Tratamento."
                                                        />
                                                    </div>
                                                    <VTextField
                                                        :rules="[notEmptyRule, nameRule]"
                                                        v-model="
                                                        getItemTabRefs(item).model.value
                                                            .responsavelTratamento
                                                    "
                                                        class="filledField"
                                                        variant="solo-filled"
                                                        density="compact"
                                                    >
                                                    </VTextField>
                                                </div>
                                                <div class="spacedColumn">
                                                    <div
                                                        style="
                                                            font-size: 12px;
                                                            color: hsl(0, 0%, 30%);
                                                        "
                                                    >
                                                        Status
                                                    </div>
                                                    <VSelect
                                                        variant="solo-filled"
                                                        density="compact"
                                                        v-model="
                                                            getItemTabRefs(item).model.value
                                                                .statusImplementacao    
                                                        "
                                                        :rules="[notEmptyRule]"
                                                        item-title="[1]"
                                                        item-value="[0]"
                                                        :items="
                                                            Object.entries(statusImplementacoes)
                                                        "
                                                    >
                                                    </VSelect>
                                                </div>
                                            </div>
                                            <div class="row spacedRow">
                                                <div class="spacedColumn">
                                                    <div
                                                        style="
                                                            font-size: 12px;
                                                            color: hsl(0, 0%, 30%);
                                                        "
                                                    >
                                                        Data de início prevista
                                                    </div>
                                                    <DatePicker
                                                        v-model="
                                                        getItemTabRefs(item).model.value.dataInicio
                                                        "
                                                        :error-messages="getItemTabRefs(item).datesInOrder.value ? '' : 'A data de início deve ser anterior à data de término'"
                                                        :rules="[notEmptyRule]"
                                                    >
                                                    </DatePicker>
                                                </div>
                                                <div class="spacedColumn">
                                                    <div
                                                        style="
                                                            font-size: 12px;
                                                            color: hsl(0, 0%, 30%);
                                                        "
                                                    >
                                                        Data de término prevista
                                                    </div>

                                                    <DatePicker
                                                        v-model="
                                                            getItemTabRefs(item).model.value.dataTermino
                                                        "
                                                        :error-messages="getItemTabRefs(item).datesInOrder.value ? '' : 'A data de término deve ser posterior à data de início'"
                                                        :rules="[notEmptyRule]"
                                                    >
                                                    </DatePicker>
                                                </div>
                        
                                            </div>
                                            <div class="spacedColumn">
                                                <div
                                                    style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                >
                                                    <TooltipLabel
                                                        label="Ações Preventivas"
                                                        tooltip="Medidas que visam diminuir a probabilidade de ocorrência do evento."
                                                    />
                                                </div>
                                                <VTextarea
                                                    v-model="getItemTabRefs(item).model.value.acoesPreventivas"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :rules="[notEmptyRule]"
                                                >
                                                </VTextarea>
                                            </div>
                                            <div class="spacedColumn">
                                                <div
                                                    style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                >
                                                    <TooltipLabel
                                                        label="Monitoramento"
                                                        tooltip="Periodicidade e/ou mecanismos adotados para verificar a implementação das ações."
                                                    />
                                                </div>
                                                <VTextarea
                                                    v-model="getItemTabRefs(item).model.value.monitoramentoAcoesPreventivas"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :rules="[notEmptyRule]"
                                                >
                                                </VTextarea>
                                            </div>
                                        </div>
                                    </template>
                                    <template #1>
                                        <div class="col">
                                            <span style="color: hsl(0, 0%, 30%)"
                                                >Plano de contingência</span
                                            >
                                            <div>
                                                <div
                                                    style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                >
                                                    <TooltipLabel
                                                        label="Gatilho"
                                                        tooltip="Situação que determina o início das ações de contingência."
                                                    />
                                                </div>
                                                <VTextarea
                                                    v-model="getItemTabRefs(item).model.value.gatilho"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :rules="[notEmptyRule]"
                                                >
                                                </VTextarea>
                                            </div>
                                            <div>
                                                <div
                                                    style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                >
                                                    <TooltipLabel
                                                        label="Ações de Contingência"
                                                        tooltip="Ações imediatas que devem ser executadas em caso de ocorrência do evento, com o objetivo de atenuar seu impacto (consequências)."
                                                    />
                                                </div>
                                                <VTextarea
                                                    variant="solo-filled"
                                                    density="compact"
                                                    v-model="
                                                        getItemTabRefs(item).model.value
                                                            .acoesContingencia
                                                    "
                                                    :rules="[notEmptyRule]"
                                                >
                                                </VTextarea>
                                            </div>
                                            <div>
                                                <div
                                                    style="font-size: 12px; color: hsl(0, 0%, 30%)"
                                                >
                                                    <TooltipLabel
                                                        label="Responsável"
                                                        tooltip="Responsável pela implementação das medidas de contingência, este deve ser um servidor ou o cargo cujo designado seja automaticamente associado ao Plano de contingência que deve ser imediatamente comunicado em caso de ocorrência do risco para que possa demandar a execução das ações de contingência."
                                                    />
                                                </div>
                                                <VTextField
                                                    variant="solo-filled"
                                                    density="compact"
                                                    v-model="
                                                        getItemTabRefs(item).model.value
                                                            .responsavelContingencia
                                                    "
                                                    :rules="[notEmptyRule, nameRule]"
                                                >
                                                </VTextField>
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
