<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { IconArrowLeft, IconDeviceFloppy, IconSend } from "@tabler/icons-vue"
import { useMonitoramentoStore } from "../../stores/monitoramentoStore"

const route = useRoute(); const router = useRouter(); const store = useMonitoramentoStore()
const existing = computed(() => route.query.id ? store.getAccessibleProposal(String(route.query.id)) : undefined)
const nome = ref(existing.value?.nome || ""); const unidade = ref(existing.value?.unidade || store.atorAtual.unidadeSigla || (store.atorAtual.perfil === "SECGOV" ? "SECGOV" : "")); const subunidade = ref(existing.value?.subunidade || ""); const ciclo = ref(existing.value?.ciclo || new Date().getFullYear().toString()); const descricao = ref(existing.value?.descricao || ""); const observacoes = ref(existing.value?.observacoes || ""); const modal = ref(false); const action = ref<"RASCUNHO" | "ENVIAR" | null>(null); const errors = ref<string[]>([])
const isSecGov = computed(() => store.atorAtual.perfil === "SECGOV")
const unidades = computed(() => [...new Set(store.propostas.map((item) => item.unidade))].map((sigla) => ({ title: sigla === "SECGOV" ? "SECGOV — Secretaria de Governança" : sigla, value: sigla })))
function ask(value: "RASCUNHO" | "ENVIAR") { errors.value = []; action.value = value; modal.value = true }
function confirm() {
    const proposal = existing.value || store.createProposal({ nome: nome.value, unidade: unidade.value, subunidade: subunidade.value, ciclo: ciclo.value, descricao: descricao.value, observacoes: observacoes.value }, isSecGov.value ? "SECGOV" : "UNIDADE")
    if (existing.value) store.saveProposal(proposal.id, { nome: nome.value, unidade: unidade.value, subunidade: subunidade.value, ciclo: ciclo.value, descricao: descricao.value, observacoes: observacoes.value })
    if (action.value === "ENVIAR") { const result = store.submitProposal(proposal.id); if (!result.ok) { errors.value = result.errors; return } }
    modal.value = false; router.push({ name: "MonitoramentoDetalhes", params: { id: proposal.id } })
}
</script>

<template>
    <VContainer fluid class="cadastro-page"><div class="cadastro-header"><div><div class="breadcrumb">Monitoramento / Cadastro</div><h1>{{ existing ? "Editar proposta" : "Cadastrar proposta" }}</h1><p>Preencha os dados mínimos para salvar ou enviar a proposta para análise.</p></div><VBtn variant="outlined" @click="router.back()"><IconArrowLeft size="18" /> Voltar</VBtn></div><VAlert v-if="errors.length" type="error" variant="tonal" class="validation-alert"><div v-for="error in errors" :key="error">{{ error }}</div></VAlert><VCard class="form-card"><h2>Identificação da proposta</h2><div class="form-grid"><VTextField v-model="nome" label="Nome da proposta / processo" /><VSelect v-if="isSecGov" v-model="unidade" label="Unidade de origem" :items="unidades" item-title="title" item-value="value" clearable /><VTextField v-else :model-value="unidade" label="Unidade de origem" readonly /><VTextField v-model="subunidade" label="Subunidade" /><VTextField v-model="ciclo" label="Ciclo / ano de referência" /><VTextField :model-value="store.atorAtual.nome" label="Responsável pelo cadastro" readonly /><VTextField :model-value="isSecGov ? 'SECGOV' : 'UNIDADE'" label="Origem do cadastro" readonly /></div><VDivider class="section-divider" /><h2>Mapeamento inicial</h2><VTextarea v-model="descricao" label="Objetivo ou descrição do processo" /><VTextarea v-model="observacoes" label="Observações" /></VCard><div class="form-actions"><VBtn variant="outlined" @click="ask('RASCUNHO')"><IconDeviceFloppy size="18" /> Salvar rascunho</VBtn><VBtn color="primary" @click="ask('ENVIAR')"><IconSend size="18" /> Enviar proposta</VBtn></div><VDialog v-model="modal" max-width="460"><VCard><VCardTitle>{{ action === 'ENVIAR' ? 'Enviar proposta?' : 'Salvar rascunho?' }}</VCardTitle><VCardText>{{ action === 'ENVIAR' ? 'A proposta será disponibilizada para análise da SecGov.' : 'A proposta será salva como rascunho.' }}</VCardText><VCardActions><VSpacer /><VBtn variant="text" @click="modal=false">Cancelar</VBtn><VBtn color="primary" @click="confirm">Confirmar</VBtn></VCardActions></VCard></VDialog></VContainer>
</template>

<style scoped>
.cadastro-page{min-height:100%;padding:24px;background:#f5f7fb;box-sizing:border-box}.cadastro-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:18px}.breadcrumb{font-size:12px;color:#64748b}.cadastro-header h1{margin:8px 0 4px;color:#172033;font-size:28px}.cadastro-header p{margin:0;color:#64748b}.validation-alert{max-width:1120px;margin-bottom:16px}.form-card{display:block;width:100%;max-width:1120px;box-sizing:border-box;padding:22px;border:1px solid #d8deea}.form-card h2{margin:0 0 16px;color:#172033;font-size:16px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.section-divider{margin:8px 0 20px}.form-actions{display:flex;width:100%;max-width:1120px;justify-content:flex-end;gap:10px;margin-top:14px}.form-actions svg{margin-right:6px}@media(max-width:700px){.cadastro-header,.form-actions{flex-direction:column}.form-grid{grid-template-columns:1fr}.form-actions .v-btn{width:100%}}
</style>
