<script setup lang="ts">
import {
    IconArrowLeft, IconBuilding, IconClipboardList, IconLayoutGrid,
    IconPencilPlus, IconPlus, IconSchool,
    IconTrash
} from "@tabler/icons-vue"
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue"
import { VBtn, VCard, VChip, VDataTable } from "vuetify/components"
import type { DataTableHeader } from "vuetify"

import Dialog from "../../components/Dialog.vue"
import type { UnidadeOrganizacional } from "../../types/unidadeOrganizacional"

import {
    isEditing,
    showNewDialog} from "./organizacao"
import CreateUnitsForm, { type UnidadePayload } from "../../components/createForms/unidade/CreateUnitsForm.vue"
import unidadeService from "../../services/unidadeService"
import { showMessage } from "../../components/snackbar/SnackbarState"

const props = defineProps<{
    parentItem: UnidadeOrganizacional | null 
    allItems: UnidadeOrganizacional[]       
    level: 1 | 2 | 3                         
}>()

const emit = defineEmits<{
    back: []
    "item-selected": [item: UnidadeOrganizacional] 
    "refresh":[]
}>()

const editingItem = ref<UnidadeOrganizacional | null>(null)
const deleteId = ref<number | null>(null)

const titleRef = ref<HTMLElement | null>(null)
const isTruncated = ref(false)

const checkTruncation = () => {
    if (titleRef.value) {
        // Se a largura real for maior que a visível, houve truncamento
        isTruncated.value = titleRef.value.scrollWidth > titleRef.value.clientWidth
    }
}

onMounted(() => {
    checkTruncation()
    window.addEventListener("resize", checkTruncation)
})

onUnmounted(() => {
    window.removeEventListener("resize", checkTruncation)
})


const onSectorCreated = async (data: UnidadePayload) => {
    try {
        // Envia para o back-end (como o componente pai faz)
        await unidadeService.post(data as unknown as UnidadeOrganizacional) 
        
        showNewDialog.value = false
        emit("refresh") 
        showMessage("Setor criado com sucesso!", "success")
    } catch (error) {
        console.error("Erro ao criar setor:", error)
        showMessage("Erro ao criar setor.", "error")
    }
}

const onSectorUpdate = async (data: UnidadePayload) => {
    if (!data.id) return
    try {
        await unidadeService.update(data as unknown as UnidadeOrganizacional, data.id as number)
        showNewDialog.value = false
        emit("refresh")
        showMessage("Setor atualizado!", "success")
    } catch {
        showMessage("Erro ao atualizar setor.", "error")
    }
}

const confirmDeleteSector = async (id: number) => {
    try {
        await unidadeService.delete(id)
        
        if (showDialogs.has(id)) {
            showDialogs.get(id)!.delete.value = false
        }
        
        emit("refresh")
        
        showMessage("Setor e todos os seus sub-setores vinculados foram removidos!", "success")
    } catch (error) {
        console.error("Erro ao excluir setor:", error)
        showMessage("Não foi possível excluir o setor. Verifique se existem vínculos externos.", "error")
    }
}


const showDialogs = new Map<number, { delete: Ref<boolean> }>()

const headers: DataTableHeader[] = [
    { title: "Nome do Setor", value: "nome", align: "start", sortable: true, width: "30%" },
    { title: "Sigla", value: "sigla", align: "start", sortable: true, width: "20%" }, 
    { title: "Quantidade de Setores", value: "qtdSetores", align: "center", sortable: true, width: "20%" },
    { title: "Ações", value: "actions", align: "end", sortable: false, width: "30%" },
]

const openCreateDialog = () => {
    isEditing.value = false
    editingItem.value = null
    showNewDialog.value = true
}

const openEditDialog = (item: UnidadeOrganizacional) => {
    isEditing.value = true
    editingItem.value = item
    showNewDialog.value = true
}

const normalizeUnitType = (unidade: UnidadeOrganizacional): string => {
    const seg = unidade as Record<string, unknown>
    
    // Tenta pegar de 'tipoUnidade' (TS) ou 'tipo_unidade' (JSON/API)
    const tipo = unidade.tipoUnidade || seg["tipo_unidade"]
    
    if (!tipo) return "sem_categoria"

    let tipoStr = ""
    if (typeof tipo === "object" && tipo !== null) {
        const tipoObj = tipo as Record<string, unknown>
        tipoStr = String(tipoObj.nome || tipoObj.valor || "")
    } else {
        tipoStr = String(tipo)
    }

    // Compara os Enums ou as Strings puras
    if (tipoStr.includes("ADMINISTRATIVA")) return "administrativa"
    if (tipoStr.includes("ACADEMICA")) return "academica"
    
    return tipoStr
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
}

// Filtra quem são os filhos do item atual
const childrenItems = computed(() => {
    if (!props.parentItem || !props.allItems) return []
    return props.allItems.filter((s) => {
        const seg = s as Record<string, unknown>
        const paiId = s.unidadeOrganizacionalPai?.id || seg["unidade_pai_id"]
        return Number(paiId) === Number(props.parentItem?.id)
    }).sort((a, b) => a.nome.localeCompare(b.nome))
})

const groupedChildren = computed(() => {
    const list = childrenItems.value
    list.forEach(item => {
        if (!showDialogs.has(item.id)) showDialogs.set(item.id, { delete: ref(false) })
    })

    return {
        administrativas: list.filter((u) => normalizeUnitType(u).includes("administrativa")),
        academicas: list.filter((u) => normalizeUnitType(u).includes("academica")),
        outras: list.filter((u) => {
            const t = normalizeUnitType(u)
            return !t.includes("administrativa") && !t.includes("academica")
        }),
    }
})
</script>

<template>
    <div class="col" style="gap: 24px">
        <div class="row" style="justify-content: space-between; align-items: center">
            <div class="row" style="gap: 8px; align-items: center; flex: 1; min-width: 0">
                <VBtn 
                    variant="text" 
                    color="black"
                    @click="emit('back')" 
                    class="text-none px-2"
                    style="place-self: start; height: 36px; min-width: 0; width: auto; justify-content: start;"
                >
                    <div class="row" style="gap: 5px; align-items: center; max-width: 100%; min-width: 0;">
                        <IconArrowLeft size="20" style="flex-shrink: 0;" />

                        <h3 
                            ref="titleRef"
                            class="title-truncate" 
                            style="margin: 0">
                            {{ parentItem?.nome }}
                        </h3>
                    </div>
                </VBtn>
                
            </div>
            
            <VBtn color="primary" style="text-transform: none" 
                @click="openCreateDialog">
                <IconPlus size="18" /> Novo Setor
            </VBtn>
        </div>

        <div v-if="childrenItems.length > 0" class="col" style="gap: 32px">
            <div v-for="(lista, tipo) in groupedChildren" :key="tipo">
                <div v-if="lista.length > 0" class="col" style="gap: 12px">
                    <div class="row" style="gap: 8px">
                        <component 
                            :is="tipo === 'administrativas' ? IconBuilding : (tipo === 'academicas' ? IconSchool : IconLayoutGrid)" 
                            size="22" 
                            :color="tipo === 'academicas' 
                                ? 'green' 
                                : (tipo === 'administrativas' ? 'rgb(var(--v-theme-primary))' : 'grey')"
                        />
                        
                        <h4 style="margin: 0">
                            {{ tipo === 'administrativas' ? 'Unidades Administrativas' : 
                            tipo === 'academicas' ? 'Unidades Acadêmicas' : 'Outras Unidades' }}
                        </h4>
                        
                        <VChip size="x-small" variant="tonal">{{ lista.length }}</VChip>
                    </div>

                    <VCard border shadow="none">
                        <VDataTable 
                            :headers="headers" 
                            :items="lista" 
                            class="plainTable"
                            item-value="id"
                            must-sort
                        >
                        <template #[`item.nome`]="{ item }">
                            <div style="word-break: break-all; white-space: normal; line-height: 1.4; padding: 10px 0;">
                                {{ item.nome }}
                            </div>
                        </template>


                        <template #[`item.sigla`]="{ item }">
                            <div class="sigla-container">
                                <span class="sigla-text">
                                    {{ item.sigla?.length > 12 ? item.sigla.substring(0, 12) + '...' : item.sigla }}
                                </span>

                                <VTooltip
                                    v-if="item.sigla?.length > 12"
                                    activator="parent"
                                    location="top"
                                >
                                    {{ item.sigla }}
                                </VTooltip>
                            </div>
                        </template>
                            <template #[`item.qtdSetores`]="{ item }">
                                {{ allItems.filter(u => (u.unidadeOrganizacionalPai?.id || (u as any).unidade_pai_id) === item.id).length }}
                            </template>

                            <template #[`item.actions`]="{ item }">
                                <div class="row" style="justify-content: end; gap: 10px">
                                    <VBtn v-if="level < 3" class="actionButton" variant="outlined" color="black" @click="emit('item-selected', item)">
                                        <IconClipboardList size="18" class="mr-1" /> Setores
                                    </VBtn>

                                    <VBtn 
                                        class="actionButton" 
                                        variant="outlined" 
                                        color="black" 
                                        icon 
                                        size="small" 
                                        @click="openEditDialog(item)"
                                    >
                                        <IconPencilPlus size="18" />
                                    </VBtn>

                                    <Dialog max-width="350px" v-model="showDialogs.get(item.id)!.delete.value">
                                        <template #activator="{ props: dProps }">
                                            <VBtn 
                                                v-bind="dProps" 
                                                class="actionButton" 
                                                variant="outlined" 
                                                color="black" 
                                                @click="deleteId = item.id"
                                                style="padding: 0 10px; min-width: 40px"
                                            >
                                                <IconTrash size="18" />
                                            </VBtn>
                                        </template>
                                        
                                        <VCard style="margin: auto; padding: 20px; gap: 20px" class="col">
                                            <div class="row" style="justify-content: start; align-items: center; gap: 20px">
                                                <VBtn @click="showDialogs.get(item.id)!.delete.value = false" color="hsl(0, 50%, 50%)" style="padding: 5px">
                                                    <IconX size="25" />
                                                </VBtn>
                                                <h3 style="margin: 0">Excluir Item</h3>
                                            </div>
                                            <div class="row confirm-message-box">
                                                <div class="side-bar"></div>
                                                <span style="padding: 10px">Tem certeza que deseja excluir o setor <b>{{ item.nome }}</b> e todos os seus setores?</span>
                                            </div>
                                            <div class="row" style="justify-content: end; gap: 10px">
                                                <VBtn 
                                                    @click="showDialogs.get(item.id)!.delete.value = false" 
                                                    variant="outlined"
                                                    >
                                                    Cancelar
                                                </VBtn>
                                                <VBtn 
                                                    color="hsl(0,50%,50%)" 
                                                    @click="confirmDeleteSector(item.id)"
                                                    >
                                                    Excluir
                                                </VBtn>
                                            </div>
                                        </VCard>
                                    </Dialog>
                                </div>
                            </template>
                        </VDataTable>
                    </VCard>
                </div>
            </div>
        </div>

        <VCard v-else class="empty-state-card">
            <IconLayoutGrid size="50" color="#ccc" style="margin-bottom: 16px" />
            <h3 style="margin: 0">Nenhum setor encontrado</h3>
            <p style="margin: 8px 0 0; color: #6b7280">
                Não existem setores vinculados a <b>{{ parentItem?.nome }}</b>.
            </p>
        </VCard>

        <Dialog v-model="showNewDialog">
            <CreateUnitsForm
                v-if="showNewDialog"
                :is-editing="isEditing"
                :is-sector="true"
                :editing-unidade="editingItem"
                :unidade-pai-id="parentItem?.id"
                :close-dialog="() => showNewDialog = false"
                @unit-created = "onSectorCreated"
                @unit-updated="onSectorUpdate"
            />
        </Dialog>
    </div>
</template>

<style scoped>
.back-pill-btn {
    background-color: transparent !important;
    transition: background-color 0.2s ease;
}

.back-pill-btn:hover {
    background-color: rgba(0, 0, 0, 0.04) !important;
}


:deep(.v-btn__content) {
    width: 100%;
    min-width: 0;
    display: flex !important;
    justify-content: flex-start;
}
.title-truncate {
    margin: 0;
    white-space: nowrap;      
    overflow: hidden;        
    text-overflow: ellipsis; 
    flex: 1;                  
    min-width: 0;           
    display: block;
    width: 100%;  
    pointer-events: auto;
}
.col { display: flex; flex-direction: column; }
.row { display: flex; align-items: center; }
.actionButton { font-size: 14px; height: 36px !important; border-color: #ddd !important; }
.plainTable { border-radius: 8px; overflow: hidden; }
.empty-state-card {
    padding: 35px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 1px solid #e5e7eb; border-radius: 12px; background: white;
}
</style>