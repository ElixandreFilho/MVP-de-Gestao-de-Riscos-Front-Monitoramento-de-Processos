<script setup lang="ts">
import { computed, ref } from "vue"
import Dialog from "./Dialog.vue"
import TreeViewField from "./TreeViewField.vue"
import { getUnidadeTree, unidadesTree, type TreeNode } from "../core/unidades"
import { IconFilter2, IconX } from "@tabler/icons-vue"
import { useUnidadeStore } from "../stores/unidadeStore"
import DatePicker from "./DatePicker.vue"

withDefaults(defineProps<{
  showForAdminOnly?: boolean
}>(), {
    showForAdminOnly: true,
})

const showFilterDialog = ref(false)

const unidadeId = ref<Partial<TreeNode> | null>(null)
  
const filters = ref({
    initialDate: "",
    finalDate: "",
    name: "",
    unit: unidadeId,
})

const appliedFilters = ref({
    unitId: null as number | null,
    initialDate: "",
    finalDate: "",
})

const hasAppliedFilters = computed(() => {
    return (
        appliedFilters.value.unitId !== null ||
      appliedFilters.value.initialDate !== "" ||
      appliedFilters.value.finalDate !== ""
    )
})

const unidadeStore = useUnidadeStore()
const isAdmin = computed(() => unidadeStore.isAdmin)
const unidades = computed<TreeNode[]>(() => {
    if (isAdmin.value) {
        return unidadesTree.value ?? []
    }
    const tree = getUnidadeTree(unidadeStore.unidade?.id)
    return tree ? [tree] : []
})

const validateFinalDate = (value: string) => {
    const initial = filters.value.initialDate
    const final = value

    if (!final) {
        return true
    }

    if (initial && final < initial) {
        return "Data final não pode ser anterior à data inicial."
    }

    return true
}

const emit = defineEmits <{
  (e: "apply", payload: {
    name: string
    initialDate: string
    finalDate: string
    unitId: number | null
  }): void
  (e: "clear"): void
}>()

const applyFilters = () => {
    appliedFilters.value = {
        unitId: filters.value.unit?.id ?? null,
        initialDate: filters.value.initialDate,
        finalDate: filters.value.finalDate,
    }

    emit("apply", {
        name: filters.value.name,
        initialDate: filters.value.initialDate,
        finalDate: filters.value.finalDate,
        unitId: filters.value.unit?.id ?? null,
    })
    showFilterDialog.value = false
}

const clearFilters = () => {
    unidadeId.value = null
    filters.value.name = ""
    filters.value.initialDate = ""
    filters.value.finalDate = ""
    appliedFilters.value = {
        unitId: null,
        initialDate: "",
        finalDate: "",
    }
    emit("clear")
    showFilterDialog.value = false
}



</script>

<template>
  <div v-if="!showForAdminOnly || isAdmin" class="row-button">
    <Dialog v-model="showFilterDialog" max-width="500px">
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          style="text-transform: none"
          :variant="hasAppliedFilters ? 'flat' : 'outlined'"
          :color="hasAppliedFilters ? 'primary' : undefined"
        >
          <IconFilter2 />
          Filtros
        </VBtn>
      </template>

      <VCard class="filters-card-container">
        <div class="filter-header">
          <VCardTitle>Filtros</VCardTitle>
          <v-btn
            variant="text"
            color="grey-darken-1"
            @click="clearFilters"
          ><IconX stroke={1} /></v-btn>
        </div>
        <VCardText style="padding: 5px 16px">
          <h3 class="font-title">Filtrar por unidade</h3>
          <TreeViewField
              v-model="unidadeId"
              placeholder="Selecione uma unidade"
              bg-color="hsl(0,0%,95%)"
              color="none"
              border="none"
              :hide-details="true"
              :items="unidades"
              :style="{ width: '100%' }"
              :max-chars="30"
          >
          </TreeViewField>
          <div style="display: flex; flex-direction: row; gap: 10px;">
            <div class="filterField filter-date">
              <h3 class="font-title">Data inicial</h3>
              <DatePicker
                  v-model="filters.initialDate"
              >
              </DatePicker>
            </div>
            <div class="filterField filter-date">
              <h3 class="font-title">Data final</h3>
              <DatePicker
                v-model="filters.finalDate"
                :rules="[validateFinalDate as (value: string | null | undefined) => string | boolean]"
              >
              </DatePicker>
            </div>
          </div>
        </VCardText>
        <VCardActions>
            <VBtn
              style="text-transform: none"
              variant="outlined"
              @click="clearFilters"
            >
              Remover filtros
            </VBtn>
            <VSpacer />
            <VBtn 
              style="text-transform: none"
              variant="flat"
              color="primary"
              @click="applyFilters"
            >
              Aplicar filtros
            </VBtn>
        </VCardActions>
      </VCard>
    </Dialog>
  </div>

</template>

<style scoped>
.row-button {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.font-title {
  font-size: 15px;
}

.filterField {
    display: flex;
    justify-content: flex-start;
    gap: 6px;
    font-size: 14px;
    text-align: start;
    min-width: 0;
}

.filter-date{
    max-width: 300px; 
    display: flex;
    flex-direction: column;
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filters-card-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>