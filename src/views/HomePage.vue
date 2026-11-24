<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useUnidadeStore } from "../stores/unidadeStore"
import HomeSecGovPage from "./HomeSecGovPage.vue"
import HomeUnitPage from "./HomeUnitPage.vue"
import NoRolePage from "./NoRolePage.vue"
import { userInfo } from "../services/keycloakService"

const unidadeStore = useUnidadeStore()

const homeComponent = computed(() => {
    if (!userInfo.value.papel) return NoRolePage
    return unidadeStore.isAdmin ? HomeSecGovPage : HomeUnitPage
})

onMounted(async () => {
    if (!unidadeStore.loaded) {
        await unidadeStore.loadUnidade()
    }
})
</script>

<template>
    <component :is="homeComponent" />
</template>
