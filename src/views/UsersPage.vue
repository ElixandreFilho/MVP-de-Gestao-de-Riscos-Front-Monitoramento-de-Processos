<template>
    <v-container>
        <v-row>
            <v-col>
                <h3>Gerenciamento de Usuários</h3>
                <h5>Gerencie usuários do sistema e vincule-os às unidades organizacionais</h5>
            </v-col>
            <v-col id="container_botao_novo_usuario">
                <v-btn
                    prepend-icon="UserPlus"
                    variant="elevated"
                    @click="userPageStore.setModalVisible(!modalVisible)"
                >
                    Vincular usuário
                </v-btn>
                <NovoUsuarioModal />
            </v-col>
        </v-row>
        <v-row class="cardsRow" no-gutters>
            <v-col cols="12" sm="3" class="cols-cardInfo" v-for="(card, i) in cards" :key="i">
                <CardInfo
                    :key="i"
                    :titulo="card.titulo"
                    :valor="card.valor"
                    :icon_name="card.icon"
                    :icon_color="card.iconColor"
                />
            </v-col>
        </v-row>
        <div>
            <UsersTable
                :key="usersTableKey"
                :funcao="'usuariosDaUnidade'"
                :titulo="'Usuários do sistema'"
                :descricao="'Lista de todos usuários vinculados a sua unidade organizacional'"
            />
        </div>
    </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch, type ComputedRef } from "vue"
import CardInfo from "../components/CardInfo.vue"
import UsersTable from "../components/UsersTable.vue"
import userService from "../services/userService"
import { useUserPageStore } from "../stores/userPageStore"
import { storeToRefs } from "pinia"

import NovoUsuarioModal from "../components/VincularUsuarioModal.vue"
import { useUnidadeStore } from "../stores/unidadeStore"

const usersTableKey = ref(0)
const usersQuantityOfUnity = ref(0)
const userPageStore = useUserPageStore()
const { modalVisible, needsReload } = storeToRefs(userPageStore)
const unidadeStore = useUnidadeStore()
const { unidade } = storeToRefs(unidadeStore)

watch(needsReload, (newVal) => {
    if (newVal) {
        totalUsarios()
        usersTableKey.value++
        userPageStore.acionarReload(false)
    }
})

watch(
    unidade,
    (novaUnidade) => {
        if (novaUnidade?.id) {
            totalUsarios()
        }
    },
    { immediate: true }
)

interface Card {
    titulo: string
    valor: ComputedRef<number>
    icon: string
    iconColor: string
}

const cards: Card[] = [
    {
        titulo: "Total de Usuários",
        valor: computed(() => usersQuantityOfUnity.value),
        icon: "Users",
        iconColor: "gray",
    },
]

async function totalUsarios() {
    try {
        if (unidade.value) {
            const userQuantity = await userService.findResponsaveis(unidade.value?.id)
            usersQuantityOfUnity.value = userQuantity.length
        }
    } catch (error) {
        console.error("Erro ao carregar o total de usuários. Err: " + error)
    }
}
</script>

<style scoped>
#cards_container {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: start;
    gap: 1vw;
    overflow: auto;
    margin: 1vw 0;
}

#container_botao_novo_usuario {
    display: flex;
    justify-content: end;
    align-items: center;
}

.cardsRow {
    margin: 2vh 0;
    justify-content: flex-start;
}

.cols-cardInfo{
    padding: 0;
}

</style>
