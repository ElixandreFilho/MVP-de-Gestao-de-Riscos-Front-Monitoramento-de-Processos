<script setup lang="ts">
withDefaults(
    defineProps<{
        processesCount?: number
        occurrencesCount?: number
        risksCount?: number
        selectedUnitId?: number | null
    }>(),
    {
        processesCount: 0,
        occurrencesCount: 0,
        risksCount: 0,
        selectedUnitId: null,
    }
)
</script>

<template>
      <div class="cardsRow">
        <VCard class="vcard infoCard">
            <div class="col infoCardContent">
                <div class="infoCardTitle">Total de Processos</div>
                <div class="infoCardNumber">{{ processesCount }}</div>
                <div class="infoCardSubtitle">
                  {{ selectedUnitId ? "Todos os processos da unidade selecionada" : "Todos os processos das suas unidades" }}
                </div>
            </div>
        </VCard>

        <VCard class="vcard infoCard">
            <div class="col infoCardContent">
                <div class="infoCardTitle">Riscos Identificados</div>
                <div class="infoCardNumber">{{ risksCount }}</div>
                <div class="infoCardSubtitle">Total de riscos</div>
            </div>
        </VCard>

        <VCard class="vcard infoCard">
            <div class="col infoCardContent">
                <div class="infoCardTitle">Ocorrências</div>
                <div class="infoCardNumber">{{ occurrencesCount }}</div>
                <div class="infoCardSubtitle">Ocorrências registradas</div>
            </div>
        </VCard>
    </div>
</template>

<style scoped>
  .cardsRow {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
  }
  .infoCard {
    flex: 1;
    padding: 16px;
    align-items: flex-start;
    display: flex;
  }

  .infoCardContent {
    gap: 6px;
    width: 100%;
  }

  .infoCardTitle {
    font-size: 12px;
    color: hsl(0, 0%, 40%);
  } 

  .infoCardNumber {
      font-size: 28px;
      font-weight: 700;
  }

  .infoCardSubtitle {
      font-size: 12px;
      color: hsl(0, 0%, 50%);
  }
</style>