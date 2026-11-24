<script setup lang="ts">
import Snackbar from "./components/snackbar/Snackbar.vue"
import { useUnidadeStore } from "./stores/unidadeStore"

const unidadeStore = useUnidadeStore()
unidadeStore.loadUnidade()
</script>

<template>
    <Snackbar></Snackbar>
    <router-view></router-view>
</template>
