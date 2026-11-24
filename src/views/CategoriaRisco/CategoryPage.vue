<script setup lang="ts">
import { IconBuilding,  IconPlus, IconPencilPlus, IconTrash, IconArrowLeft } from "@tabler/icons-vue"
import { computed, onMounted } from "vue"
import { VBtn, VCard, VContainer, VTooltip, VDataTable } from "vuetify/components"
import CreateCategoryForm from "../../components/createForms/categoria/CreateCategoryForm.vue"
import DeleteDialog from "../../components/DeleteDialog.vue"
import Dialog from "../../components/Dialog.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"

import { 
    closeDialog,
    editingCategoria,
    isEditing,
    openEditCategoriaDialog,
    openNewCategory,
    showNewDialog,
    categorias,
    addCategoria,
    updateCategoria,
    deleteCategoria,
    fetchCategorias
} from "./categoria"
import type { DataTableHeader } from "vuetify"
import type { Categoria } from "./categoria"

onMounted(() => {
    fetchCategorias() 
})

const header = computed<DataTableHeader[]>(() => [
    { title: "Nome da Categoria", align: "start", key: "nome" },
    { title: "Ações", key: "actions",  align: "end", sortable: false }
])

const isNewDialogOpen = computed({
    get: () => showNewDialog.value,
    set: (value: boolean) => { showNewDialog.value = value },
})

const onCategoryCreated = async (data: { nome: string }) => {
    try {
        await addCategoria(data.nome)
        showMessage("Categoria criada com sucesso!", "success")
    } catch (error) {
        showMessage(error instanceof Error ? error.message : "Erro ao criar categoria.", "error")
        throw error
    }
}

const onCategoryUpdated = async (data: { nome: string }) => {
    if (editingCategoria.value && editingCategoria.value.id !== undefined) {
        try {
            await updateCategoria(editingCategoria.value.id, data.nome)
            showMessage("Categoria atualizada com sucesso!", "success")
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Erro ao atualizar categoria.", "error")
            throw error
        }
    }
}

const getCategoriaFromTableItem = (item: unknown): Categoria => {
    const maybeWrapped = item as { raw?: Categoria; item?: Categoria; value?: Categoria }
    return maybeWrapped.raw ?? maybeWrapped.item ?? maybeWrapped.value ?? (item as Categoria)
}

const onEditCategoria = (item: unknown) => {
    try {
        openEditCategoriaDialog(getCategoriaFromTableItem(item))
    } catch (error) {
        showMessage(error instanceof Error ? error.message : "Erro ao editar categoria.", "error")
    }
}

const onDeleteCategoria = async (item: unknown): Promise<boolean> => {
    const categoria = getCategoriaFromTableItem(item)

    if (categoria.id === undefined) {
        showMessage("Categoria inválida para exclusão.", "error")
        return false
    }

    try {
        await deleteCategoria(categoria)

        const categoriaRemovida = !categorias.value.some((c) => c.id === categoria.id)
        if (!categoriaRemovida) {
            showMessage("A categoria não foi removida. Atualize a página e tente novamente.", "error")
            return false
        }

        showMessage("Categoria excluída com sucesso!", "success")
        return true
    } catch (error) {
        showMessage(
            error instanceof Error ? error.message : "Erro ao excluir categoria.",
            "error"
        )
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
            :to="{ name: 'ProcessSettings' }"
        >
            <IconArrowLeft size="18" style="vertical-align: bottom; margin-right: 5px" />
            Voltar para Configurações
        </VBtn>

        <VCard class="col" style="padding: 20px; gap: 20px">
            <div class="row" style="justify-content: space-between; align-items: center">
                <h3 style="padding: 0; margin: 0">Categorias dos Riscos</h3>
                <VBtn @click="openNewCategory">
                    <IconPlus size="18" /> Nova Categoria
                </VBtn>
            </div>

            <div v-if="categorias.length > 0">
                <VCard>
                    <VDataTable
                        :headers="header"
                        :items="categorias"
                        class="plainTable"
                    >
                        <template #[`item.actions`]="{ item }">
                            <div class="row" style="gap: 10px; justify-content: flex-end;">
                                <VBtn
                                    class="actionButton"
                                    variant="outlined"
                                    color="black"
                                    @click.stop="onEditCategoria(item)"
                                    style="padding: 0 10px; min-width: 40px"
                                >
                                    <IconPencilPlus size="18" />
                                    <VTooltip activator="parent" location="top">Editar</VTooltip>
                                </VBtn>

                                <VBtn
                                  v-if="getCategoriaFromTableItem(item).persistente"
                                  class="actionButton"
                                  variant="outlined"
                                  color="black"
                                  style="padding: 0 10px; min-width: 40px"
                                  @click.stop = "showMessage('Esta categoria não pode ser excluída', 'error')"
                                >
                                    <IconTrash size="18" /> <VTooltip activator="parent" location="top">Excluir</VTooltip>
                                </VBtn>

                                <DeleteDialog
                                    v-else
                                    :confirm-delete="() => onDeleteCategoria(item)"
                                    title="Excluir Categoria"
                                    style="
                                        padding: 0 10px;
                                        min-width: 40px;
                                    "
                                    class="actionButton"
                                    variant="outlined"
                                    color="black"
                                    message="Deseja excluir esta categoria?"
                                    icon-size="18"
                                />
                            </div>
                        </template>
                    </VDataTable>
                </VCard>
            </div>

            <div v-else class="text-center" style="padding: 40px 20px">
                <IconBuilding size="64" color="#ccc" />
                <h3 style="color: #999; margin-top: 16px">Nenhuma categoria cadastrada.</h3>
            </div>
        </VCard>

        <Dialog v-model="isNewDialogOpen">
            <CreateCategoryForm
                :close-dialog="closeDialog"
                :create-category="onCategoryCreated"
                :editing-categoria="editingCategoria"
                :is-editing="isEditing"
                :update-category="onCategoryUpdated"
            />
        </Dialog>
    </VContainer>
</template>

<style scoped>
.col { display: flex; flex-direction: column; }
.row { display: flex; align-items: center;}
.text-center { text-align: center; }
.unidade-card {
    padding: 12px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding-right: 118px;
    flex: 1 1 clamp(280px, 30%, 30%);
    min-height: 68px;
    box-sizing: border-box;
}

.category-content {
    flex: 1;
    min-width: 0;
}

.category-name {
    margin: 0;
    font-weight: 600;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-actions {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: nowrap;
}

.unidade-subtitle { font-size: 11px; color: #9ca3af; margin-top: 4px; }

:deep(.actionButton) {
    font-size: 14px;
    text-transform: capitalize;
    padding: 8px !important;
    height: fit-content;
    border-color: hsl(0, 0%, 80%);
}
</style>
