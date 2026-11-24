<script setup lang="ts">
import { IconX } from "@tabler/icons-vue"
import { defaultTimeout, messages } from "./SnackbarState"

defineProps<{ timeout?: number }>()
</script>

<template>
    <VSnackbarQueue
        class="snackbarContainer"
        :timeout="timeout ?? defaultTimeout"
        v-model="messages"
        location="right top"
        :closable="true"
    >
        <template #actions="{ props }">
            <IconX :onclick="props.onClick" style="cursor: pointer"> </IconX>
        </template>
    </VSnackbarQueue>
</template>

<style>
.snackbarContainer > * {
    margin: 10px;
    padding: 10px !important;
    max-width: 200px !important;
}
</style>
