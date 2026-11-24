<script setup lang="ts">
import { ref, watch, type Ref } from "vue"
import type { Risco } from "../../types/risco"
import { IconEdit, IconEye, IconPencilPlus, IconPlus } from "@tabler/icons-vue"
import Dialog from "../../components/Dialog.vue"
import CreateRiscoForm from "../../components/createForms/risco/CreateRiscoForm.vue"
import ViewRiscoDetails from "../../components/viewForms/risco/ViewRiscoDetails.vue"
import riscoService from "../../services/riscoService"
import type { DataTableHeader } from "vuetify"
import DeleteDialog from "../../components/DeleteDialog.vue"
import { selectedProcesso } from "./processoPage"
import { categoriaIntegridade, risco } from "../../components/createForms/risco/risco"
import { showMessage } from "../../components/snackbar/SnackbarState"
import BackToTopButton from "../../components/BackToTopButton.vue"

const props = defineProps<{
    somenteLeitura?: boolean
}>()

const riscos: Ref<Risco[]> = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const listLength = ref(0)
const showNewDialog = ref(false)
const typingTimeout = ref(null as ReturnType<typeof setTimeout> | null)

const riscoName = ref("")
const showDialogs = new Map<number, { delete: Ref<boolean>; update: Ref<boolean>; view: Ref<boolean> }>()

risco.value.processo.id = selectedProcesso.value?.id ?? null

const riscoId: Ref<number | null> = ref(null)

const headers: DataTableHeader[] = [
    { title: "Nome", key: "nome", width: "400px" },
    { title: "Fase do Processo", key: "faseProcesso", width: "200px" },
    { title: "Tipo de Risco", key: "tipoRisco", width: "200px" },
    {
        title: "Ações",
        align: "center",
        key: "actions",
        width: "1%",
        minWidth: "100px",
        fixed: "end",
        headerProps: { class: "actions-header" },
        sortable: false,
        nowrap: true,
    },
]

const post = async () => {
    if (props.somenteLeitura) return

    if (risco.value.categoria.id !== categoriaIntegridade.value?.id) {
        risco.value.tipoRiscoIntegridade = null
    }

    await riscoService.post(risco.value)
    loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    showMessage("Risco criado com sucesso", "success")
}

const update = async () => {
    if (props.somenteLeitura) return

    if (!riscoId.value) return
    if (risco.value.categoria.id !== categoriaIntegridade.value?.id) {
        risco.value.tipoRiscoIntegridade = null
    }
    await riscoService.update(risco.value, riscoId.value)
    loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    showMessage("Risco atualizado com sucesso", "success")
}

const deleteMethod = async (id: number) => {
    if (props.somenteLeitura) return

    await riscoService.delete(id)
    loadItems({ page: currentPage.value, itemsPerPage: pageSize.value })
    showDialogs.get(id)!.delete.value = false
}

const loadItems = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
    loading.value = true
    const res = await riscoService.getAllByProcesso(
        page,
        itemsPerPage,
        selectedProcesso.value!.id,
        riscoName.value
    )
    showDialogs.clear()
    res.content.forEach((item) => {
        showDialogs.set(item.id, { delete: ref(false), update: ref(false), view: ref(false) })
    })
    riscos.value = res.content
    loading.value = false
    pageSize.value = itemsPerPage
    currentPage.value = page
    listLength.value = res.totalElements
}

const setItem = (item: Risco) => {
    risco.value = {
        categoria: { id: item.categoria.id },
        causa: item.causa,
        consequencias: item.consequencias,
        faseProcesso: item.faseProcesso,
        nome: item.nome,
        tipoRisco: item.tipoRisco,
        tipoRiscoIntegridade: { id: item.tipoRiscoIntegridade?.id },
        processo: { id: item.processo.id },
    }
}

watch(riscoName, () => {
    if (typingTimeout.value) clearTimeout(typingTimeout.value)
    typingTimeout.value = setTimeout(async () => {
        await loadItems({ page: 1, itemsPerPage: pageSize.value })
    }, 400)
})
</script>
<template>
    <VCard class="col processTab">
        <div class="row" style="justify-content: space-between; align-items: center">
            <div class="col">
                <h3>Identificação de Riscos</h3>
                <h4 style="color: hsl(0, 0%, 30%)">
                    Identificação de riscos relacionados ao processo
                </h4>
            </div>
            <Dialog v-if="!somenteLeitura" v-model="showNewDialog">
                <template #activator="{ props }">
                    <VBtn v-bind="props" style="text-transform: none; padding: 5px 10px">
                        <div
                            class="row"
                            style="justify-content: space-between; align-items: center"
                        >
                            <IconPlus size="18"></IconPlus> Adicionar Risco
                        </div>
                    </VBtn>
                </template>
                <CreateRiscoForm
                    :icon="IconPencilPlus"
                    title="Criar Risco"
                    :save="post"
                    :close-dialog="
                        () => {
                            showNewDialog = false
                            loadItems({ page: currentPage, itemsPerPage: pageSize })
                        }
                    "
                ></CreateRiscoForm>
            </Dialog>
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
            class="risks-table"
            :headers="headers"
            :items-per-page="pageSize"
            :page="currentPage"
            :items="riscos"
            :loading="loading"
            :items-length="listLength"
            v-on:update:options="loadItems"
        >
            <template #[`item.nome`]="{ item }">
                <span class="risk-name">{{ item.nome }}</span>
            </template>

            <template #[`item.actions`]="{ item }">
                <div class="row risk-actions">
                    <Dialog v-model="showDialogs.get(item.id)!.view.value">
                        <template #activator="{ props }">
                            <VBtn color="white" class="risk-action-button" v-bind="props">
                                <IconEye size="18"></IconEye>
                            </VBtn>
                        </template>

                        <ViewRiscoDetails
                            v-if="showDialogs.get(item.id)!.view.value"
                            :risco="item"
                            :icon="IconEye"
                            title="Visualizar Risco"
                            :close-dialog="
                                () => {
                                    showDialogs.get(item.id)!.view.value = false
                                }
                            "
                        ></ViewRiscoDetails>
                    </Dialog>


                    <Dialog v-if="!somenteLeitura" v-model="showDialogs.get(item.id)!.update.value">
                        <template #activator="{ props }">
                            <VBtn
                                @click="
                                    () => {
                                        setItem(item)
                                        riscoId = item.id
                                    }
                                "
                                class="risk-action-button"
                                color="white"
                                v-bind="props"
                                ><IconEdit size="18"></IconEdit>
                            </VBtn>
                        </template>
                        <CreateRiscoForm
                            :icon="IconEdit"
                            title="Atualizar Risco"
                            :save="update"
                            :close-dialog="
                                () => {
                                    showDialogs.get(item.id)!.update.value = false
                                }
                            "
                        ></CreateRiscoForm>
                    </Dialog>

                    <DeleteDialog
                        v-if="!somenteLeitura"
                        class="risk-action-button"
                        color="white"
                        title="Excluir Risco"
                        icon-size="18"
                        message="Tem certeza de que deseja excluir esse risco?"
                        :confirm-delete="
                            () => {
                                deleteMethod(item.id)
                            }
                        "
                    ></DeleteDialog>
                </div>
            </template>
        </VDataTableServer>
    </VCard>
    <BackToTopButton></BackToTopButton>
</template>

<style>
.risk-name {
    font-weight: 600;
}

.risks-table .v-data-table-column--fixed-end {
    background-color: white;
}

.risks-table .actions-header {
    text-align: center;
}

.risk-actions {
    justify-content: center;
    flex-wrap: nowrap;
}

.risk-action-button {
    padding: 8px;
    border: var(--border);
}
</style>
