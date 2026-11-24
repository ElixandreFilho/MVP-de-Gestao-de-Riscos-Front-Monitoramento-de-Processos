<script setup lang="ts">
import { IconTrash, IconX } from "@tabler/icons-vue"
import { ref, type StyleValue } from "vue"
import Dialog from "./Dialog.vue"

const showDeleteDialog = ref(false)

const props = defineProps<{
    confirmDelete: () => boolean | void | Promise<boolean | void>
    title: string
    message: string
    variant?: "text" | "flat" | "elevated" | "outlined" | "plain" | "tonal"
    color?: string
    class?: string
    style?: StyleValue
    iconSize?: string
}>()
const className = props.class

const onConfirmDelete = async () => {
    const shouldCloseDialog = await props.confirmDelete()

    if (shouldCloseDialog !== false) {
        showDeleteDialog.value = false
    }
}

</script>
<template>
    <Dialog max-width="350px" v-model="showDeleteDialog">
        <template #activator="{ props }">
            <VBtn v-bind="props" :style="style" :class="className" :variant="variant" :color="color"
                ><IconTrash :size="iconSize"></IconTrash>
                <VTooltip activator="parent" location="top">Excluir</VTooltip>
            </VBtn>
        </template>
        <VCard style="margin: auto; padding: 20px; gap: 20px" class="col">
            <div
                class="row"
                style="justify-content: start; margin-bottom: 0px; align-items: center; gap: 20px"
            >
                <VBtn
                    @click="
                        () => {
                            showDeleteDialog = false
                        }
                    "
                    color="hsl(0, 50%, 50%)"
                    style="padding: 5px"
                >
                    <IconX size="25"></IconX>
                </VBtn>
                <h3>{{ title }}</h3>
            </div>
            <div
                class="row"
                style="
                    margin: 0px 0px;
                    border-radius: 10px;
                    background: hsl(0, 0%, 95%);
                    gap: 0;
                    flex-wrap: nowrap;
                    overflow: hidden;
                "
            >
                <div style="background-color: hsl(0, 0%, 80%); width: 10px"></div>
                <span style="padding: 10px">{{ message }}</span>
            </div>

            <div class="row" style="justify-content: end; gap: 10px">
                <VBtn
                    @click="
                        () => {
                            showDeleteDialog = false
                        }
                    "
                    variant="outlined"
                    >Cancelar</VBtn
                >
                <VBtn @click="onConfirmDelete" color="hsl(0,50%,50%)">Excluir</VBtn>
            </div>
        </VCard>
    </Dialog>
</template>
