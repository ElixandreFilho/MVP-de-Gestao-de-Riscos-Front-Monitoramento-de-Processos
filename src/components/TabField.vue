<script setup lang="ts">
defineProps<{ label: string }>()
</script>
<template>
    <div class="spacedColumn">
        <div class="tabFieldLabel">
            {{ label }}
        </div>
        <div class="wrapText">
            <slot></slot>
        </div>
    </div>
</template>

<style>
.tabFieldLabel {
    font-size: 12px;
    color: hsl(0, 0%, 30%);
    gap: 4px;
}

.spacedColumn {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

</style>
