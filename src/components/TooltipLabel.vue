<script setup lang="ts">
defineProps<{
    label: string
    tooltip: string
}>()
</script>

<template>
    <span class="tooltipLabel">
        <span>{{ label }}</span>
        <VTooltip
            interactive
            content-class="tooltipLabelContent"
            :close-delay="120"
            :open-on-focus="false"
            location="right top"
            origin="left top"
           
        >
            <template #activator="{ props }">
                <span v-bind="props" class="tooltipIcon">?</span>
            </template>
            <div class="tooltipText">
                {{ tooltip }}
            </div>
        </VTooltip>
    </span>
</template>

<style scoped>
.tooltipLabel {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.tooltipIcon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    vertical-align: top;
    border-radius: 999px;
    background: rgb(var(--v-theme-primary));
    color: white;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
}

:deep(.tooltipLabelContent) {
    max-width: 250px;
    max-height: 250px;
    overflow: hidden;
    padding: 0;
    background: white;
    color: hsl(0, 0%, 20%);
    border: 1px solid hsl(0, 0%, 88%);
    box-shadow: 0 8px 20px hsla(0, 0%, 0%, 0.12);
}

.tooltipText {
    max-width: 250px;
    max-height: 250px;
    overflow-y: auto;
    padding: 10px 12px;
    white-space: normal;
    word-break: break-word;
    line-height: 1.4;
}
</style>
