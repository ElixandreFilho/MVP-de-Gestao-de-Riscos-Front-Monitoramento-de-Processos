<template>
    <v-container fluid>
        <v-card class="infoCard" variant="flat" color="white">
            <v-col class="infoCardContent">
                <v-card-item>
                    <v-card-subtitle class="infoCardTitle text-color-primary" >{{ titulo }}</v-card-subtitle>
                    <bold class="infoCardNumber text-color-primary">{{ valor }}</bold>
                </v-card-item>
            </v-col>
            <v-col cols="2">
                <v-icon :icon="icon_name" :color="icon_color"></v-icon>
            </v-col>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import type { Ref } from "vue"

defineProps<{
    titulo: string
    valor: Ref<number> | number
    icon_name: string
    icon_color: string
}>()
</script>

<style scoped>
.v-container {
    margin: 1vh 0;
    padding: 0;
}

.text-color-primary {
    color: black;
}

.v-col {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-self: center;
    padding: 0;
}

.infoCard {
    align-items: flex-start;
    display: flex;
    padding: 1vw;
}

.infoCardContent {
    gap: 1vw;
    width: 100%;
    padding: 0;
}

.infoCardTitle {
    font-size: 12px;
    color: hsl(0, 0%, 40%);
}

.infoCardNumber {
    font-size: 28px;
    font-weight: 700;
}
</style>
