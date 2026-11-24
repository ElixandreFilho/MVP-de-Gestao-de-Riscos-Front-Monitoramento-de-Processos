<script setup lang="ts">
import { IconArrowLeft, IconCategory, IconChevronRight } from "@tabler/icons-vue"

const settings = [
    {
        title: "Categorias dos Riscos",
        description:
            "Gerencie as opções de origem dos fatores que influenciam o evento de risco.",
        icon: IconCategory,
        to: { name: "Categorias" },
    },
]
</script>

<template>
    <VContainer class="col settingsPage" fluid>
        <div>
            <VBtn
                variant="text"
                color="black"
                style="text-transform: none"
                :to="{ name: 'Processes' }"
            >
                <IconArrowLeft
                    size="18"
                    style="vertical-align: bottom; margin-right: 5px"
                />
                Voltar para Lista de Processos
            </VBtn>
        </div>

        <div>
            <h2 class="pageTitle">Configurações de Processos</h2>
            <h4 class="pageSubtitle">
                Selecione uma opção para gerenciar as configurações dos processos
            </h4>
        </div>

        <div class="cardsRow">
            <VCard
                v-for="setting in settings"
                :key="setting.title"
                class="settingsCard"
                :to="setting.to"
            >
                <VAvatar size="64" color="rgb(222, 234, 248)" class="text-primary">
                    <component :is="setting.icon" :size="32" />
                </VAvatar>

                <div class="col settingsCardContent">
                    <h3 class="settingsCardTitle text-high-emphasis font-weight-medium">
                        {{ setting.title }}
                    </h3>
                    <p class="settingsCardDescription">{{ setting.description }}</p>
                </div>

                <IconChevronRight class="navigationIcon" :size="24" />
            </VCard>
        </div>
    </VContainer>
</template>

<style scoped>
.settingsPage {
    gap: 20px;
    container-type: inline-size;
}

.pageTitle {
    padding: 0;
}

.pageSubtitle {
    color: hsl(0, 0%, 30%);
}

.cardsRow {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.settingsCard {
    min-height: 124px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    border: var(--border);
    border-radius: 10px !important;
    color: inherit;
    cursor: pointer;
    transition:
        border-color 0.2s,
        box-shadow 0.2s;
}

.settingsCard:hover {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 2px 8px hsl(0, 0%, 0%, 10%) !important;
}

.settingsCard:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
}

.settingsCardContent {
    min-width: 0;
    gap: 6px;
}

.settingsCardTitle {
    margin: 0;
    font-size: 17px;
    line-height: 1.25;
}

.settingsCardDescription {
    margin: 0;
    padding: 0;
    color: hsl(0, 0%, 40%);
    font-size: 14px;
    overflow-wrap: anywhere;
}

.navigationIcon {
    flex-shrink: 0;
    color: hsl(0, 0%, 40%);
    transition:
        transform 0.2s,
        color 0.2s;
}

.settingsCard:hover .navigationIcon,
.settingsCard:focus-visible .navigationIcon {
    transform: translateX(4px);
    color: rgb(var(--v-theme-primary));
}

@container (max-width: 900px) {
    .cardsRow {
        grid-template-columns: repeat(2, 1fr);
    }
}

@container (max-width: 600px) {
    .cardsRow {
        grid-template-columns: 1fr;
    }

    .settingsCard {
        flex-wrap: wrap;
        row-gap: 12px;
    }

    .settingsCardContent {
        display: contents;
    }

    .settingsCardTitle {
        flex: 1;
        min-width: 0;
    }

    .settingsCardDescription {
        order: 1;
        flex-basis: 100%;
    }
}
</style>
