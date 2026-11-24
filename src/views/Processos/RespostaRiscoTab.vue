<script setup lang="ts">
import { ref, watch, type Ref } from "vue"
import {
    IconChevronDown,
    IconChevronUp,
    IconDeviceFloppy,
    IconEdit,
    IconMessageCircleCheck,
    IconX,
} from "@tabler/icons-vue"
import respostaRiscosService from "../../services/respostaRiscoService"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import type { RespostaRisco } from "../../types/respostaRisco"
import { OpcaoTratamento } from "../../types/enums/opcaoTratamento"
import type { DeepPartial } from "vuetify/lib/composables/theme.mjs"
import type { Risco } from "../../types/risco"
import riscoService from "../../services/riscoService"
import { selectedProcesso, respostaTabRefs, type RespostaTabRefs } from "./processoPage"
import { notEmptyRule } from "../../core/textFieldRules"
import type { VForm } from "vuetify/components"
import atividadeControleService from "../../services/atividadeControleService"
import BackToTopButton from "../../components/BackToTopButton.vue"
import TooltipLabel from "../../components/TooltipLabel.vue"

const props = defineProps<{
    somenteLeitura?: boolean
}>()

const respostas: Ref<DeepPartial<RespostaRisco>[]> = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const listLength = ref(0)

const riscoName = ref("")
const typingTimeout = ref(null as ReturnType<typeof setTimeout> | null)

watch(riscoName, () => {
    if (typingTimeout.value) clearTimeout(typingTimeout.value)
    typingTimeout.value = setTimeout(async () => {
        await setUncompletedRiscos()
    }, 400)
})

const uncompletedRiscos: Ref<Partial<Risco>[]> = ref([])
const totalUncompletedRiscos = () => (props.somenteLeitura ? 0 : uncompletedRiscos.value.length)

const opcoesTratamento: { [K in keyof typeof OpcaoTratamento]: string } = {
    EVITAR: "Evitar",
    MITIGAR: "Mitigar",
    COMPARTILHAR: "Compartilhar",
    ACEITAR: "Aceitar",
}

const loadItems = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
    loading.value = true
    let offset = totalUncompletedRiscos() - itemsPerPage * (page - 1)
    if (offset < 0) {
        offset = 0
    }
    let pageOffset = (totalUncompletedRiscos() - offset) / itemsPerPage
    if (pageOffset > page) {
        pageOffset = page
    }
    if (offset > itemsPerPage) {
        offset = itemsPerPage
    }
    const res = await respostaRiscosService.getAllByProcesso(
        page - pageOffset,
        itemsPerPage - offset,
        selectedProcesso.value!.id,
        riscoName.value
    )
    const addedRespostas: DeepPartial<RespostaRisco & { index: number }>[] = []
    for (let i = 0; i < offset; i++) {
        const newResposta = {
            index: addedRespostas.length,
            risco: uncompletedRiscos.value[i + pageOffset * itemsPerPage],
        }
        respostaTabRefs.delete(newResposta.risco!.id!)
        addedRespostas.push(newResposta)
    }
    respostas.value = addedRespostas.concat(offset == itemsPerPage ? [] : res.content ?? [])
    loading.value = false
    pageSize.value = itemsPerPage
    currentPage.value = page
    listLength.value = res.totalElements + totalUncompletedRiscos()
}

const getTabRefs = (id: number, isNew: boolean) => {
    const oldRefs = respostaTabRefs.get(id)
    if (oldRefs !== undefined && props.somenteLeitura) {
        oldRefs.update.value = 0
    }

    if (oldRefs === undefined) {
        const newRefs: RespostaTabRefs = {
            opened: ref(0),
            update: ref(!props.somenteLeitura && isNew ? 1 : 0),
            model: ref({} as DeepPartial<RespostaRisco>),
            form: ref(null),
        }
        respostaTabRefs.set(id, newRefs)
        return newRefs
    }
    return oldRefs
}

const getItemTabRefs = (item: DeepPartial<RespostaRisco>) => getTabRefs(item.risco!.id!, item.id == null)

const hasText = (value?: string | null) => Boolean(value?.trim())

const getCurrentRespostaState = (item: DeepPartial<RespostaRisco>) => {
    const model = getItemTabRefs(item).model.value
    if (model.opcaoTratamento != null || hasText(model.justificativa)) {
        return model
    }
    return item
}

const isItemFilled = (item: DeepPartial<RespostaRisco>) => {
    const respostaAtual = getCurrentRespostaState(item)
    return respostaAtual.opcaoTratamento != null && hasText(respostaAtual.justificativa)
}

const getItemIconStyle = (item: DeepPartial<RespostaRisco>) => ({
    background: isItemFilled(item) ? "hsl(170, 60%, 42%)" : "hsl(0, 0%, 92%)",
    borderRadius: "100%",
    placeContent: "center",
    padding: "6px",
    opacity: isItemFilled(item) ? "1" : "0.75",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
})

const getItemIconColor = (item: DeepPartial<RespostaRisco>) =>
    isItemFilled(item) ? "white" : "hsl(0, 0%, 60%)"

const toggleItemDetails = (item: DeepPartial<RespostaRisco>) => {
    const itemTabRefs = getItemTabRefs(item)
    itemTabRefs.opened.value = itemTabRefs.opened.value === 0 ? 1 : 0
}

const editItem = (item: DeepPartial<RespostaRisco>) => {
    if (props.somenteLeitura) return

    const itemTabRefs = getItemTabRefs(item)
    setItemModel(itemTabRefs, item as RespostaRisco)
    itemTabRefs.opened.value = 1
    itemTabRefs.update.value = 1
}

const saveUpdate = async (tabRefs: RespostaTabRefs, id: number) => {
    if (props.somenteLeitura) return

    if (!tabRefs.form.value) return
    const { valid } = await tabRefs.form.value.validate()
    if (!valid) {
        showMessage("Preencha todos os campos obrigatórios", "error")
        return
    }
    try {
        if (tabRefs.model.value.opcaoTratamento === OpcaoTratamento.ACEITAR) {
            await atividadeControleService.deleteByRiscoId(tabRefs.model.value.risco!.id!)
        }
        await respostaRiscosService.update(tabRefs.model.value, id)
        tabRefs.form.value.reset()
        tabRefs.update.value = 0
        showMessage("Resposta salva com sucesso", "success")
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch {
        showMessage("Erro ao salvar resposta", "error")
    }
}

const savePost = async (tabRefs: RespostaTabRefs, riscoId: number) => {
    if (props.somenteLeitura) return

    if (!tabRefs.form.value) return
    const { valid } = await tabRefs.form.value.validate()
    if (!valid) {
        showMessage("Preencha todos os campos obrigatórios", "error")
        return
    }
    try {
        if (tabRefs.model.value.opcaoTratamento === OpcaoTratamento.ACEITAR) {
            await atividadeControleService.deleteByRiscoId(riscoId)
        }
        tabRefs.model.value.risco = { id: riscoId }
        await respostaRiscosService.post(tabRefs.model.value)
        tabRefs.form.value.reset()
        tabRefs.update.value = 0
        showMessage("Resposta salva com sucesso", "success")
        await setUncompletedRiscos()
    } catch {
        showMessage("Erro ao salvar resposta", "error")
    }
}

const setItemModel = (tabRefs: RespostaTabRefs, item: RespostaRisco) => {
    tabRefs.model.value = {
        justificativa: item.justificativa,
        opcaoTratamento: item.opcaoTratamento,
        risco: { id: item.risco?.id },
    }
}

const setUncompletedRiscos = async () => {
    if (props.somenteLeitura) {
        uncompletedRiscos.value = []
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
        return
    }

    uncompletedRiscos.value = await riscoService.getWithoutResposta(
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
                <h3>Respostas aos Riscos</h3>
                <h4 style="color: hsl(0, 0%, 30%)">
                    Defina a estratégia de tratamento para cada risco identificado
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
            :items="respostas"
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
                                <IconMessageCircleCheck
                                    :color="getItemIconColor(item)"
                                    style="vertical-align: middle"
                                ></IconMessageCircleCheck>
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
                                                    Detalhes da resposta ao risco
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
                                            <div class="spacedColumn">
                                                <span style="font-size: 12px; color: hsl(0, 0%, 30%)">
                                                    <TooltipLabel
                                                        label="Opção de Tratamento"
                                                        tooltip="Para cada risco priorizado deve ser selecionada uma opção de tratamento. Essa escolha depende do nível do risco e dos custos associados à implementação dos controles."
                                                    />
                                                </span>
                                                <br />
                                                <span
                                                    style="
                                                        border: hsl(0, 0%, 30%);
                                                        border-radius: 5px;
                                                    "
                                                >
                                                    {{
                                                        item.opcaoTratamento
                                                            ? opcoesTratamento[
                                                                  item.opcaoTratamento
                                                              ]
                                                            : ""
                                                    }}
                                                </span>
                                            </div>
                                            <div>
                                                <span style="font-size: 12px; color: hsl(0, 0%, 30%)">Justificativa</span
                                                ><br />
                                                <span class="wrapText">
                                                    {{ item.justificativa }}
                                                </span>
                                            </div>
                                        </div>
                                    </template>
                                    <template #1>
                                        <VForm
                                            :ref="
                                                (el) =>
                                                    (getItemTabRefs(item).form.value = el as VForm)
                                            "
                                        >
                                            <div
                                                class="row"
                                                style="
                                                    justify-content: space-between;
                                                    align-items: center;
                                                "
                                            >
                                                <div>
                                                    <h4 style="color: hsl(0, 0%, 30%)">
                                                        {{
                                                            item.id == null
                                                                ? 'Nova resposta ao risco'
                                                                : 'Editar resposta ao risco'
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
                                                                        item.risco!.id!
                                                                    )
                                                                }
                                                            }
                                                        "
                                                    >
                                                        <IconDeviceFloppy></IconDeviceFloppy>
                                                    </VBtn>
                                                </div>
                                            </div>

                                            <div class="spacedColumn">
                                                <div>
                                                    <TooltipLabel
                                                        label="Opção de Tratamento"
                                                        tooltip="Para cada risco priorizado deve ser selecionada uma opção de tratamento. Essa escolha depende do nível do risco e dos custos associados à implementação dos controles."
                                                    />
                                                </div>
                                                <VSelect
                                                    v-model="
                                                        getItemTabRefs(item).model.value
                                                            .opcaoTratamento
                                                    "
                                                    class="filledField"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    item-title="[1]"
                                                    item-value="[0]"
                                                    :items="Object.entries(opcoesTratamento)"
                                                    :rules="[notEmptyRule]"
                                                ></VSelect>
                                            </div>
                                            <div class="spacedColumn">
                                                <div>Justificativa</div>
                                                <VTextarea
                                                    v-model="
                                                        getItemTabRefs(item).model.value
                                                            .justificativa
                                                    "
                                                    class="filledField"
                                                    variant="solo-filled"
                                                    density="compact"
                                                    :rules="[notEmptyRule]"
                                                ></VTextarea>
                                            </div>
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
