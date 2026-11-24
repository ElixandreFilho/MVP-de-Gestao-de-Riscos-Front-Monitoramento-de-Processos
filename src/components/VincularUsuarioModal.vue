<template>
    <VDialog class="max-height" v-model="modalVisible" max-width="75vw" scrollable>
        <v-card class="max-height">
            <v-card-title>
                <IconCirclesRelation id="IconCirclesRelation" />
                <span class="headline">Vincular Novo Usuário</span>
            </v-card-title>
            <v-card-text>
                <UsersTable
                    :funcao="'usuariosDesvinculados'"
                    :titulo="'Selecione os usuários para vincular'"
                    :descricao="'Você pode selecionar mais de um usuário para vincular a sua unidade'"
                    v-model:open-dialog="actionDialog"
                    v-model:reset="reset"
                />
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" @click="closeDialog">Cancelar</v-btn>
                <v-btn
                    :disabled="!hasPendingChanges"
                    color="primary"
                    variant="flat"
                    @click="triggerConfirm"
                    >Salvar</v-btn
                >
            </v-card-actions>
        </v-card>
    </VDialog>
</template>

<script setup lang="ts">
import { useUserPageStore } from "../stores/userPageStore"
import { storeToRefs } from "pinia"
import { IconCirclesRelation } from "@tabler/icons-vue"
import VDialog from "./Dialog.vue"

import UsersTable from "./UsersTable.vue"
import { ref} from "vue"

const userPageStore = useUserPageStore()
const { modalVisible, hasPendingChanges } = storeToRefs(userPageStore)

const actionDialog = ref(false)
const reset = ref(false)

function triggerConfirm() {
    actionDialog.value = true
}

function closeDialog() {
    reset.value = true
    userPageStore.setHasPendingChanges(false)
    modalVisible.value = false
}

</script>

<style scoped>
.v-card-title {
    display: flex;
    align-items: center;
}

#IconCirclesRelation {
    background: rgb(var(--v-theme-primary));
    padding: 0.5vw;
    margin: 1vh;
    border-radius: 8px;
    color: white;
    box-sizing: content-box;
}

.max-height {
    max-height: 80vh;
}
</style>
