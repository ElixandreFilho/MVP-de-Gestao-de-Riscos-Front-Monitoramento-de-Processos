<script setup lang="ts">
import {
    IconClipboardList,
    IconPlus,
    IconSettings,
    IconTrash,
    IconX,
    IconEraser,
    IconPencilPlus,
    IconSend,
    IconBan,
    IconRotateClockwise,
} from "@tabler/icons-vue"
import { computed, ref, watch, type Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import { type DataTableHeader } from "vuetify"
import type { Processo } from "../../types/processo"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import CreateProcessoForm from "../../components/createForms/processo/CreateProcessoForm.vue"
import TreeViewField from "../../components/TreeViewField.vue"
import DatePicker from "../../components/DatePicker.vue"
import Dialog from "../../components/Dialog.vue"
import ProcessManagementPage from "./ProcessManagementPage.vue"
import { getParentUnidade, getUnidadeTree, unidadesTree } from "../../core/unidades"
import { selectedProcesso } from "./processoPage"
import processoService from "../../services/processoService"
import { useUnidadeStore } from "../../stores/unidadeStore"
import { showMessage } from "../../components/snackbar/SnackbarState"
import { gotToTop, scrollY } from "../../components/backTopTopButton"
import acompanhamentoService from "../../services/acompanhamentoService"
import { StatusAcompanhamentoProcesso, type StatusAcompanhamentoProcesso as StatusAcompanhamento } from "../../types/acompanhamento"

const processos: Ref<Processo[]> = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const listLength = ref(0)
const deleteId = ref<number | null>(null)
const route = useRoute()
const router = useRouter()

const headers: DataTableHeader<Processo>[] = [
    { title: "Nome do Processo", value: "nome", width: "300px" },
    { title: "Unidade", value: "unidadeOrganizacional.nome", width: "300px" },
    { title: "Setor", value: "setor.nome", width: "300px" },
    { title: "Acompanhamento", value: "statusAcompanhamento", width: "180px" },
    { title: "Prazo de envio", value: "prazoEnvio", width: "150px" },
    { title: "Ações", value: "actions", width: "1%", minWidth: "250px", align: "center", fixed: "end" },
]

const unidadeStore = useUnidadeStore()
const unidades = computed(() => {
    if (isAdmin.value) {
        return unidadesTree
    }
    return getUnidadeTree(unidadeStore.unidade?.id)
})

const tab = ref(0)
const isAdmin = computed(() => unidadeStore.isAdmin)
const isAcompanhamentoFlow = computed(() => route.meta.acompanhamentoFlow === true)
const isSomenteLeituraAcompanhamento = computed(() => {
    const modo = Array.isArray(route.query.modo) ? route.query.modo[0] : route.query.modo
    return isAcompanhamentoFlow.value && modo === "visualizacao"
})
const backLabel = computed(() =>
    isAcompanhamentoFlow.value ? "Voltar para Acompanhamento" : "Voltar para Lista de Processos"
)

const showNewDialog = ref(false)
const showDialogs = new Map<number, { delete: Ref<boolean>; update: Ref<boolean> }>()
const showEnviarAnaliseDialog = ref(false)
const envioAnaliseLoading = ref(false)
const processoParaEnvioAnalise = ref<Processo | null>(null)

const unidadeOrganizacional = computed(() => selectedProcesso.value?.unidadeOrganizacional)

const unidadePai = computed(() => getParentUnidade(unidadeOrganizacional.value?.id))

const unidade = computed(() => {
    if (unidadePai.value) {
        return unidadePai.value.nome
    }
    return unidadeOrganizacional.value?.nome
})

const setor = computed(() => {
    if (unidadePai.value) {
        return unidadeOrganizacional.value?.nome
    }
    return undefined
})

const unidadeId: Ref<{ id: number | null }> = ref({ id: null })

const filters = ref({
    initialDate: "",
    finalDate: "",
    name: "",
    unit: unidadeId,
})

const syncRouteState = async () => {
    const tabQuery = route.query.tab
    const tabValue = Array.isArray(tabQuery) ? tabQuery[0] : tabQuery

    const rawProcessoId = route.params.processoId ?? route.query.processoId
    const processoIdValue = Array.isArray(rawProcessoId) ? rawProcessoId[0] : rawProcessoId
    const processoId = Number(processoIdValue)

    if (!isAcompanhamentoFlow.value && tabValue !== "1") {
        tab.value = 0
        return
    }

    if (!Number.isFinite(processoId) || processoId <= 0) {
        tab.value = 1
        return
    }

    if (selectedProcesso.value?.id === processoId) {
        tab.value = 1
        return
    }

    try {
        const response = await axios.get<Processo>(`/processos/${processoId}`)
        selectedProcesso.value = response.data
        tab.value = 1
    } catch (error) {
        console.error("Erro ao restaurar processo selecionado:", error)
    }
}

watch(
    () => [route.name, route.params.processoId, route.query.tab, route.query.processoId, route.query.modo],
    () => {
        void syncRouteState()
    },
    { immediate: true }
)

const loadItems = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
    loading.value = true
    try {
        const res = await processoService.getAll(page, itemsPerPage, {
            name: filters.value.name.trim(),
            initialDate: filters.value.initialDate,
            finalDate: filters.value.finalDate,
            unit: unidadeId.value.id,
        })
        showDialogs.clear()
        res.content.forEach((item) => {
            showDialogs.set(item.id, { delete: ref(false), update: ref(false) })
        })
        processos.value = res.content
        pageSize.value = itemsPerPage
        currentPage.value = page
        listLength.value = res.totalElements
    } catch (error) {
        console.error("Erro ao carregar processos:", error)
        showMessage("Erro ao carregar a lista de processos.", "error")
    } finally {
        loading.value = false
    }
}


let debounceTimer: number | undefined

watch(
    () => filters.value.name,
    () => {
        if(debounceTimer){
            clearTimeout(debounceTimer)
        }
        debounceTimer = window.setTimeout(() => {
            currentPage.value = 1
            loadItems({page: 1, itemsPerPage: pageSize.value})
        }, 400)
    }
)

watch(
    [
        () => filters.value.initialDate,
        () => filters.value.finalDate,
        () => unidadeId.value.id
    ],
    () => {
        if (!loading.value) {
            currentPage.value = 1
            loadItems({ page: 1, itemsPerPage: pageSize.value })
        }
    }
)


const validateFinalDate = (value: string) => {
    const initial = filters.value.initialDate
    const final = value

    if (!initial || !final) {
        return true
    }

    if (final < initial) {
        return "Data final não pode ser anterior à data inicial."
    }

    return true
}

const hasActiveFilters = computed(() => {
    if (filters.value.name.trim() !== "") {
        return true
    }

    if (filters.value.initialDate !== "" || filters.value.finalDate !== "") {
        return true
    }

    if (unidadeId.value.id !== null) {
        return true
    }
    return false
})

const clearFilters = () => {
    filters.value.name = ""
    filters.value.initialDate = ""
    filters.value.finalDate = ""
    unidadeId.value = { id: null }

    loadItems({ page: 1, itemsPerPage: pageSize.value })
}

const deleteProcesso = async (id: number) => {
    try {
        await processoService.delete(id)
        showMessage("Processo excluído com sucesso!", "success")
        showDialogs.get(id)!.delete.value = false
        deleteId.value = null
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch (e) {
        console.error("Erro ao excluir processo:", e)
        showMessage("Erro ao excluir processo.", "error")
    }
}

const statusAcompanhamento = (processo: Processo): StatusAcompanhamento => {
    return processo.statusAcompanhamento ?? StatusAcompanhamentoProcesso.RASCUNHO
}

const statusLabel = (status: StatusAcompanhamento): string => {
    const labels: Record<StatusAcompanhamento, string> = {
        RASCUNHO: "Rascunho",
        AGUARDANDO_ANALISE: "Aguardando análise",
        EM_ANALISE: "Em análise",
        EM_AJUSTE: "Em ajuste",
        CONCLUIDO: "Concluído",
        PENDENTE_REVISAO: "Pendente de revisão",
    }
    return labels[status]
}

const statusColor = (status: StatusAcompanhamento): string => {
    const colors: Record<StatusAcompanhamento, string> = {
        RASCUNHO: "grey",
        AGUARDANDO_ANALISE: "blue",
        EM_ANALISE: "indigo",
        EM_AJUSTE: "orange",
        CONCLUIDO: "green",
        PENDENTE_REVISAO: "purple",
    }
    return colors[status]
}

const formatDate = (value?: string | null): string => {
    if (!value) return "-"
    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR")
}

const isEnvioPendente = (processo: Processo): boolean => {
    if (typeof processo.envioPendente === "boolean") return processo.envioPendente

    const status = statusAcompanhamento(processo)
    return status === StatusAcompanhamentoProcesso.RASCUNHO ||
        status === StatusAcompanhamentoProcesso.PENDENTE_REVISAO
}

const prazoEnvioTooltip = (processo: Processo): string => {
    if (processo.envioAtrasado) {
        const limiteAtraso = formatDate(processo.limiteAtrasoPrazoEnvio ?? processo.prazoEnvio)
        return `Processo não enviado. O prazo foi excedido em ${limiteAtraso}.`
    }

    if (isEnvioPendente(processo)) {
        return "Processo ainda não enviado, dentro do prazo."
    }

    return "Processo enviado no prazo."
}

const abrirEnvioParaAnalise = (processo: Processo) => {
    processoParaEnvioAnalise.value = processo
    showEnviarAnaliseDialog.value = true
}

const fecharEnvioParaAnalise = () => {
    if (envioAnaliseLoading.value) return

    showEnviarAnaliseDialog.value = false
    processoParaEnvioAnalise.value = null
}

const enviarProcessoParaAnalise = async () => {
    const processo = processoParaEnvioAnalise.value
    if (!processo) return

    envioAnaliseLoading.value = true

    try {
        const pendencias = await acompanhamentoService.consultarPendencias(processo.id)
        if (!pendencias.aptoParaEnvio) {
            showMessage(`Pendências: ${pendencias.pendencias.join("; ")}`, "info")
            showEnviarAnaliseDialog.value = false
            processoParaEnvioAnalise.value = null
            return
        }

        await acompanhamentoService.enviarParaAnalise(processo.id)
        showMessage("Processo enviado para análise.", "success")
        showEnviarAnaliseDialog.value = false
        processoParaEnvioAnalise.value = null
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch (error) {
        console.error(error)
        showMessage("Erro ao enviar processo para análise.", "error")
    } finally {
        envioAnaliseLoading.value = false
    }
}

const cancelarEnvioProcesso = async (processo: Processo) => {
    if (!globalThis.confirm("Cancelar o envio deste processo para análise?")) return

    try {
        await acompanhamentoService.cancelarEnvio(processo.id)
        showMessage("Envio cancelado com sucesso.", "success")
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch (error) {
        console.error(error)
        showMessage("Erro ao cancelar envio.", "error")
    }
}

const reenviarProcessoAjustado = async (processo: Processo) => {
    const observacao = globalThis.prompt("Observação sobre os ajustes realizados") ?? ""
    if (!globalThis.confirm("Reenviar este processo ajustado para análise?")) return

    try {
        await acompanhamentoService.reenviarAjustado(processo.id, { observacao })
        showMessage("Processo reenviado para análise.", "success")
        await loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    } catch (error) {
        console.error(error)
        showMessage("Erro ao reenviar processo.", "error")
    }
}

const podeEnviarAcompanhamento = (processo: Processo): boolean => {
    const status = statusAcompanhamento(processo)
    return (
        !isAdmin.value &&
        (status === StatusAcompanhamentoProcesso.RASCUNHO ||
            status === StatusAcompanhamentoProcesso.PENDENTE_REVISAO)
    )
}

const podeCancelarEnvioAcompanhamento = (processo: Processo): boolean => {
    return (
        !isAdmin.value &&
        statusAcompanhamento(processo) === StatusAcompanhamentoProcesso.AGUARDANDO_ANALISE
    )
}

const podeReenviarAcompanhamento = (processo: Processo): boolean => {
    return !isAdmin.value && statusAcompanhamento(processo) === StatusAcompanhamentoProcesso.EM_AJUSTE
}

const editingProcesso = ref<Processo | null>(null)

const openEditDialog = (processo: Processo) => {
    editingProcesso.value = { ...processo }
    showDialogs.get(processo.id)!.update.value = true
}

const setElementScroll = (el: HTMLElement | null) => {
    const parent = (el as HTMLElement)?.parentElement as HTMLElement
    if (parent) {
        gotToTop.value = () => {
            parent.scrollTo({ top: 0, behavior: "smooth" })
        }
        parent.onscroll = () => {
            scrollY.value = parent.scrollTop || 0
        }
    }
}

const voltarDaGestaoProcesso = async () => {
    if (isAcompanhamentoFlow.value) {
        await router.push({ name: "Acompanhamento" })
        return
    }

    tab.value = 0
}
</script>
<template>
    <div
        :ref="(el)=>{
            setElementScroll(el as HTMLElement)
    }"
    >
    <TabTransition :tab-slots="2" v-model="tab">
        <template #0>
            <VContainer class="col" style="gap: 20px" fluid>
                <div class="row" style="justify-content: space-between; align-items: center">
                    <div style="text-align: start">
                        <h2 style="padding: 0">Gerenciamento de Processos</h2>
                        <h4 style="text-wrap: wrap; color: hsl(0, 0%, 30%); padding: 0">
                            Visualize e gerencie processos de todas as unidades
                        </h4>
                    </div>
                    <div class="row">
                        <VBtn
                            v-if="isAdmin"
                            style="text-transform: none"
                            variant="outlined"
                            :to="{ name: 'ProcessSettings' }"
                        >
                            <IconSettings></IconSettings> Configurações
                        </VBtn>
                        <Dialog v-model="showNewDialog">
                            <template #activator="{ props }">
                                <VBtn style="text-transform: none" v-bind="props"
                                    ><IconPlus size="18" /> Novo Processo
                                </VBtn>
                            </template>
                            <CreateProcessoForm
                                :close-dialog="
                                    () => {
                                        loadItems({ page: currentPage, itemsPerPage: pageSize })
                                        showNewDialog = false
                                    }
                                "
                            ></CreateProcessoForm>
                        </Dialog>
                    </div>
                </div>
                <VCard class="row filter-card">
                    <div class="filterField filter-name">
                        Busca por nome
                        <VTextField
                            v-model="filters.name"
                            density="compact"
                            prepend-inner-icon="Search"
                            hide-details
                            variant="solo"
                            bg-color="hsl(0,0%,95%)"
                            placeholder="Digite o nome do processo"
                            class="filledField"
                        ></VTextField>
                    </div>

                    <div class="filterField filter-date">
                        Data inicial
                        <DatePicker
                            v-model="filters.initialDate"
                            hide-details
                        >
                        </DatePicker>
                    </div>
                    <div class="filterField filter-date">
                        Data final
                        <DatePicker
                            v-model="filters.finalDate"
                            :min="filters.initialDate"
                            hide-details :rules="[validateFinalDate as (value: string | null | undefined) => string | boolean]"
                        >
                        </DatePicker>
                    </div>
                    <div class="filterField filter-actions-row">
                        <div class="actions-content">
                            <div v-if="isAdmin" class="unit-wrapper">
                                Filtrar por unidade
                                <TreeViewField
                                    v-model="unidadeId"
                                    placeholder="Selecione uma unidade"
                                    bg-color="hsl(0,0%,95%)"
                                    color="none"
                                    border="none"
                                    :hide-details="true"
                                    :items="unidades ? unidadesTree : []"
                                    density="compact"
                                    :max-chars="30" 
                                >
                                </TreeViewField>
                            </div>

                            <VBtn
                                v-if="hasActiveFilters"
                                @click="clearFilters"
                                variant="outlined"
                                class="clear-filters-btn"
                                style="text-transform: none; white-space: nowrap; padding: 8px 12px; height: 40px;"
                              >
                                <IconEraser size="18" style="margin-right: 5px" />
                                Limpar Filtros
                            </VBtn>
                        </div>
                    </div>
                </VCard>

                <VDataTableServer
                    :headers="headers"
                    :items-per-page="pageSize"
                    :page="currentPage"
                    :loading="loading"
                    :items-length="listLength"
                    v-on:update:options="loadItems"
                    :items="processos"
                >
                    <template #[`item.statusAcompanhamento`]="{ item }">
                        <VChip
                            size="small"
                            :color="statusColor(statusAcompanhamento(item))"
                            variant="tonal"
                        >
                            {{ statusLabel(statusAcompanhamento(item)) }}
                        </VChip>
                    </template>
                    <template #[`item.prazoEnvio`]="{ item }">
                        <div v-if="item.prazoEnvio" class="deadline-cell">
                            <VTooltip
                                :text="prazoEnvioTooltip(item)"
                                location="top"
                            >
                                <template #activator="{ props }">
                                    <VChip
                                        v-bind="props"
                                        size="small"
                                        :color="item.envioAtrasado ? 'error' : 'success'"
                                        variant="tonal"
                                        class="deadline-chip"
                                    >
                                        {{ formatDate(item.prazoEnvio) }}
                                    </VChip>
                                </template>
                            </VTooltip>
                        </div>
                        <span v-else class="deadline-empty">
                            Sem prazo
                        </span>
                    </template>
                    <template #[`item.actions`]="{ item }">
                        <div class="row" style="justify-content: center; gap: 10px; flex-wrap: nowrap">
                            <VTooltip
                                v-if="podeEnviarAcompanhamento(item)"
                                text="Enviar para análise"
                                location="top"
                            >
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        class="actionButton"
                                        variant="outlined"
                                        color="black"
                                        style="padding: 0 10px; min-width: 40px"
                                        @click="abrirEnvioParaAnalise(item)"
                                    >
                                        <IconSend size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>

                            <VTooltip
                                v-if="podeCancelarEnvioAcompanhamento(item)"
                                text="Cancelar envio"
                                location="top"
                            >
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        class="actionButton"
                                        variant="outlined"
                                        color="black"
                                        style="padding: 0 10px; min-width: 40px"
                                        @click="cancelarEnvioProcesso(item)"
                                    >
                                        <IconBan size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>

                            <VTooltip
                                v-if="podeReenviarAcompanhamento(item)"
                                text="Reenviar ajustes"
                                location="top"
                            >
                                <template #activator="{ props }">
                                    <VBtn
                                        v-bind="props"
                                        class="actionButton"
                                        variant="outlined"
                                        color="black"
                                        style="padding: 0 10px; min-width: 40px"
                                        @click="reenviarProcessoAjustado(item)"
                                    >
                                        <IconRotateClockwise size="18" />
                                    </VBtn>
                                </template>
                            </VTooltip>
                            <VBtn
                                class="actionButton"
                                variant="outlined"
                                color="black"
                                @click="
                                    () => {
                                        tab = 1
                                        selectedProcesso = item
                                    }
                                "
                            >
                                <div>
                                    <IconClipboardList size="18" style="vertical-align: bottom" />
                                    Gerenciar Riscos
                                </div>
                                </VBtn>

                                <Dialog v-model="showDialogs.get(item.id)!.update.value">
                                    <template #activator="{ props }">
                                        <VBtn
                                            v-bind="props"
                                            class="actionButton"
                                            variant="outlined"
                                            color="black"
                                            @click="openEditDialog(item)"
                                            style="padding: 0 10px; min-width: 40px"
                                        >
                                            <IconPencilPlus size="18" />
                                        </VBtn>
                                    </template>

                                    <CreateProcessoForm
                                        :processo-edicao="editingProcesso"
                                        :close-dialog="
                                            () => {
                                                if(editingProcesso) {
                                                    showDialogs.get(editingProcesso.id)!.update.value = false
                                                    editingProcesso = null
                                                    loadItems({ page: currentPage, itemsPerPage: pageSize })
                                                }
                                            }
                                        "
                                    />
                                </Dialog>

                                <Dialog
                                    max-width="350px"
                                    v-model="showDialogs.get(item.id)!.delete.value"
                                >
                                    <template #activator="{ props }">
                                        <VBtn
                                            v-bind="props"
                                            class="actionButton"
                                            variant="outlined"
                                            color="black"
                                            @click="
                                                () => {
                                                    deleteId = item.id
                                                    showDialogs.get(item.id)!.delete.value = true
                                                }
                                            "
                                            ><IconTrash size="18"></IconTrash>
                                        </VBtn>
                                    </template>
                                    <VCard
                                        style="margin: auto; padding: 20px; gap: 20px"
                                        class="col"
                                    >
                                        <div
                                            class="row"
                                            style="
                                                justify-content: start;
                                                margin-bottom: 0px;
                                                align-items: center;
                                                gap: 20px;
                                            "
                                        >
                                            <VBtn
                                                @click="
                                                    () => {
                                                        if(deleteId !== null) showDialogs.get(deleteId)!.delete.value = false
                                                    }
                                                "
                                                color="hsl(0, 50%, 50%)"
                                                style="padding: 5px"
                                            >
                                                <IconX size="25"></IconX>
                                            </VBtn>
                                            <h3>Excluir Processo</h3>
                                        </div>
                                        <div
                                            class="row"
                                            style="
                                                margin: 0px 0px;
                                                border-radius: 10px;
                                                background: hsl(0, 0%, 95%);
                                                gap: 0;
                                                flex-wrap: nowrap;
                                                overflow: hidden;
                                            "
                                        >
                                            <div
                                                style="
                                                    background-color: hsl(0, 0%, 80%);
                                                    width: 10px;
                                                "
                                            ></div>
                                            <span style="padding: 10px"
                                                >Tem certeza de que deseja excluir esse
                                                processo?</span
                                            >
                                        </div>

                                        <div class="row" style="justify-content: end; gap: 10px">
                                            <VBtn
                                                @click="
                                                    () => {
                                                        if(deleteId !== null) showDialogs.get(deleteId)!.delete.value = false
                                                    }
                                                "
                                                variant="outlined"
                                                >Cancelar</VBtn
                                            >
                                            <VBtn
                                                color="hsl(0,50%,50%)"
                                                @click="deleteProcesso(deleteId as number)"
                                            >
                                                Excluir</VBtn
                                            >
                                        </div>
                                    </VCard>
                                </Dialog>
                            </div>
                        </template>
                    </VDataTableServer>

                    <VDialog
                        v-model="showEnviarAnaliseDialog"
                        max-width="420"
                        :persistent="envioAnaliseLoading"
                    >
                        <VCard class="send-analysis-dialog-card" elevation="0">
                            <VCardTitle class="send-analysis-dialog-title">
                                <div class="send-analysis-dialog-heading">
                                    <span class="send-analysis-dialog-icon">
                                        <IconSend size="20" />
                                    </span>
                                    <span>Enviar para análise</span>
                                </div>
                                <VBtn
                                    icon
                                    variant="text"
                                    aria-label="Fechar confirmação de envio"
                                    :disabled="envioAnaliseLoading"
                                    @click="fecharEnvioParaAnalise"
                                >
                                    <IconX size="20" />
                                </VBtn>
                            </VCardTitle>
                            <VCardText class="send-analysis-dialog-text">
                                Enviar este processo para análise da SecGov?
                            </VCardText>
                            <VCardActions class="send-analysis-dialog-actions">
                                <VBtn
                                    variant="outlined"
                                    :disabled="envioAnaliseLoading"
                                    @click="fecharEnvioParaAnalise"
                                >
                                    Cancelar
                                </VBtn>
                                <VBtn
                                    color="primary"
                                    :loading="envioAnaliseLoading"
                                    @click="enviarProcessoParaAnalise"
                                >
                                    Confirmar
                                </VBtn>
                            </VCardActions>
                        </VCard>
                    </VDialog>
                </VContainer>
            </template>
            <template #1>
                <ProcessManagementPage
                    :change-tab="voltarDaGestaoProcesso"
                    :back-label="backLabel"
                    :unidade="unidade"
                    :setor="setor"
                    :processo="selectedProcesso"
                    :somente-leitura="isSomenteLeituraAcompanhamento"
                    :modo-acompanhamento="isAcompanhamentoFlow"
                ></ProcessManagementPage>
            </template>
        </TabTransition>
    </div>

</template>

<style scoped>
.filterField {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 6px;
    font-size: 14px;
    text-align: start;
    min-width: 0;
}

.filter-card {
    align-items: flex-start !important;
    flex-wrap: wrap;
    justify-content: flex-start !important;
    column-gap: 12px;
    row-gap: 8px;
    flex: 1;
    padding: 16px;
}

.filter-name {
    max-width: 400px;
    flex: 4;
}

.filter-date {
    max-width: 300px; 
    flex: 2;
}

.filter-unit {
    max-width: 250px; 
    flex: 2;
}

.filter-actions-row {
    flex-basis: 40%;
}

.filter-actions-row .actions-content {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
}

.filter-actions-row .unit-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-width: 400px;
}

.actionButton {
    font-size: 14px;
    text-transform: capitalize;
    padding: 8px !important;
    height: fit-content;
    border-color: hsl(0, 0%, 80%);
}

.deadline-cell {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    white-space: nowrap;
}

.deadline-chip,
.deadline-chip :deep(.v-chip__content) {
    white-space: nowrap;
}

.deadline-empty {
    display: inline-flex;
    align-items: center;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.2;
    white-space: nowrap;
}

.dateField {
    width: 100%;
    padding: 7px 10px;
    border-radius: 8px;
    background: hsl(0, 0%, 95%);
    font-size: 16px;
}

.clear-filters-btn {
    margin-bottom: 0px; 
}

div.send-analysis-dialog-card {
    align-items: stretch;
    justify-content: flex-start;
    gap: 14px;
    padding: 18px !important;
    border: var(--border);
    border-radius: 8px !important;
    background: white;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.16) !important;
}

.send-analysis-dialog-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: auto;
    padding: 0 !important;
    color: #111827;
    font-size: 18px;
    font-weight: 600;
}

.send-analysis-dialog-heading {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
}

.send-analysis-dialog-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 8px;
    background: #eef2ff;
    color: rgb(var(--v-theme-primary));
}

.send-analysis-dialog-text {
    padding: 12px !important;
    border: var(--border);
    border-radius: 8px;
    background: #f5f7fb;
    color: #374151;
    font-size: 14px;
    line-height: 1.45;
}

.send-analysis-dialog-actions {
    justify-content: flex-end;
    gap: 8px;
    padding: 0 !important;
}
</style>
