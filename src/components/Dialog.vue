<script setup lang="ts">
import type { StyleValue } from "vue"
import { useLayout } from "vuetify"

const { mainRect } = useLayout()

const showDialog = defineModel<boolean>()

withDefaults(defineProps<{ width?: string; maxWidth?: string; style?: StyleValue }>(), {
    width: "100%",
    maxWidth: "700px",
})
</script>

<template>
    <VDialog
        :width="width"
        :max-width="maxWidth"
        style="margin: 10px"
        :style="{
            marginLeft: `calc(10px + ${mainRect.left}px)`,
        }"
        v-model="showDialog"
        transition="slide-y-transition"
    >
        <template #activator="{ props }">
            <slot name="activator" :props="props"></slot>
        </template>
        <slot></slot>
    </VDialog>
</template>
