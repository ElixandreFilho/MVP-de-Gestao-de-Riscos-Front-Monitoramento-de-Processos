<script setup lang="ts">
import { ref, type Ref } from "vue"
import {
    IconAlertTriangle,
    IconChevronDown,
    IconChevronUp,
    IconDeviceFloppy,
    IconEdit,
    IconPlus,
    IconX,
} from "@tabler/icons-vue"
import ocorrenciaRiscoService from "../../services/ocorrenciaRiscoService"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import type { OcorrenciaRisco } from "../../types/ocorrenciaRisco"
import type { DeepPartial } from "../../types/types"
import riscoService from "../../services/riscoService"
import type { Risco } from "../../types/risco"
import DatePicker from "../../components/DatePicker.vue"
import type { Usuario } from "../../types/usuario"
import userService from "../../services/userService"
import { useUnidadeStore } from "../../stores/unidadeStore"
import TabField from "../../components/TabField.vue"
import DeleteDialog from "../../components/DeleteDialog.vue"
import { userInfo } from "../../services/keycloakService"
import { notEmptyRule, nameRule } from "../../core/textFieldRules"
import type { VForm } from "vuetify/components"
import { selectedProcesso } from "./processoPage"
import { watch } from "vue"
import BackToTopButton from "../../components/BackToTopButton.vue"
import { formatDateForDisplay } from "../../core/utils"

const props = defineProps<{
    somenteLeitura?: boolean
}>()

const responsaveis = ref([]) as Ref<Usuario[]>
const riscos = ref([]) as Ref<Risco[]>
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const listLength = ref(0)

const riscoName = ref("")
const typingTimeout = ref(null as ReturnType<typeof setTimeout> | null)

watch(riscoName, () => {
    if (typingTimeout.value) clearTimeout(typingTimeout.value)
    typingTimeout.value = setTimeout(async () => {
        await loadRiscoItems({ page: 1, itemsPerPage: pageSize.value })
    }, 400)
})
;(async () => {
    const unidadeStore = useUnidadeStore()
    responsaveis.value = await userService.findResponsaveis(unidadeStore.unidade?.id ?? 0)
})()

type OcorrenciaTabRefs = {
    update: Ref<number>
    form: Ref<VForm | undefined>
    model: Ref<DeepPartial<OcorrenciaRisco>>
}

type RiscoTabRefs = {
    opened: Ref<number>
    ocorrencia: {
        addedOcorrencia: Ref<DeepPartial<OcorrenciaRisco & { index: number }>[]>
        ocorrencias: Ref<OcorrenciaRisco[]>
        loading: Ref<boolean>
        currentPage: Ref<number>
        pageSize: Ref<number>
        listLength: Ref<number>
    }
}

const riscoTabRefs: Map<number, RiscoTabRefs> = new Map()
const ocorrenciaTabRefs: Map<number, OcorrenciaTabRefs> = new Map()
let nextTemporaryOccurrenceIndex = 1



const loadOcorrenciaItems = async (
    {
        page,
        itemsPerPage,
    }: {
        page: number
        itemsPerPage: number
    },
    tabRefs: RiscoTabRefs,
    riscoId: number
) => {
    tabRefs.ocorrencia.loading.value = true
    const res = await ocorrenciaRiscoService.getAllByRisco(page, itemsPerPage, riscoId)
    tabRefs.ocorrencia.ocorrencias.value = res.content ?? []
    tabRefs.ocorrencia.loading.value = false
    tabRefs.ocorrencia.pageSize.value = itemsPerPage
    tabRefs.ocorrencia.currentPage.value = page
    tabRefs.ocorrencia.listLength.value = res.totalElements
}

const loadRiscoItems = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
    loading.value = true
    const res = await riscoService.getAllByProcesso(
        page,
        itemsPerPage,
        selectedProcesso.value!.id,
        riscoName.value
    )
    riscos.value = res.content
    loading.value = false
    pageSize.value = itemsPerPage
    currentPage.value = page
    listLength.value = res.totalElements
    for (let risco of riscos.value) {
        const tabRefs = getRiscoTabRefs(risco.id)
        const res = await ocorrenciaRiscoService.getAllByRisco(
            tabRefs.ocorrencia.currentPage.value,
            tabRefs.ocorrencia.pageSize.value,
            risco.id
        )
        tabRefs.ocorrencia.ocorrencias.value = res?.content ?? []
    }
}

const getOcorrenciaTabRefs = (id: number | null | undefined, index: number | null | undefined) => {
    index = index ?? null
    const oldRefs = id ? ocorrenciaTabRefs.get(id) : ocorrenciaTabRefs.get(-(index ?? 0))
    if (oldRefs !== undefined && props.somenteLeitura) {
        oldRefs.update.value = 0
    }

    if (oldRefs === undefined) {
        const newRefs: OcorrenciaTabRefs = {
            update: ref(!props.somenteLeitura && index ? 1 : 0),
            form: ref(),
            model: ref({
                responsavelRegistro: { id: userInfo.value.id },
            } as DeepPartial<OcorrenciaRisco>),
        }
        ocorrenciaTabRefs.set(index ? -index : id!, newRefs)
        return newRefs
    }
    return oldRefs
}

const addOcorrencia = (tabRefs: RiscoTabRefs) => {
    if (props.somenteLeitura) return

    if (tabRefs.ocorrencia.addedOcorrencia.value.length > 0) {
        showMessage("É necessário salvar a ocorrência adicionada antes de criar outra", "info")
        return
    }
    tabRefs.ocorrencia.addedOcorrencia.value.push({
        dataOcorrencia: "",
        descricao: "",
        responsavelRegistro: { id: userInfo.value.id },
        responsavelSolucao: "",
        resultados: "",
        solucao: "",
        index: nextTemporaryOccurrenceIndex++,
    })
}

const deleteOcorrencia = async (
    id: number | null | undefined,
    riscoTabRefs: RiscoTabRefs,
    riscoId: number,
    index?: number | null
) => {
    if (props.somenteLeitura) return

    if (id == null || id === 0) {
        deleteAddedItem(riscoTabRefs, index)
        return
    }

    try {
        await ocorrenciaRiscoService.delete(id)

        showMessage("Ocorrência deletada com sucesso", "success")
        loadOcorrenciaItems(
            { page: currentPage.value, itemsPerPage: pageSize.value },
            riscoTabRefs,
            riscoId
        )
    } catch {
        showMessage("Erro ao deletar ocorrência", "error")
    }
}

const getRiscoTabRefs = (id: number) => {
    const oldRefs = riscoTabRefs.get(id)
    if (oldRefs === undefined) {
        const newRefs: RiscoTabRefs = {
            opened: ref(0),
            ocorrencia: {
                addedOcorrencia: ref([]),
                ocorrencias: ref([]),
                loading: ref(false),
                currentPage: ref(1),
                pageSize: ref(1),
                listLength: ref(0),
            },
        }
        riscoTabRefs.set(id, newRefs)

        return newRefs
    }
    return oldRefs
}

const saveUpdate = async (
    tabRefs: OcorrenciaTabRefs,
    id: number,
    riscoTabRefs: RiscoTabRefs,
    riscoId: number
) => {
    if (props.somenteLeitura) return

    try {
        const result = await tabRefs.form.value?.validate()
        if(!result?.valid){
            showMessage("Por favor, preencha todos os campos obrigatórios", "error")
            return
        }
        await ocorrenciaRiscoService.update(tabRefs.model.value, id)
        tabRefs.update.value = 0
        showMessage("Avaliação salva com sucesso", "success")
        loadOcorrenciaItems(
            {
                page: riscoTabRefs.ocorrencia.currentPage.value,
                itemsPerPage: riscoTabRefs.ocorrencia.pageSize.value,
            },
            riscoTabRefs,
            riscoId
        )
    } catch {
        showMessage("Erro ao salvar avaliação", "error")
    }
}

const deleteAddedItem = (riscoTabRefs: RiscoTabRefs, index?: number | null) => {
    const removedItem = riscoTabRefs.ocorrencia.addedOcorrencia.value.pop()
    const temporaryIndex = index ?? removedItem?.index

    if (temporaryIndex != null) {
        ocorrenciaTabRefs.delete(-temporaryIndex)
    }
}

const savePost = async (
    tabRefs: OcorrenciaTabRefs,
    riscoTabRefs: RiscoTabRefs,
    riscoId: number,
    index?: number | null
) => {
    if (props.somenteLeitura) return

    try {
        const result = await tabRefs.form.value?.validate()
        if (!result?.valid) {
            showMessage("Por favor, preencha todos os campos obrigatórios", "error")
            return
        }
        tabRefs.model.value.risco = { id: riscoId }
        await ocorrenciaRiscoService.post(tabRefs.model.value)
        deleteAddedItem(riscoTabRefs, index)
        tabRefs.update.value = 0
        showMessage("Ocorrência salva com sucesso", "success")
        loadOcorrenciaItems(
            {
                page: riscoTabRefs.ocorrencia.currentPage.value,
                itemsPerPage: riscoTabRefs.ocorrencia.pageSize.value,
            },
            riscoTabRefs,
            riscoId
        )
    } catch {
        showMessage("Erro ao salvar ocorrência", "error")
    }
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
const scrollElement = async (el: HTMLElement) => {
    await wait(300)
    el.scrollIntoView({ behavior: "smooth" })
}
const setItemModel = (tabRefs: OcorrenciaTabRefs, item: OcorrenciaRisco) => {
    tabRefs.model.value = {
        dataOcorrencia: item.dataOcorrencia,
        descricao: item.descricao,
        responsavelRegistro: item.responsavelRegistro ?? { id: null },
        responsavelSolucao: item.responsavelSolucao,
        resultados: item.resultados,
        solucao: item.solucao,
    }
}

const isRelatedItemFilled = (item: DeepPartial<Risco>) => {
    if (item.id == null) {
        return false
    }

    const riscoRefs = getRiscoTabRefs(item.id)
    const hasSavedOcorrencia = riscoRefs.ocorrencia.ocorrencias.value.some(
        (ocorrencia) => ocorrencia.id != null && ocorrencia.id !== 0
    )

    return hasSavedOcorrencia
}

const getItemIconStyle = (item: DeepPartial<Risco>) => ({
    background: isRelatedItemFilled(item) ? "hsl(25, 80%, 50%)" : "hsl(0, 0%, 92%)",
    borderRadius: "100%",
    placeContent: "center",
    padding: "6px",
    opacity: isRelatedItemFilled(item) ? "1" : "0.75",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
})

const getItemIconColor = (item: DeepPartial<Risco>) =>
    isRelatedItemFilled(item) ? "white" : "hsl(0, 0%, 60%)"

</script>
<template>
    <VCard class="col processTab">
        <div class="col">
            <h3>Ocorrências de Risco</h3>

            <div
                style="
                    border-radius: 10px;
                    background: hsl(200, 50%, 90%);
                    display: grid;
                    grid-template-areas: 'unit';
                    overflow: hidden;
                "
            >
                <div
                    style="
                        width: 5px;
                        height: 100%;
                        background: hsl(200, 50%, 50%);
                        grid-area: unit;
                    "
                ></div>
                <div style="grid-area: unit; padding: 10px 20px; color: hsl(220, 60%, 30%)">
                    <b>Atenção</b>: Esta seção é destinada ao registro de riscos que realmente
                    aconteceram. Não é necessário preencher se nenhum risco se materializou ainda.
                </div>
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
            :items="riscos"
            :loading="loading"
            :items-length="listLength"
            v-on:update:options="loadRiscoItems"
            :hide-default-header="true"
            class="plainTable"
        >
            <template #item="{ item: riscoItem }">
                <VCard
                    style="justify-content: start; margin-bottom: 20px; cursor: pointer"
                    class="col"
                    :onclick="
                        () => {
                            getRiscoTabRefs(riscoItem.id).opened.value =
                                getRiscoTabRefs(riscoItem.id).opened.value === 0 ? 1 : 0
                        }
                    "
                >
                    <div class="col">
                        <div class="row accordionHeader">
                            <div class="row accordionHeaderMain">
                                <div
                                    :style="getItemIconStyle(riscoItem)"
                                >
                                    <IconAlertTriangle
                                        :color="getItemIconColor(riscoItem)"
                                        style="vertical-align: middle"
                                    ></IconAlertTriangle>
                                </div>
                                <h3 class="accordionHeaderTitle">
                                    {{ riscoItem.nome }}
                                </h3>
                            </div>

                            <div class="row accordionHeaderActions">
                                <VBtn
                                    v-if="!somenteLeitura"
                                    :onclick="(e: MouseEvent) => {
                                        e.stopImmediatePropagation();
                                        getRiscoTabRefs(riscoItem.id).opened.value=1
                                        addOcorrencia(getRiscoTabRefs(riscoItem.id))
                                    }"
                                    style="padding: 5px; text-transform: capitalize"
                                    variant="tonal"
                                    ><IconPlus size="18"></IconPlus>Adicionar Ocorrência
                                </VBtn>
                                <VBtn
                                    variant="tonal"
                                    style="padding: 5px"
                                    :onclick="
                                        (e: Event) => {
                                            e.stopPropagation()
                                            getRiscoTabRefs(riscoItem.id).opened.value =
                                                getRiscoTabRefs(riscoItem.id).opened.value === 0 ? 1 : 0
                                        }
                                    "
                                >
                                    <IconChevronDown
                                        v-if="getRiscoTabRefs(riscoItem.id).opened.value === 0"
                                    ></IconChevronDown>
                                    <IconChevronUp v-else></IconChevronUp>
                                </VBtn>
                            </div>
                        </div>
                        <TabTransition
                            v-model="getRiscoTabRefs(riscoItem.id).opened.value"
                            :tab-slots="2"
                        >
                            <template #0></template>
                            <template #1>
                                <VDataTableServer
                                    :items-per-page="
                                        getRiscoTabRefs(riscoItem.id).ocorrencia.pageSize.value
                                    "
                                    :page="
                                        getRiscoTabRefs(riscoItem.id).ocorrencia.currentPage.value
                                    "
                                    :items="
                                        (getRiscoTabRefs(riscoItem.id).ocorrencia.addedOcorrencia.value.sort((x, y)=>((-(x.index??0))-(-(y.index??0))))).concat(getRiscoTabRefs(riscoItem.id).ocorrencia.ocorrencias.value as DeepPartial<OcorrenciaRisco>[])
                                    "
                                    :loading="
                                        getRiscoTabRefs(riscoItem.id).ocorrencia.loading.value
                                    "
                                    :items-length="
                                        getRiscoTabRefs(riscoItem.id).ocorrencia.listLength.value
                                    "
                                    v-on:update:options="
                                        (options) => {
                                            loadOcorrenciaItems(
                                                options,
                                                getRiscoTabRefs(riscoItem.id),
                                                riscoItem.id
                                            )
                                        }
                                    "
                                    :hide-default-header="true"
                                    class="plainTable"
                                    :onclick="(e: MouseEvent)=>{
                                        e.stopPropagation()
                                    }"
                                >
                                    <template #item="{ item: ocorrenciaItem }">
                                        <VCard
                                            class="col"
                                            style="cursor: default; margin-top: 20px"
                                            @vue:mounted="
                                                (v) => {

                                            if(ocorrenciaItem.index)
                                                    scrollElement(v?.el as HTMLElement)
                                                    
                                                }
                                            "
                                        >
                                            <TabTransition
                                                v-model="
                                                    getOcorrenciaTabRefs(
                                                        ocorrenciaItem.id,
                                                        ocorrenciaItem.index
                                                    ).update.value
                                                "
                                                :tab-slots="2"
                                            >
                                                <template #0>
                                                    <div class="col">
                                                        <div
                                                            class="row"
                                                            style="justify-content: space-between"
                                                        >
                                                            <div>
                                                                Ocorrência #{{
                                                                    ocorrenciaItem.id ?? "Nova"
                                                                }}
                                                            </div>
                                                            <div class="row">
                                                                <VBtn
                                                                    v-if="!somenteLeitura"
                                                                    :onclick="
                                                                        () => {
                                                                            const tabRefs =
                                                                                getOcorrenciaTabRefs(
                                                                                    ocorrenciaItem.id,
                                                                                    ocorrenciaItem.index
                                                                                )
                                                                            setItemModel(
                                                                                tabRefs,
                                                                                ocorrenciaItem as OcorrenciaRisco
                                                                            )
                                                                            tabRefs.update.value = 1
                                                                        }
                                                                    "
                                                                    variant="tonal"
                                                                    style="padding: 5px"
                                                                    ><IconEdit></IconEdit
                                                                ></VBtn>
                                                                <DeleteDialog
                                                                    v-if="!somenteLeitura"
                                                                    :confirm-delete="
                                                                        () => {
                                                                            deleteOcorrencia(
                                                                                ocorrenciaItem.id,
                                                                                getRiscoTabRefs(
                                                                                    riscoItem.id
                                                                                ),
                                                                                riscoItem.id,
                                                                                ocorrenciaItem.index
                                                                            )
                                                                        }
                                                                    "
                                                                    variant="tonal"
                                                                    style="padding: 5px"
                                                                    color="red"
                                                                    title="Excluir Ocorrência"
                                                                    message="Tem certeza de que deseja excluir essa ocorrência?"
                                                                >
                                                                </DeleteDialog>
                                                            </div>
                                                        </div>
                                                        <div class="row spacedRow">
                                                            <TabField label="Data da Ocorrência">
                                                                {{ formatDateForDisplay(ocorrenciaItem.dataOcorrencia!) }}
                                                            </TabField>
                                                            <TabField
                                                                label="Responsável pelo registro"
                                                            >
                                                                {{
                                                                    ocorrenciaItem
                                                                        .responsavelRegistro?.nome
                                                                }}
                                                            </TabField>
                                                        </div>

                                                            <TabField label="Responsável pela solução">
                                                            <span class="wrapText">{{ ocorrenciaItem.responsavelSolucao }}</span>
                                                        </TabField>
                                                        <TabField label="Descrição da Ocorrência">
                                                            <span class="wrapText">{{ ocorrenciaItem.descricao }}</span>
                                                        </TabField>
                                                        <TabField label="Resultados">
                                                            <span class="wrapText">{{ ocorrenciaItem.resultados }}</span>
                                                        </TabField>
                                                        <TabField label="Solução">
                                                            <span class="wrapText">{{ ocorrenciaItem.solucao }}</span>
                                                        </TabField>
                                                    </div>
                                                </template>
                                                <template #1>
                                                    <VForm
                                                        :ref="(el)=>{
                                                            getOcorrenciaTabRefs(ocorrenciaItem.id, ocorrenciaItem.index).form.value=el as VForm
                                                            }"
                                                    >
                                                        <div
                                                            class="row"
                                                            style="justify-content: space-between"
                                                        >
                                                            Ocorrência #{{
                                                                ocorrenciaItem.id ?? "Nova"
                                                            }}
                                                            <div class="row">
                                                                <VBtn
                                                                    v-if="!somenteLeitura"
                                                                    :onclick="
                                                                        () => {
                                                                            const riscoTab = getRiscoTabRefs(riscoItem.id)
                                                                            const ocorrenciaTab  = getOcorrenciaTabRefs(ocorrenciaItem.id, ocorrenciaItem.index);
                                                                            if(ocorrenciaItem.index){
                                                                                savePost(
                                                                                    ocorrenciaTab,
                                                                                    riscoTab,
                                                                                    riscoItem.id,
                                                                                    ocorrenciaItem.index
                                                                                )
                                                                            }else{
                                                                            saveUpdate(
                                                                                ocorrenciaTab,
                                                                                ocorrenciaItem.id!,
                                                                                riscoTab,
                                                                                riscoItem.id
                                                                            )}
                                                                        }
                                                                    "
                                                                    variant="tonal"
                                                                    style="padding: 5px"
                                                                    ><IconDeviceFloppy></IconDeviceFloppy
                                                                ></VBtn>
                                                                <VBtn
                                                                    variant="tonal"
                                                                    style="padding: 5px"
                                                                    @click="
                                                                        () => {
                                                                            const ocorrencia =
                                                                                getOcorrenciaTabRefs(
                                                                                    ocorrenciaItem.id,
                                                                                    ocorrenciaItem.index
                                                                                )
                                                                            ocorrencia.form.value?.reset()
                                                                            if (ocorrenciaItem.id) {
                                                                                ocorrencia.update.value = 0
                                                                            } else {
                                                                                deleteAddedItem(
                                                                                    getRiscoTabRefs(
                                                                                        riscoItem.id
                                                                                    ),
                                                                                    ocorrenciaItem.index
                                                                                )
                                                                            }
                                                                        }
                                                                    "
                                                                >
                                                                    <IconX></IconX>
                                                                </VBtn>
                                                            </div>
                                                        </div>
                                                        <div class="row spacedRow">
                                                            <TabField label="Data da Ocorrência">
                                                                <DatePicker
                                                                    v-model="
                                                                        getOcorrenciaTabRefs(
                                                                            ocorrenciaItem.id,
                                                                            ocorrenciaItem.index
                                                                        ).model.value.dataOcorrencia
                                                                    "
                                                                    :rules="[notEmptyRule]"
                                                                ></DatePicker>
                                                            </TabField>
                                                            <TabField
                                                                label="Responsável pela solução"
                                                            >
                                                                <VTextField
                                                                    variant="solo-filled"
                                                                    density="compact"
                                                                    v-model="
                                                                        getOcorrenciaTabRefs(
                                                                            ocorrenciaItem.id,
                                                                            ocorrenciaItem.index
                                                                        ).model.value
                                                                            .responsavelSolucao
                                                                    "
                                                                    :rules="[notEmptyRule, nameRule]"
                                                                ></VTextField>
                                                            </TabField>
                                                        </div>
                                                        <TabField label="Descrição da Ocorrência">
                                                            <VTextarea
                                                                v-model="
                                                                    getOcorrenciaTabRefs(
                                                                        ocorrenciaItem.id,
                                                                        ocorrenciaItem.index
                                                                    ).model.value.descricao
                                                                "
                                                                variant="solo-filled"
                                                                density="compact"
                                                                placeholder="Descreva o que aconteceu"
                                                                :rules="[notEmptyRule]"
                                                            ></VTextarea>
                                                        </TabField>
                                                        <TabField label="Resultados">
                                                            <VTextarea
                                                                v-model="
                                                                    getOcorrenciaTabRefs(
                                                                        ocorrenciaItem.id,
                                                                        ocorrenciaItem.index
                                                                    ).model.value.resultados
                                                                "
                                                                variant="solo-filled"
                                                                density="compact"
                                                                placeholder="Descreva o impacto que esta ocorrência causou"
                                                                :rules="[notEmptyRule]"
                                                            ></VTextarea>
                                                        </TabField>
                                                        <TabField label="Solução">
                                                            <VTextarea
                                                                v-model="
                                                                    getOcorrenciaTabRefs(
                                                                        ocorrenciaItem.id,
                                                                        ocorrenciaItem.index
                                                                    ).model.value.solucao
                                                                "
                                                                variant="solo-filled"
                                                                density="compact"
                                                                placeholder="Descreva as ações que foram tomadas como resposta"
                                                                :rules="[notEmptyRule]"
                                                            ></VTextarea>
                                                        </TabField>
                                                    </VForm>
                                                </template>
                                            </TabTransition>
                                        </VCard>
                                    </template>
                                </VDataTableServer>
                            </template>
                        </TabTransition>
                    </div>
                </VCard>
            </template>
        </VDataTableServer>
    </VCard>
    <BackToTopButton></BackToTopButton>
</template>
