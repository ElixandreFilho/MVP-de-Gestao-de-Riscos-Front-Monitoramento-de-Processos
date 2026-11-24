<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { IconArrowLeft, IconBell, IconCheck } from "@tabler/icons-vue"
import { useMonitoramentoStore } from "../../stores/monitoramentoStore"

const router = useRouter()
const store = useMonitoramentoStore()
const notificacoes = computed(() => store.notificacoes.filter((item) => item.destinatarioId === store.atorAtual.id))

function openNotification(id: string, proposalId: string) {
    store.markNotificationAsRead(id)
    router.push({ name: "MonitoramentoDetalhes", params: { id: proposalId } })
}
</script>

<template>
    <VContainer fluid class="notifications-page">
        <div class="page-header">
            <div><div class="breadcrumb">Monitoramento / Notificações</div><h1>Notificações</h1><p>Atualizações sobre as propostas do Monitoramento.</p></div>
            <div class="header-actions"><VBtn variant="outlined" @click="store.markAllNotificationsAsRead">Marcar todas como lidas</VBtn><VBtn variant="outlined" @click="router.back()"><IconArrowLeft size="18" /> Voltar</VBtn></div>
        </div>
        <VCard class="notifications-card">
            <div v-if="!notificacoes.length" class="empty"><IconBell size="28" /><p>Nenhuma notificação no momento.</p></div>
            <button v-for="item in notificacoes" :key="item.id" class="notification-row" :class="{ unread: !item.lida }" @click="openNotification(item.id, item.propostaId)">
                <span class="notification-icon"><IconCheck v-if="item.tipo === 'PROPOSTA_ACEITA'" size="18" /><IconBell v-else size="18" /></span>
                <span class="notification-copy"><strong>{{ item.titulo }}</strong><span>{{ item.descricao }}</span><small>{{ new Date(item.criadoEm).toLocaleString('pt-BR') }}</small></span>
                <span v-if="!item.lida" class="unread-dot" aria-label="Não lida"></span>
            </button>
        </VCard>
    </VContainer>
</template>

<style scoped>
.notifications-page {
    min-height:100%;
    padding:24px;
    background:#f5f7fb
}
.page-header {
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:20px;
    margin-bottom:18px
}
.header-actions {
    display:flex;
    gap:10px;
    flex-wrap:wrap
}
.breadcrumb {
    font-size:12px;
    color:#64748b
}
.page-header h1 {
    margin:8px 0 4px;
    color:#172033;
    font-size:28px
}
.page-header p {
    margin:0;
    color:#64748b
}
.notifications-card {
    max-width:900px;
    border:1px solid #d8deea;
    overflow:hidden
}
.notification-row {
    width:100%;
    display:flex;
    align-items:center;
    gap:14px;
    text-align:left;
    padding:18px 20px;
    border:0;
    border-bottom:1px solid #e3e8f0;
    background:#fff;
    cursor:pointer
}
.notification-row:hover {
    background:#f8fafc
}
.notification-row.unread {
    background:#f0f6ff
}
.notification-icon {
    display:grid;
    place-items:center;
    width:36px;
    height:36px;
    border-radius:50%;
    color:#1d4d85;
    background:#dcecff
}
.notification-copy {
    display:flex;
    flex:1;
    flex-direction:column;
    gap:3px;
    color:#172033
}
.notification-copy span,.notification-copy small {
    color:#64748b;
    font-size:13px
}
.notification-copy small {
    font-size:11px
}
.unread-dot {
    width:8px;
    height:8px;
    border-radius:50%;
    background:#1d4d85
}
.empty {
    text-align:center;
    padding:54px;
    color:#64748b
}
.empty p {
    margin:8px 0 0
}
@media(max-width:700px) {
    .page-header {
        flex-direction:column
    }
}
</style>

