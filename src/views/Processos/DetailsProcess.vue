<script setup lang="ts">
import { computed } from "vue"
import { IconX } from "@tabler/icons-vue"
import Dialog from "../../components/Dialog.vue"

const props = defineProps<{
    show: boolean
    processo: {
        nome?: string
        unidade?: string
        setor?: string
        responsavel?: string
        dataCriacao?: string
        ultimaAtualizacao?: string
        objetivosGerais: string
        objetivosEstrategicos: string
    }
}>()

const model = computed({
    get: () => props.show,
    set: (value) => emit("update:show", value),
})

const emit = defineEmits(["update:show"])
</script>

<template>
    <Dialog
        v-model="model"
        max-width="650"
        scroll-strategy="block"
        location="center"
    >
        <VCard>
            <div class="col details">
                <div class="row dialog-header">
                    <div>
                        <h2 >Informações do Processo</h2>
                    </div>
                    <VBtn icon variant="text" @click="emit('update:show', false)">
                        <IconX size="20" />
                    </VBtn>
                </div>
                <div class="col rows">
                    <div class="row">
                        <div class="col">
                            <p class="label">Nome do Processo</p>
                            <p class="value">{{ props.processo.nome }}</p>
                        </div>
                        <div class="col">
                            <p class="label">Unidade</p>
                            <p class="value">{{ props.processo.unidade }}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <p class="label">Setor</p>
                            <p class="value">{{ props.processo.setor }}</p>
                        </div>
                        <div class="col">
                            <p class="label">Responsável pelo Gerenciamento</p>
                            <p class="value">{{ props.processo.responsavel }}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <p class="label">Data de Criação</p>
                            <p class="value">{{ props.processo.dataCriacao }}</p>
                        </div>
                        <div class="col">
                            <p class="label">Última Atualização</p>
                            <p class="value">{{ props.processo.ultimaAtualizacao }}</p>
                        </div>
                    </div>
                    <div class="col">
                        <p class="label">Objetivos Gerais</p>
                        <p class="value objetivos-field">{{ props.processo.objetivosGerais }}</p>
                    </div>
                    <div class="col">
                        <p class="label">Objetivos Estratégicos</p>
                        <p class="value objetivos-field">{{ props.processo.objetivosEstrategicos }}</p>
                    </div>
                </div>
            </div>
        </VCard>
    </Dialog>
</template>

<style scoped>
.rows {
    gap: 20px;
    margin: 10px;
}
.rows > .row{
    flex: 1;
}
.rows > .row > .col{
    flex: 1;
}
.dialog-card {
    width: 100%;
    max-width: 650px;
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 8px;
}

.label {
    font-size: 13px;
    font-weight: 600;
    color: rgb(60, 60, 60);
    padding: 0;
}

.value {
    font-size: 14px;
    color: rgb(30, 30, 30);
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    padding: 0;
}

.objetivos-field {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;
}
</style>
