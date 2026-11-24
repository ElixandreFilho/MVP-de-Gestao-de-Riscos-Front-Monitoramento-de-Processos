<script setup lang="ts">
import axios from "axios"
import {
    IconBuilding,
    IconPlus,
    IconPencilPlus,
    IconTrash,
    IconSchool,
    IconClipboardList, 
    IconX,
    IconChevronRight, 
    IconEraser,
} from "@tabler/icons-vue"
import { computed, onMounted, ref, type Ref } from "vue"
import { VBtn, VCard, VContainer, VDataTable, VChip } from "vuetify/components"
import type { DataTableHeader } from "vuetify"
import CreateUnitsForm from "../../components/createForms/unidade/CreateUnitsForm.vue"
import Dialog from "../../components/Dialog.vue"
import TabTransition from "../../components/tabTransition/TabTransition.vue"
import { showMessage } from "../../components/snackbar/SnackbarState"
import unidadeService from "../../services/unidadeService"
import type { UnidadeOrganizacional } from "../../types/unidadeOrganizacional"
import SectorPage from "./SectorPage.vue"
import { type UnidadePayload } from "../../components/createForms/unidade/CreateUnitsForm.vue"

const loading = ref(false)
const unidades = ref<UnidadeOrganizacional[]>([])
const unidadeSearchQuery = ref("")
const showNewDialog = ref(false)
const deleteId = ref<number | null>(null)
const itemsPerPage = ref(10)

const tab = ref(0)
const selectedUnidade = ref<UnidadeOrganizacional | null>(null)
const selectedSubunidade = ref<UnidadeOrganizacional | null>(null)
const selectedSubSetor = ref<UnidadeOrganizacional | null>(null)

const getUnitErrorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError(error)) {
        return fallback
    }

    if (error.response?.status === 409) {
        return "Já existe uma unidade com essas informações."
    }

    const data = error.response?.data

    return (
        data?.message ||
        data?.detail ||
        data?.error ||
        (typeof data === "string" ? data : null) ||
        fallback
    )
}

const breadcrumbs = computed(() => {
    const items = [
        { 
            title: "Unidades", 
            disabled: tab.value === 0, 
            href: "#", 
            onClick: () => navigateTo(0) 
        }
    ]

    if (tab.value >= 1 && selectedUnidade.value) {
        items.push({ 
            title: selectedUnidade.value.nome, 
            disabled: tab.value === 1, 
            href: "#", 
            onClick: () => navigateTo(1) 
        })
    }

    if (tab.value >= 2 && selectedSubunidade.value) {
        items.push({ 
            title: selectedSubunidade.value.nome, 
            disabled: tab.value === 2, 
            href: "#", 
            onClick: () => navigateTo(2)
        })
    }
    if(tab.value === 3 && selectedSubSetor.value) {
        items.push({
            title: selectedSubSetor.value.nome,
            disabled: true,
            href: "#",
            onClick: () => {}
        })

    }

    return items
})

const navigateTo = (targetTab: number) => {
    tab.value = targetTab
    if (targetTab <= 2) selectedSubSetor.value = null
    if (targetTab <= 1) selectedSubunidade.value = null
    if (targetTab === 0) selectedUnidade.value = null
}



const showDialogs = new Map<number, { delete: Ref<boolean>; update: Ref<boolean> }>()

const headers: DataTableHeader[] = [
    { title: "Nome da Unidade", value: "nome", align: "start", sortable: true, width: "30%"},
    { title: "Sigla", value: "sigla", align: "start", sortable: true, width: "20%" }, 
    { title: "Quantidade de Setores", value: "qtdSetores", align: "center", sortable: true, width: "20%" },
    { title: "Ações", value: "actions", align: "center", sortable: false, width: "1%", minWidth: "250px", fixed: "end" },
]

const fetchUnidades = async () => {
    loading.value = true
    try {
        const response = await unidadeService.getAll(0, 500)
        unidades.value = response.content || []
        showDialogs.clear()
        unidades.value.forEach((item) => {
            showDialogs.set(item.id, { delete: ref(false), update: ref(false) })
        })
    } catch {
        showMessage("Erro ao carregar unidades!", "error")
    } finally {
        loading.value = false
    }
}

const onUnitCreated = async (data: UnidadePayload) => {
    loading.value = true
    try {
        await unidadeService.post(data as unknown as UnidadeOrganizacional) 
        
        showNewDialog.value = false
        await fetchUnidades()
        showMessage("Unidade criada com sucesso!", "success")
    } catch (error: unknown) {
        console.error("Erro ao criar:", error)
        showMessage(getUnitErrorMessage(error, "Erro ao criar unidade."), "error")
    } finally {
        loading.value = false
    }
}

const showEditDialog = ref(false)
const editingItem = ref<UnidadeOrganizacional | null>(null)

const openEditDialog = (item: UnidadeOrganizacional) => {
    editingItem.value = item
    showEditDialog.value = true
}

const onUnitUpdated = async (data: UnidadePayload) => {
    if (!data.id) return
    loading.value = true
    try {
        await unidadeService.update(
            data as unknown as UnidadeOrganizacional,
            data.id as number
        )

        showEditDialog.value = false

        await fetchUnidades()

        showMessage(
            "Unidade atualizada com sucesso!",
            "success"
        )

    } catch (error: unknown) {
        console.error("Erro ao atualizar:", error)

        showMessage(getUnitErrorMessage(error, "Erro ao atualizar unidade."), "error")

    } finally {
        loading.value = false
    }
}
onMounted(() => {
    fetchUnidades()
})

// Normaliza formatos diferentes vindos da API para manter a filtragem por tipo estável,
// mesmo quando o backend envia `tipoUnidade`, `tipo_unidade` ou um objeto com `nome`.

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

const unidadesPrimeiroNivel = computed(() => {
    return unidades.value.filter((u) => {
        const seg = u as Record<string, unknown>
        return !(u.unidadeOrganizacionalPai || seg["unidade_pai_id"])
    }).sort((a, b) => a.nome.localeCompare(b.nome))
})

const normalizeSearchText = (text: string) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("pt-BR")
        .trim()

const unidadesFiltradasPorNome = computed(() => {
    const query = normalizeSearchText(unidadeSearchQuery.value)

    if (!query) return unidadesPrimeiroNivel.value

    return unidadesPrimeiroNivel.value.filter((unidade) =>
        normalizeSearchText(unidade.nome).includes(query)
    )
})

const hasActiveFilters = computed(() => unidadeSearchQuery.value.trim() !== "")

const clearFilters = () => {
    unidadeSearchQuery.value = ""
}

const unidadesAgrupadas = computed(() => {
    const raizes = unidadesFiltradasPorNome.value
    return {
        administrativas: raizes.filter((u) => normalizeUnitType(u).includes("administrativa")),
        academicas: raizes.filter((u) => normalizeUnitType(u).includes("academica")),
        outras: raizes.filter((u) => {
            const t = normalizeUnitType(u)
            return !t.includes("administrativa") && !t.includes("academica")
        }),
    }
})

const goToSubUnidades = (unidade: UnidadeOrganizacional) => {
    selectedUnidade.value = unidade
    tab.value = 1
}

const confirmDeleteUnidade = async (id: number) => {
    loading.value = true
    try {
        await unidadeService.delete(id)
        
        if (showDialogs.has(id)) {
            showDialogs.get(id)!.delete.value = false
        }
        
        deleteId.value = null

        await fetchUnidades()
        
        showMessage("Unidade e setores vinculados excluídos com sucesso!", "success")
    } catch (error) {
        console.error("Erro ao excluir:", error)
        showMessage("Erro ao excluir unidade. Verifique se existem vínculos impeditivos.", "error")
    } finally {
        loading.value = false
    }
}

</script>

<template>
    <VContainer class="col" style="gap: 25px" fluid>
        <div class="row" style="justify-content: space-between; align-items: center">
                <div style="flex: 1; min-width: 0; text-align: start">                
                    <VBreadcrumbs :items="breadcrumbs" class="pa-0" >
                    <template #divider>
                        <IconChevronRight size="16" color="grey" class="divider-icon"/>
                    </template>
                    <template #item="{ item, index }">
                        <span 
                            class="breadcrumb-item" 
                            :class="[item.disabled ? 'current-page' : 'parent-link',
                            index === 0 ? 'root-item' : '',
                            index === breadcrumbs.length - 2 && index > 0 ? 'shrink-first' : ''
                            ]"
                            @click.prevent="!item.disabled && (item as any).onClick()"
                        >
                            {{ item.title }}

                            <VTooltip
                                activator="parent" 
                                location="top" 
                                v-if="item.title.length > (item.disabled ? 50 : 18)"                            >
                            {{ item.title }}
                            </VTooltip>
                        </span>
                    </template>
                </VBreadcrumbs>
                <h4 v-if="tab === 0" style="color: hsl(0, 0%, 30%); padding: 0">
                    Gerencie as unidades principais e visualize a estrutura de setores
                </h4>
            </div>
            <Dialog v-model="showNewDialog" v-if="tab === 0">
                <template #activator="{ props }">
                    <VBtn v-bind="props" color="primary" style="text-transform: none">
                        <IconPlus size="18" /> Nova Unidade
                    </VBtn>
                </template>
                <CreateUnitsForm
                    v-if="showNewDialog" 
                    :is-sector="false"
                    :unidade-pai-id="null"
                    :close-dialog="() => (showNewDialog = false)"
                    @unit-created="onUnitCreated"
                />
            </Dialog>
        </div>

        <VCard v-if="tab === 0" class="row filter-card">
            <div class="filterField filter-name">
                Busca por nome
                <VTextField
                    v-model="unidadeSearchQuery"
                    density="compact"
                    prepend-inner-icon="Search"
                    hide-details
                    variant="solo"
                    bg-color="hsl(0,0%,95%)"
                    placeholder="Digite o nome da unidade"
                    class="filledField"
                ></VTextField>
            </div>
            <div v-if="hasActiveFilters" class="filterField filter-actions-row">
                <div class="actions-content">
                    <VBtn
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

        <TabTransition v-model="tab" :tab-slots="4">
            <template #0>
                <div v-if="unidades.length > 0" class="col" style="gap: 32px">
                    <div
                        v-if="unidadesAgrupadas.administrativas.length > 0"
                        class="col"
                        style="gap: 12px"
                    >
                        <div class="row" style="gap: 8px">
                            <IconBuilding size="22" color="rgb(var(--v-theme-primary))" />
                            <h4>Unidades Administrativas</h4>
                            <VChip size="x-small" color="primary">{{
                                unidadesAgrupadas.administrativas.length
                            }}</VChip>
                        </div>
                        <VCard>
                            <VDataTable
                                :headers="headers"
                                :items="unidadesAgrupadas.administrativas"
                                :items-per-page="itemsPerPage"
                                class="plainTable"
                                item-value="id"
                                must-sort
                            >
                            <template #[`item.nome`]="{ item }">
                                <div style="word-break: break-word; white-space: normal; line-height: 1.2; padding: 8px 0;">
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
                                {{ 
                                    unidades.filter(u => {
                                        const seg = u as Record<string, unknown>;
                                        const paiId = u.unidadeOrganizacionalPai?.id || seg["unidade_pai_id"];
                                        return Number(paiId) === item.id;
                                    }).length 
                                }}
                            </template>
                                <template #[`item.actions`]="{ item }">
                                    <div class="row" style="justify-content: center; gap: 10px; flex-wrap: nowrap">
                                        <VBtn
                                            class="actionButton"
                                            variant="outlined"
                                            color="black"
                                            @click="goToSubUnidades(item)"
                                        >
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
                                                    @click="deleteId = item.id"
                                                    style="padding: 0 10px; min-width: 40px"
                                                >
                                                    <IconTrash size="18" />
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
                                                        align-items: center;
                                                        gap: 20px;
                                                    "
                                                >
                                                    <VBtn
                                                        @click="showDialogs.get(item.id)!.delete.value = false"
                                                        color="hsl(0, 50%, 50%)"
                                                        style="padding: 5px"
                                                    >
                                                        <IconX size="25"></IconX>
                                                    </VBtn>
                                                    <h3>Excluir Unidade</h3>
                                                </div>
                                                <div class="row confirm-message-box">
                                                    <div class="side-bar"></div>
                                                    <span style="padding: 10px"
                                                        >Tem certeza que deseja excluir a unidade <b>{{ item.nome }}</b> e os setores vinculados a ela?</span
                                                    >
                                                </div>
                                                <div
                                                    class="row"
                                                    style="justify-content: end; gap: 10px"
                                                >
                                                    <VBtn
                                                        @click="
                                                            showDialogs.get(
                                                                item.id
                                                            )!.delete.value = false
                                                        "
                                                        variant="outlined"
                                                        >Cancelar</VBtn
                                                    >
                                                    <VBtn
                                                        color="hsl(0,50%,50%)"
                                                        @click="confirmDeleteUnidade(item.id)"
                                                        >Excluir</VBtn
                                                    >
                                                </div>
                                            </VCard>
                                        </Dialog>
                                    </div>
                                </template>
                            </VDataTable>
                        </VCard>
                    </div>

                    <div
                        v-if="unidadesAgrupadas.academicas.length > 0"
                        class="col"
                        style="gap: 12px"
                    >
                        <div class="row" style="gap: 8px">
                            <IconSchool size="22" color="green" />
                            <h4>Unidades Acadêmicas</h4>
                            <VChip size="x-small" color="green">{{
                                unidadesAgrupadas.academicas.length
                            }}</VChip>
                        </div>
                        <VCard>
                            <VDataTable
                                :headers="headers"
                                :items="unidadesAgrupadas.academicas"
                                :items-per-page="itemsPerPage"
                                class="plainTable"
                            >
                            <template #[`item.qtdSetores`]="{ item }">
                                {{ 
                                    unidades.filter(u => {
                                        const seg = u as Record<string, unknown>;
                                        const paiId = u.unidadeOrganizacionalPai?.id || seg["unidade_pai_id"];
                                        return Number(paiId) === item.id;
                                    }).length 
                                }}
                            </template>
                                <template #[`item.actions`]="{ item }">
                                    <div class="row" style="justify-content: center; gap: 10px; flex-wrap: nowrap">
                                        <VBtn
                                            class="actionButton"
                                            variant="outlined"
                                            color="black"
                                            @click="goToSubUnidades(item)"
                                        >
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
                                                    @click="deleteId = item.id"
                                                    style="padding: 0 10px; min-width: 40px"
                                                >
                                                    <IconTrash size="18" />
                                                </VBtn>
                                            </template>
                                            <VCard
                                                style="margin: auto; padding: 20px; gap: 20px"
                                                class="col"
                                            >
                                                <div class="row" style="justify-content: start; align-items: center; gap: 20px">
                                                    <VBtn
                                                        @click="showDialogs.get(item.id)!.delete.value = false"
                                                        color="hsl(0, 50%, 50%)"
                                                        style="padding: 5px"
                                                    >
                                                        <IconX size="25"></IconX>
                                                    </VBtn>
                                                    <h3>Excluir Unidade</h3>
                                                </div>
                                                <div class="row confirm-message-box">
                                                    <div class="side-bar"></div>
                                                    <span style="padding: 10px"
                                                        >Tem certeza que deseja excluir a unidade <b>{{ item.nome }}</b> e os setores vinculados a ela?
                                                    </span>
                                                </div>
                                                <div class="row" style="justify-content: end; gap: 10px">
                                                    <VBtn
                                                        @click="showDialogs.get(item.id)!.delete.value = false"
                                                        variant="outlined"
                                                    >Cancelar</VBtn>
                                                    <VBtn
                                                        color="hsl(0,50%,50%)"
                                                        @click="confirmDeleteUnidade(item.id)"
                                                    >Excluir</VBtn>
                                                </div>
                                            </VCard>
                                        </Dialog>
                                    </div>
                                </template>
                            </VDataTable>
                        </VCard>
                    </div>

                    <VCard
                        v-if="
                            hasActiveFilters &&
                            unidadesPrimeiroNivel.length > 0 &&
                            unidadesFiltradasPorNome.length === 0
                        "
                    >
                        <VDataTable
                            :headers="headers"
                            :items="[]"
                            :items-per-page="itemsPerPage"
                            class="plainTable"
                            item-value="id"
                            must-sort
                        />
                    </VCard>
                </div>
            </template>

            <template #1>
            <SectorPage
                v-if="selectedUnidade"
                :parent-item="selectedUnidade"
                :all-items="unidades"
                :level="1"
                @back="tab = 0"
                @refresh="fetchUnidades" 
                @item-selected="(sub) => { selectedSubunidade = sub; tab = 2; }"
            />
    </template>

    <template #2>
        <SectorPage
            v-if="selectedSubunidade"
            :parent-item="selectedSubunidade"
            :all-items="unidades"
            :level="2"
            @back="tab = 1"
            @refresh="fetchUnidades"
            @item-selected="(setor) => { selectedSubSetor = setor; tab = 3; }"
        />
    </template>

    <template #3>
        <SectorPage
            v-if="selectedSubSetor"
            :parent-item="selectedSubSetor"
            :all-items="unidades"
            :level="3"
            @back="tab = 2"
            @refresh="fetchUnidades"
        />
    </template>
        </TabTransition>
        <Dialog v-model="showEditDialog">
            <CreateUnitsForm
                v-if="editingItem"
                :is-editing="true"
                :editing-unidade="editingItem"
                :unidade-pai-id="null"
                :close-dialog="() => (showEditDialog = false)"
                @unit-updated="onUnitUpdated"
            />
        </Dialog>
    </VContainer>
</template>

<style scoped>
.root-item {
    flex: 0 0 auto !important; 
    margin-right: 4px;
}


.divider-icon {
    display: inline-flex;
    vertical-align: middle;
    margin-top: -2px;
}


.breadcrumb-item {
    /* Ativa as reticências (...) */
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
    
    transition: all 0.2s ease;
    min-width: 0px;
    flex: 0 1 auto;
}

.breadcrumb-item:not(.root-item) {
    max-width: 600px; 
}

.shrink-first {
    flex-shrink: 10 !important; 
}

.parent-link:not(.shrink-first):not(.root-item) {
    flex-shrink: 1; 
    max-width: 400px;
}


.current-page {
    flex: 1 1 auto; 
    color: #000000 !important;
    font-weight: 500;
    max-width: none !important;
    cursor: default;
}

.parent-link {
    flex: 0 1 auto; 
    color: #94a3b8 !important;
    font-weight: 400;
    cursor: pointer;
    max-width: 300px;
}


.parent-link:hover {
    color: #64748b !important;
    text-decoration: underline;
}

.col {
    display: flex;
    flex-direction: column;
}
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
    padding: 16px;
}
.filter-name {
    flex: 1;
    max-width: 400px;
}
.filter-actions-row {
    align-self: flex-end;
    flex: 0 0 auto;
}
.filter-actions-row .actions-content {
    display: flex;
    align-items: flex-end;
}
.row {
    display: flex;
    align-items: center;
}
.actionButton {
    font-size: 14px;
    text-transform: none;
    height: 36px !important;
    border-color: #ddd !important;
}
.plainTable {
    border-radius: 8px;
    overflow: hidden;
}
:deep(.v-breadcrumbs) {
    display: flex !important;
    flex-wrap: nowrap !important;
    padding: 0 !important;
    width: 100%;
}
</style>
