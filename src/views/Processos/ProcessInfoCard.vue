<script setup lang="ts">
import { IconList } from "@tabler/icons-vue"
import type { Processo } from "../../types/processo"

const props = defineProps<{
    changeTab?: () => void
    processo?: Processo | null
    setor?: string
    unidade?: string
}>()
</script>

<template>
    <VCard
        variant="flat"
        style="
            background: white;
            border: 1px solid hsl(0, 0%, 80%);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        "
        rounded="lg"
    >
        <div class="row">
            <div class="col headerTitle">
                <h4 class="infoHeader">Processo</h4>
                <h3>{{ props.processo?.nome ?? "-" }}</h3>
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px">
            <div>
                <h4 class="infoHeader">Unidade</h4>
                <h3>{{ props.unidade ?? "-" }}</h3>
            </div>

            <div v-if="props.setor && props.setor !== '-'">
                <h4 class="infoHeader">Setor</h4>
                <h3>{{ props.setor }}</h3>
            </div>

            <div>
                <h4 class="infoHeader">Responsável</h4>
                <h3 style="text-transform: capitalize">
                    {{ props.processo?.responsavel?.nome ?? "-" }}
                </h3>
            </div>
        </div>
        <div class="row">
          <div class="headerTitle">
            <VBtn
              v-if="props.processo?.id"
              style="text-transform: none"
              :to="{ path: '/siglas', query: { processoId: props.processo?.id } }"
      >
              <IconList size="18" /> Lista de Siglas
            </VBtn>
          </div>
        </div>
    </VCard>
</template>

<style scoped>
.infoHeader {
    color: hsl(0, 0%, 30%);
}

.headerTitle {
    flex: 0.99;
}
</style>
