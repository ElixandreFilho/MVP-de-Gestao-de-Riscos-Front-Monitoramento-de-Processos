<script setup lang="ts">
import { IconBuilding, IconPlus, IconPencilPlus, IconArrowLeft, IconX } from "@tabler/icons-vue"
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { VBtn, VCard, VContainer, VTooltip, VDataTable } from "vuetify/components"
import DeleteDialog from "../../components/DeleteDialog.vue"
import Dialog from "../../components/Dialog.vue"
import CreateSiglaForm from "../../components/createForms/siglas/CreateSiglaForm.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import type { DataTableHeader } from "vuetify"
import type { Sigla } from "../../types/sigla"
import axios from "axios"
import type { Processo } from "../../types/processo"

import {
    closeDialog,
    editingSigla,
    isEditing,
    openEditSiglaDialog,
    openNewSigla,
    showNewDialog,
    siglas,
    addSigla,
    updateSigla,
    deleteSigla,
    fetchSiglas,
    clearSiglasState,
    isLoadingSiglas,
    hasErrorSiglas
} from "./sigla"

const route = useRoute()
const processoAtual = ref<Processo | null>(null)

const hasValidProcess = computed(() => currentProcessId.value !== null)

const extractErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message
    if (typeof err === "object" && err !== null && "message" in err) {
        return (err as { message: string }).message
    }
    return fallback
}

const currentProcessId = computed<number | null>(() => {
    const raw = route.query.processoId
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
})

let loadGeneration = 0
let abortController: AbortController | null = null

const fetchProcessoData = async (processoId: number, signal: AbortSignal): Promise<Processo> => {
    const response = await axios.get<Processo>(`/processos/${processoId}`, { signal })
    return response.data
}

const loadPageData = async (processoId: number | null) => { 
    const generation = ++loadGeneration

    abortController?.abort()
    abortController = new AbortController()

    processoAtual.value = null
    clearSiglasState()
    isLoadingSiglas.value = false
    hasErrorSiglas.value = false

    if (!processoId) return

    isLoadingSiglas.value = true

    try {
        const [processo, novasSiglas] = await Promise.all([
            fetchProcessoData(processoId, abortController.signal),
            fetchSiglas(processoId, abortController.signal)
        ])

        if (generation !== loadGeneration) return

        processoAtual.value = processo
        siglas.value = novasSiglas
        isLoadingSiglas.value = false
    } catch (error) {

        if (axios.isCancel(error)) return
        

        if (generation !== loadGeneration) return

        console.error("Erro ao carregar dados da página:", error)
        hasErrorSiglas.value = true
        isLoadingSiglas.value = false
    }
}

onUnmounted(() => {
    abortController?.abort()
    closeDialog()
})

onMounted(() => {
    loadPageData(currentProcessId.value)
})

watch(
    () => currentProcessId.value,
    (newId) => { 
        loadPageData(newId)
    }
)

const header = computed<DataTableHeader[]>(() => [
    { title: "Sigla", align: "start", key: "sigla" },
    { title: "Descrição", key: "descricao" },
    { title: "Ações", key: "actions", align: "end", fixed: "end", sortable: false, nowrap: true },
])

const isNewDialogOpen = computed({
    get: () => showNewDialog.value,
    set: (value: boolean) => {
        showNewDialog.value = value
    },
})

const onOpenNewSigla = () => {
    if (!currentProcessId.value) {
        showMessage("Processo não identificado. Acesse por Gerenciar Riscos.", "error")
        return
    }
    openNewSigla()
}

const onSiglaCreated = async (data: { sigla: string; descricao: string; processId: number | null }) => {
    try {
        const processIdToUse = data.processId ?? currentProcessId.value

        if (!processIdToUse) {
            throw new Error("Processo não identificado para criar a sigla.")
        }

        await addSigla(data.sigla, data.descricao, processIdToUse)
        showMessage("Sigla criada com sucesso!", "success")

        loadPageData(currentProcessId.value)
    } catch (error) {
        const errorMessage = extractErrorMessage(error, "Erro ao criar sigla.")
        showMessage(errorMessage, "error")
        throw error
    }
}

const onSiglaUpdated = async (data: { sigla: string; descricao: string; processId: number | null }) => {
    if (!editingSigla.value?.id) return

    try {
        const processIdToUse = data.processId ?? currentProcessId.value ?? editingSigla.value.processo?.id ?? null

        if (!processIdToUse) {
            throw new Error("Processo não identificado para atualizar a sigla.")
        }

        await updateSigla(editingSigla.value.id, data.sigla, data.descricao, processIdToUse)
        showMessage("Sigla atualizada com sucesso!", "success")

        loadPageData(currentProcessId.value)
    } catch (error) {
        const errorMessage = extractErrorMessage(error, "Erro ao atualizar sigla.")
        showMessage(errorMessage, "error")
        throw error
    }
}

const getSiglaFromTableItem = (item: unknown): Sigla => {
    const maybeWrapped = item as { raw?: Sigla; item?: Sigla; value?: Sigla }
    return maybeWrapped.raw ?? maybeWrapped.item ?? maybeWrapped.value ?? (item as Sigla)
}

const onEditSigla = (item: unknown) => {
    try {
        openEditSiglaDialog(getSiglaFromTableItem(item))
    } catch (error) {
        showMessage(error instanceof Error ? error.message : "Erro ao editar sigla.", "error")
    }
}

const onDeleteSigla = async (item: unknown): Promise<boolean> => {
    const sigla = getSiglaFromTableItem(item)

    if (sigla.id === undefined) {
        showMessage("Sigla inválida para exclusão.", "error")
        return false
    }

    try {
        await deleteSigla(sigla.id)

        showMessage("Sigla excluída com sucesso!", "success")

        loadPageData(currentProcessId.value)
        return true
    } catch (error) {
        showMessage(error instanceof Error ? error.message : "Erro ao excluir sigla.", "error")
        return false
    }
}
</script>

<template>
    <VContainer class="col" style="gap: 20px" fluid>
        <VBtn
            variant="text"
            style="place-self: start; text-transform: none"
            color="black"
            :to="{ name: 'Processes', query: { tab: 1, processoId: currentProcessId ?? undefined } }"
        >
            <IconArrowLeft size="18" style="vertical-align: bottom; margin-right: 5px" />
            Voltar
        </VBtn>

        <VCard class="col" style="padding: 20px; gap: 20px">
            <div class="row" style="justify-content: space-between; align-items: center">
                <h3 style="padding: 0; margin: 0" class="title-with-truncate">
                    Siglas do processo:
                <span class="process-name">
                  {{ processoAtual?.nome ?? (currentProcessId ? 'Carregando...' : 'Processo não informado') }}
                </span>
                </h3>
                <VBtn
                  @click="onOpenNewSigla"
                  :disabled="!hasValidProcess"
                >
                    <IconPlus size="18" />
                    Adicionar Sigla
                </VBtn>
            </div>

            <div v-if="isLoadingSiglas" class="text-center" style="padding: 40px 20px">
                <VProgressCircular indeterminate color="primary" size="48" />
                <h3 style="color: #666; margin-top: 16px">Carregando siglas...</h3>
            </div>

            <div v-else-if="hasErrorSiglas" class="text-center" style="padding: 40px 20px">
                <IconX size="64" color="var(--v-theme-error)" />
                <h3 style="color: var(--v-theme-error); margin-top: 16px">Falha ao carregar as siglas.</h3>
                <p style="color: #666; margin-bottom: 16px">Verifique sua conexão ou tente novamente mais tarde.</p>
                <VBtn color="primary" variant="outlined" style="text-transform: none" @click="loadPageData(currentProcessId)">
                    Tentar Novamente
                </VBtn>
            </div>

            <div v-else-if="siglas.length > 0">
                <VCard>
                    <VDataTable :headers="header" :items="siglas" class="plainTable">
                        <template #[`item.actions`]="{ item }">
                            <div class="row" style="gap: 10px; justify-content: flex-end">
                                <VBtn
                                    class="actionButton"
                                    variant="outlined"
                                    color="black"
                                    @click.stop="onEditSigla(item)"
                                    style="padding: 0 10px; min-width: 40px"
                                >
                                    <IconPencilPlus size="18" />
                                    <VTooltip activator="parent" location="top">Editar</VTooltip>
                                </VBtn>

                                <DeleteDialog
                                    :confirm-delete="() => onDeleteSigla(item)"
                                    title="Excluir Sigla"
                                    style="padding: 0 10px; min-width: 40px"
                                    class="actionButton"
                                    variant="outlined"
                                    color="black"
                                    message="Deseja excluir esta sigla?"
                                    icon-size="18"
                                />
                            </div>
                        </template>
                    </VDataTable>
                </VCard>
            </div>

            <div v-else class="text-center" style="padding: 40px 20px">
                <IconBuilding size="64" color="#ccc" />
                <h3 style="color: #999; margin-top: 16px">Nenhuma sigla cadastrada.</h3>
            </div>
        </VCard>

        <Dialog v-model="isNewDialogOpen">
            <CreateSiglaForm
                :close-dialog="closeDialog"
                :create-sigla="onSiglaCreated"
                :editing-sigla="editingSigla"
                :is-editing="isEditing"
                :update-sigla="onSiglaUpdated"
                :process-id="currentProcessId"
            />
        </Dialog>
    </VContainer>
</template>

<style scoped>
.col {
    display: flex;
    flex-direction: column;
}
.row {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
}
.text-center {
    text-align: center;
}

:deep(.actionButton) {
    font-size: 14px;
    text-transform: capitalize;
    padding: 8px !important;
    height: fit-content;
    border-color: hsl(0, 0%, 80%);
}

.title-with-truncate {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
}

.process-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}
</style>
