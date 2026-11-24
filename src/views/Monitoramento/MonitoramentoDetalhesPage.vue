<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { IconArrowLeft, IconCheck, IconEdit, IconRefresh, IconX } from "@tabler/icons-vue"
import { useMonitoramentoStore } from "../../stores/monitoramentoStore"
import type { MonitoramentoAcao, MonitoramentoDecisao } from "../../types/monitoramento"

const route = useRoute(); const router = useRouter(); const store = useMonitoramentoStore()
const proposta = computed(() => store.getAccessibleProposal(String(route.params.id)))
const isSecGov = computed(() => store.atorAtual.perfil === "SECGOV")
const acao = ref<MonitoramentoAcao | null>(null); const justificativa = ref(""); const pontoAjuste = ref(""); const modal = ref(false); const saving = ref(false); const actionError = ref("")
const statusLabel: Record<string,string> = { RASCUNHO:"Rascunho", AGUARDANDO_ANALISE:"Aguardando análise", ACEITO:"Aceito", REJEITADO:"Rejeitado", AJUSTES_SOLICITADOS:"Ajustes solicitados" }
const actionLabel: Record<MonitoramentoAcao,string> = { EDITAR:"Editar", ENVIAR_PARA_ANALISE:"Enviar para análise", REENVIAR_AJUSTADO:"Reenviar ajustado", ACEITAR:"Aceitar", REJEITAR:"Rejeitar", SOLICITAR_AJUSTES:"Solicitar ajustes", CANCELAR_ACEITE:"Cancelar aceite", CANCELAR_REJEICAO:"Cancelar rejeição", CANCELAR_SOLICITACAO:"Cancelar solicitação" }
const actions = computed(() => proposta.value ? store.getAvailableActions(proposta.value) : [])
const needsJustification = computed(() => acao.value === "ACEITAR" || acao.value === "REJEITAR" || acao.value === "SOLICITAR_AJUSTES")
function openAction(value: MonitoramentoAcao) { acao.value = value; justificativa.value = ""; pontoAjuste.value = ""; actionError.value = ""; modal.value = true }
async function confirmAction() {
    if (!proposta.value || !acao.value) return
    saving.value = true; actionError.value = ""
    await new Promise((resolve) => setTimeout(resolve, 200))
    const id = proposta.value.id
    if (acao.value === "ACEITAR" || acao.value === "REJEITAR" || acao.value === "SOLICITAR_AJUSTES") {
        const result = store.applyDecision(id, acao.value as MonitoramentoDecisao, justificativa.value, pontoAjuste.value)
        if (!result.ok) { actionError.value = result.error || "Não foi possível concluir a ação."; saving.value = false; return }
    } else if (acao.value === "REENVIAR_AJUSTADO") {
        if (!store.resendProposal(id).ok) { actionError.value = "Reenvio não permitido para este contexto."; saving.value = false; return }
    } else if (acao.value === "CANCELAR_ACEITE" || acao.value === "CANCELAR_REJEICAO" || acao.value === "CANCELAR_SOLICITACAO") {
        if (!store.cancelDecision(id, acao.value).ok) { actionError.value = "Cancelamento não permitido para este contexto."; saving.value = false; return }
    } else if (acao.value === "EDITAR") { modal.value = false; saving.value = false; await router.push({ name: "MonitoramentoCadastro", query: { id } }); return }
    modal.value = false; saving.value = false
}
</script>

<template>
    <VContainer v-if="proposta" fluid class="details-page">
        <div class="details-top"><div><div class="breadcrumb">Monitoramento / Propostas / Detalhes</div><h1>{{ proposta.nome }}</h1><div class="status-line"><VChip size="small" color="primary" variant="tonal">{{ statusLabel[proposta.status] }}</VChip><span>Origem: {{ proposta.origem === 'SECGOV' ? 'SecGov' : 'Unidade' }} · Atualização: {{ proposta.ultimaAtualizacao }}</span></div></div><VBtn variant="outlined" @click="router.back()"><IconArrowLeft size="18" /> Voltar</VBtn></div>
        <div class="details-grid"><div class="main-column"><VCard class="detail-card"><h2>Identificação da proposta</h2><div class="info-grid"><div><label>Unidade responsável</label><strong>{{ proposta.unidade }}</strong></div><div><label>Subunidade</label><strong>{{ proposta.subunidade || 'Não informado' }}</strong></div><div><label>Ciclo / ano</label><strong>{{ proposta.ciclo }}</strong></div><div><label>Responsável pelo cadastro</label><strong>{{ proposta.responsavel }}</strong></div><div><label>Data de atualização na unidade</label><strong>{{ proposta.dataAtualizacao || proposta.ultimaAtualizacao }}</strong></div><div><label>Atenção especial</label><strong>{{ proposta.atencaoEspecial || 'Não informado' }}</strong></div></div></VCard><VCard class="detail-card"><h2>Dados da proposta</h2><label>Descrição</label><p>{{ proposta.descricao || 'Não informado' }}</p><label>Programa</label><p>{{ proposta.programa || 'Não informado' }}</p><label>Observações</label><p>{{ proposta.observacoes || 'Não informado' }}</p><div v-if="proposta.ajustes" class="adjustment-box"><strong>Ajustes solicitados</strong><p>{{ proposta.ajustes }}</p></div></VCard><VCard class="detail-card"><h2>Status na planilha de monitoramento</h2><div class="info-grid"><div><label>Mapeamento e modelagem</label><strong>{{ proposta.statusMapeamento || 'Não informado' }}</strong></div><div><label>Riscos organizacionais</label><strong>{{ proposta.statusRiscosOrganizacionais || 'Não informado' }}</strong></div><div><label>Riscos de integridade</label><strong>{{ proposta.statusRiscosIntegridade || 'Não informado' }}</strong></div><div><label>Quem revisa</label><strong>{{ proposta.revisor || 'Não informado' }}</strong></div></div></VCard><VCard v-if="proposta.pontosAjuste.length" class="detail-card"><h2>Pontos de ajuste</h2><div v-for="ponto in proposta.pontosAjuste" :key="ponto.id" class="adjustment-point"><div><strong>{{ ponto.descricao }}</strong><small>{{ ponto.campo || 'Campo não especificado' }} · {{ ponto.status }}</small></div><p v-if="ponto.resposta">Resposta: {{ ponto.resposta }}</p></div></VCard><VCard class="detail-card"><h2>Histórico</h2><div v-for="evento in [...proposta.historico].reverse()" :key="evento.id" class="history-item"><span class="history-dot"></span><div><strong>{{ evento.resumo }}</strong><small>{{ evento.actorNome }} · {{ new Date(evento.criadoEm).toLocaleString('pt-BR') }}</small></div></div></VCard></div><aside><VCard class="detail-card"><h2>Resumo</h2><label>Status atual</label><strong>{{ statusLabel[proposta.status] }}</strong><label>Analista SecGov</label><strong>{{ proposta.analista || 'Não atribuído' }}</strong><label>Versão atual</label><strong>v{{ proposta.versaoAtual }}</strong></VCard><VCard class="detail-card" v-if="proposta.justificativa"><h2>Justificativa</h2><p>{{ proposta.justificativa }}</p></VCard></aside></div>
        <VCard class="actions-bar"><div><h2>{{ isSecGov ? 'Ações da SecGov' : 'Ações disponíveis' }}</h2><span>As ações respeitam o perfil e a situação da proposta.</span></div><div class="action-buttons"><VBtn v-for="item in actions" :key="item" :color="item.includes('CANCELAR') ? 'warning' : item === 'ACEITAR' ? 'success' : item === 'REJEITAR' ? 'error' : 'primary'" :variant="item.includes('CANCELAR') ? 'outlined' : 'flat'" @click="openAction(item)"><IconCheck v-if="item === 'ACEITAR'" size="18" /><IconX v-else-if="item === 'REJEITAR'" size="18" /><IconEdit v-else-if="item === 'EDITAR'" size="18" /><IconRefresh v-else size="18" />{{ actionLabel[item] }}</VBtn></div></VCard>
        <VDialog v-model="modal" max-width="520"><VCard class="confirm-card"><VCardTitle>{{ actionLabel[acao || 'EDITAR'] }}</VCardTitle><VCardText><p>Confirma a ação “{{ actionLabel[acao || 'EDITAR'] }}” para esta proposta?</p><VTextarea v-if="needsJustification" v-model="justificativa" label="Justificativa *" placeholder="Descreva o motivo da decisão" /><VTextarea v-if="acao === 'SOLICITAR_AJUSTES'" v-model="pontoAjuste" label="Ponto de ajuste *" placeholder="Informe o que precisa ser corrigido" /><VAlert v-if="actionError" type="error" variant="tonal" density="compact">{{ actionError }}</VAlert></VCardText><VCardActions><VSpacer /><VBtn variant="text" @click="modal = false">Cancelar</VBtn><VBtn color="primary" :loading="saving" :disabled="(needsJustification && !justificativa.trim()) || (acao === 'SOLICITAR_AJUSTES' && !pontoAjuste.trim())" @click="confirmAction">Confirmar</VBtn></VCardActions></VCard></VDialog>
    </VContainer>
    <VContainer v-else class="empty-details"><h2>Proposta não encontrada</h2><VBtn @click="router.push({ name: 'Monitoramento' })">Voltar ao Monitoramento</VBtn></VContainer>
</template>

<style scoped>
.details-page {
    min-height: 100%;
    padding: 24px;
    background: #f5f7fb;
    box-sizing: border-box;
}
.details-top {
    display:flex;
    justify-content:space-between;
    gap:20px;
    align-items:flex-start;
    margin-bottom:22px
}
.breadcrumb,label {
    color:#64748b;
    font-size:12px
}
.details-top h1 {
    margin:8px 0;
    font-size:28px;
    color:#172033
}
.status-line {
    display:flex;
    align-items:center;
    gap:12px;
    color:#64748b;
    font-size:13px
}
.details-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.8fr);
    gap: 18px;
}
.main-column,aside {
    display:flex;
    flex-direction:column;
    gap:18px
}
.detail-card {
    display: block;
    padding: 18px;
    border: 1px solid #d8deea;
}
.detail-card h2,.actions-bar h2 {
    margin:0 0 16px;
    font-size:16px;
    color:#172033
}
.detail-card p {
    color:#334155;
    line-height:1.55
}
.info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
}
.info-grid div {
    display:flex;
    flex-direction:column;
    gap:5px
}
.info-grid strong {
    font-size:15px;
    color:#172033
}
.detail-card>label {
    display:block;
    margin-top:12px
}
.adjustment-box {
    margin-top:16px;
    padding:14px;
    border-radius:8px;
    background:#fff4df;
    border:1px solid #f2d49b
}
.adjustment-point {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
}
.adjustment-point:last-child { border-bottom: 0; }
.adjustment-point small, .history-item small { display: block; margin-top: 4px; color: #64748b; font-size: 12px; }
.history-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
.history-item:last-child { border-bottom: 0; }
.history-dot { flex: 0 0 8px; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: #2d5d94; }
.actions-bar {
    display: flex;
    position: sticky;
    bottom: 0;
    width: 100%;
    box-sizing: border-box;
    margin-top: 18px;
    padding: 18px;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    border: 1px solid #d8deea;
    background: #ffffff;
    box-shadow: 0 -4px 16px rgba(23, 32, 51, 0.08);
    z-index: 5;
}
.actions-bar span {
    font-size:13px;
    color:#64748b
}
.action-buttons {
    display:flex;
    flex-wrap:wrap;
    justify-content:flex-end;
    gap:8px
}
.action-buttons svg {
    margin-right:5px
}
.empty-details {
    padding:40px
}
.confirm-card {
    border-radius:12px
}
@media(max-width:800px) {
    .details-top,.actions-bar {
        flex-direction:column
    }
    .details-grid {
        grid-template-columns:1fr
    }
    .action-buttons {
        justify-content:flex-start
    }
    .info-grid {
        grid-template-columns:1fr
    }
}
</style>



