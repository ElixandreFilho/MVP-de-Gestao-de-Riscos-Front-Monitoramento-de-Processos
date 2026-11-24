<script setup lang="ts">
import { IconBell, IconEye, IconRefresh } from "@tabler/icons-vue"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import type { DataTableHeader } from "vuetify"
import { showMessage } from "../../components/snackbar/SnackbarState"
import { getHttpErrorMessage } from "../../core/httpError"
import acompanhamentoService from "../../services/acompanhamentoService"
import type { NotificacaoAcompanhamento } from "../../types/acompanhamento"

const router = useRouter()
const notificacoes = ref<NotificacaoAcompanhamento[]>([])
const loading = ref(false)

const headers: DataTableHeader<NotificacaoAcompanhamento>[] = [
    { title: "Notificação", value: "titulo", minWidth: "280px" },
    { title: "Processo", value: "processoNome", minWidth: "220px" },
    { title: "Data", value: "criadoEm", minWidth: "160px" },
    { title: "Status", value: "lida" },
    { title: "Ações", value: "actions", align: "end", sortable: false },
]

const naoLidas = computed(() => notificacoes.value.filter((item) => !item.lida).length)

onMounted(() => {
    void carregarNotificacoes()
})

async function carregarNotificacoes(): Promise<void> {
    loading.value = true
    try {
        notificacoes.value = await acompanhamentoService.listarNotificacoes()
    } catch (error) {
        console.error(error)
        showMessage(getHttpErrorMessage(error, "Erro ao carregar notificações."), "error")
    } finally {
        loading.value = false
    }
}

async function abrirNotificacao(notificacao: NotificacaoAcompanhamento): Promise<void> {
    try {
        await acompanhamentoService.marcarNotificacaoComoLida(notificacao.id)
    } catch (error) {
        console.error(error)
    }

    if (notificacao.destino === "DOCUMENTOS") {
        await router.push({ name: "Documentos" })
        return
    }

    if (notificacao.processoId) {
        await router.push({
            name: "Processes",
            query: { tab: "1", processoId: String(notificacao.processoId) },
        })
        return
    }

    await carregarNotificacoes()
}

function formatarDataHora(dataIso: string): string {
    const data = new Date(dataIso)
    return `${data.toLocaleDateString("pt-BR")} ${data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`
}
</script>

<template>
    <VContainer fluid class="notificacoes-page">
        <div class="page-header">
            <div>
                <h2>Notificações</h2>
                <h4>{{ naoLidas }} nova{{ naoLidas === 1 ? "" : "s" }}</h4>
            </div>
            <VBtn variant="outlined" :loading="loading" @click="carregarNotificacoes">
                <IconRefresh size="18" />
                Atualizar
            </VBtn>
        </div>

        <VDataTable
            :headers="headers"
            :items="notificacoes"
            :loading="loading"
            class="custom-table"
            no-data-text="Nenhuma notificação encontrada."
        >
            <template #[`item.titulo`]="{ item }">
                <div class="notification-cell">
                    <IconBell size="20" :class="item.lida ? 'muted-icon' : 'active-icon'" />
                    <div>
                        <strong>{{ item.titulo }}</strong>
                        <span>{{ item.descricao }}</span>
                    </div>
                </div>
            </template>

            <template #[`item.criadoEm`]="{ item }">
                {{ formatarDataHora(item.criadoEm) }}
            </template>

            <template #[`item.lida`]="{ item }">
                <VChip size="small" :color="item.lida ? 'grey' : 'primary'" variant="tonal">
                    {{ item.lida ? "Lida" : "Nova" }}
                </VChip>
            </template>

            <template #[`item.actions`]="{ item }">
                <VBtn icon size="small" variant="outlined" @click="abrirNotificacao(item)">
                    <IconEye size="18" />
                </VBtn>
            </template>
        </VDataTable>
    </VContainer>
</template>

<style scoped>
.notificacoes-page {
    min-height: 100%;
    padding: 24px;
    background: #f5f7fb;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
}

.page-header h2,
.page-header h4 {
    padding: 0;
}

.page-header h4 {
    color: #4b5563;
}

.custom-table {
    border: var(--border);
    border-radius: 8px;
    box-shadow: none;
}

.notification-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-cell div {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.notification-cell span {
    color: #4b5563;
    font-size: 13px;
}

.active-icon {
    color: #2563eb;
}

.muted-icon {
    color: #9ca3af;
}
</style>

