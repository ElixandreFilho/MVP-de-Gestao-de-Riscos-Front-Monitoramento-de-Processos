import { computed, ref } from "vue"
import { defineStore } from "pinia"
import type {
    MonitoramentoAcao,
    MonitoramentoActor,
    MonitoramentoDecisao,
    MonitoramentoNotification,
    MonitoramentoNotificationType,
    MonitoramentoOrigem,
    MonitoramentoProposal,
    MonitoramentoStatus,
} from "../types/monitoramento"

const atoresIniciais: MonitoramentoActor[] = [
    { id: "secgov-analista", nome: "Jonatan · SecGov analista", perfil: "SECGOV", contexto: "ANALISE", podeExportar: true },
    { id: "secgov-autoria", nome: "Yane · SecGov autora", perfil: "SECGOV", contexto: "AUTORIA", podeExportar: true },
    { id: "unidade-prppg", nome: "Lívia · PRPPG", perfil: "UNIDADE", contexto: "AUTORIA", unidadeSigla: "PRPPG", podeExportar: true },
    { id: "unidade-prointer", nome: "Jonatan · PROINTER", perfil: "UNIDADE", contexto: "AUTORIA", unidadeSigla: "PROINTER", podeExportar: false },
    { id: "unidade-prograd", nome: "Ana · PROGRAD", perfil: "UNIDADE", contexto: "AUTORIA", unidadeSigla: "PROGRAD", podeExportar: false },
    { id: "unidade-prex", nome: "Yane · PREX", perfil: "UNIDADE", contexto: "AUTORIA", unidadeSigla: "PREX", podeExportar: false },
]

const agora = () => new Date().toISOString()
const dataAtual = () => new Date().toLocaleDateString("pt-BR")

function proposal(input: Partial<MonitoramentoProposal> & Pick<MonitoramentoProposal, "id" | "nome" | "unidade" | "ciclo" | "status" | "origem" | "responsavel" | "autorId" | "descricao">): MonitoramentoProposal {
    return { ...input, ultimaAtualizacao: input.ultimaAtualizacao || "13/08/2026", versaoAtual: 1, versoes: [{ id: `${input.id}-v1`, numero: 1, criadoEm: "2026-08-13T10:00:00-03:00", criadoPor: input.responsavel, resumo: "Cadastro inicial" }], pontosAjuste: input.pontosAjuste || [], historico: input.historico || [{ id: `${input.id}-evento-1`, propostaId: input.id, tipo: "CRIACAO", resumo: "Proposta criada", actorId: input.autorId, actorNome: input.responsavel, criadoEm: "2026-08-13T10:00:00-03:00", statusNovo: input.status }] }
}

const propostasIniciais: MonitoramentoProposal[] = [
    proposal({ id: "proposta-1", nome: "Aprimorar coleta e disponibilização de dados sobre Pesquisa e PG.", unidade: "PRPPG", subunidade: "Secretaria Administrativa", ciclo: "2021", status: "AGUARDANDO_ANALISE", origem: "UNIDADE", responsavel: "Yane", autorId: "unidade-prppg", analista: "Yane", revisor: "Lívia", atencaoEspecial: "Não", dataAtualizacao: "29/12/2023", programa: "não utilizado neste levantamento", statusMapeamento: "Finalizado.", statusRiscosOrganizacionais: "Finalizado.", statusRiscosIntegridade: "Finalizado.", ultimaEnvio: "29/12/2023", descricao: "Organizar a coleta, atualização e disponibilização de dados relacionados à Pesquisa e Pós-Graduação." }),
    proposal({ id: "proposta-2", nome: "Fluxo de registro/matrícula de alunos da UFC em mobilidade estrangeira.", unidade: "PROINTER", subunidade: "Coordenadoria de Mobilidade Acadêmica", ciclo: "2021", status: "ACEITO", origem: "UNIDADE", responsavel: "Jonatan", autorId: "unidade-prointer", analista: "Jonatan", revisor: "Yane", atencaoEspecial: "Não", dataAtualizacao: "27/12/2023", programa: "não utilizado neste levantamento", statusMapeamento: "Finalizado.", statusRiscosOrganizacionais: "Finalizado.", statusRiscosIntegridade: "Finalizado.", ultimaEnvio: "27/12/2023", descricao: "Proposta de melhoria para registro e matrícula de alunos em mobilidade estrangeira.", justificativa: "Proposta aceita pela SecGov." }),
    proposal({ id: "proposta-3", nome: "Matrícula via SISU-Meio digital", unidade: "PROGRAD", subunidade: "Coordenadoria de Planejamento, Informação e Comunicação", ciclo: "2021", status: "AJUSTES_SOLICITADOS", origem: "UNIDADE", responsavel: "Jonatan", autorId: "unidade-prppg", analista: "Jonatan", revisor: "Yane", atencaoEspecial: "Não", dataAtualizacao: "02/06/2023", programa: "não utilizado neste levantamento", statusMapeamento: "Finalizado.", statusRiscosOrganizacionais: "Finalizado.", statusRiscosIntegridade: "Finalizado.", descricao: "Mapeamento inicial do processo de matrícula via SISU.", ajustes: "Complementar a descrição do processo e informar a fonte de atualização.", pontosAjuste: [{ id: "ajuste-3-1", descricao: "Complementar a descrição do processo e informar a fonte de atualização.", campo: "Descrição", status: "ABERTO", solicitadoPor: "Jonatan · SecGov analista", solicitadoEm: "2026-08-13T10:00:00-03:00" }] }),
    proposal({ id: "proposta-4", nome: "Promoção das ações de extensão", unidade: "PREX", subunidade: "Coordenadoria de Extensão do Campus do Benfica", ciclo: "2021", status: "REJEITADO", origem: "UNIDADE", responsavel: "Yane", autorId: "unidade-prppg", analista: "Yane", revisor: "Lívia", atencaoEspecial: "Não", dataAtualizacao: "14/07/2023", programa: "não utilizado neste levantamento", statusMapeamento: "Finalizado.", statusRiscosOrganizacionais: "Finalizado.", statusRiscosIntegridade: "Finalizado.", descricao: "Proposta relacionada à promoção das ações de extensão.", justificativa: "Necessário revisar o escopo antes de uma nova submissão." }),
    proposal({ id: "proposta-5", nome: "Aquisições em Geral.", unidade: "PROPLAD / UFC INFRA", subunidade: "Assessoria Geral", ciclo: "2021", status: "RASCUNHO", origem: "UNIDADE", responsavel: "Jonatan", autorId: "unidade-prointer", analista: "Jonatan", revisor: "Yane", atencaoEspecial: "Não", dataAtualizacao: "30/06/2023", programa: "não utilizado neste levantamento", statusMapeamento: "Finalizado.", statusRiscosOrganizacionais: "Finalizado.", statusRiscosIntegridade: "Finalizado.", descricao: "Proposta de mapeamento do processo de aquisições em geral." }),
    proposal({ id: "proposta-6", nome: "Monitoramento de Gestão de Riscos", unidade: "SECGOV", ciclo: "2026", status: "AGUARDANDO_ANALISE", origem: "SECGOV", responsavel: "Yane", autorId: "secgov-autoria", analista: "Jonatan", descricao: "Acompanhamento dos processos prioritários da Gestão de Riscos." }),
]

const notificacoesIniciais: MonitoramentoNotification[] = [{ id: "notificacao-1", propostaId: "proposta-3", propostaNome: "Matrícula via SISU-Meio digital", titulo: "Ajustes solicitados", descricao: "A proposta precisa de complementação.", tipo: "AJUSTES_SOLICITADOS", eventoOrigemId: "proposta-3-evento-1", destinatarioId: "unidade-prograd", rota: "/monitoramento/proposta-3", criadoEm: "2026-08-13T10:00:00-03:00", lida: false }]

export const useMonitoramentoStore = defineStore("monitoramento", () => {
    const atores = ref(atoresIniciais)
    const atorAtualId = ref("secgov-analista")
    const propostas = ref(propostasIniciais)
    const notificacoes = ref(notificacoesIniciais)
    const atorAtual = computed<MonitoramentoActor>(() => atores.value.find((ator) => ator.id === atorAtualId.value) || atores.value[0]!)
    const propostasVisiveis = computed(() => propostas.value.filter((item) => atorAtual.value.perfil === "SECGOV" || item.unidade === atorAtual.value.unidadeSigla))
    const naoLidas = computed(() => notificacoes.value.filter((item) => item.destinatarioId === atorAtual.value.id && !item.lida).length)

    function setAtor(id: string) { if (atores.value.some((ator) => ator.id === id)) atorAtualId.value = id }
    function getProposal(id: string) { return propostas.value.find((item) => item.id === id) }
    function getAccessibleProposal(id: string) { return propostasVisiveis.value.find((item) => item.id === id) }
    function actorCanAccess(proposta: MonitoramentoProposal, actor = atorAtual.value) { return actor.perfil === "SECGOV" || proposta.unidade === actor.unidadeSigla }
    function addEvent(proposta: MonitoramentoProposal, tipo: string, resumo: string, from?: MonitoramentoStatus, to?: MonitoramentoStatus, versaoId?: string) {
        proposta.historico.push({ id: `${proposta.id}-evento-${Date.now()}`, propostaId: proposta.id, tipo, resumo, actorId: atorAtual.value.id, actorNome: atorAtual.value.nome, criadoEm: agora(), statusAnterior: from, statusNovo: to, versaoId })
        proposta.ultimaAtualizacao = dataAtual()
    }
    function notify(proposta: MonitoramentoProposal, tipo: MonitoramentoNotificationType, titulo: string, descricao: string, destinatarioId: string, eventoOrigemId: string) {
        if (notificacoes.value.some((item) => item.eventoOrigemId === eventoOrigemId && item.destinatarioId === destinatarioId)) return
        notificacoes.value.unshift({ id: `notificacao-${Date.now()}`, propostaId: proposta.id, propostaNome: proposta.nome, titulo, descricao, tipo, eventoOrigemId, destinatarioId, rota: `/monitoramento/${proposta.id}`, criadoEm: agora(), lida: false })
    }
    function getAvailableActions(proposta: MonitoramentoProposal, actor = atorAtual.value): MonitoramentoAcao[] {
        if (!actorCanAccess(proposta, actor)) return []
        if (actor.perfil === "UNIDADE") {
            if (proposta.autorId !== actor.id) return []
            if (proposta.status === "RASCUNHO") return ["EDITAR", "ENVIAR_PARA_ANALISE"]
            if (proposta.status === "AJUSTES_SOLICITADOS") return ["EDITAR", "REENVIAR_AJUSTADO"]
            return []
        }
        if (actor.contexto === "ANALISE") {
            if (proposta.status === "AGUARDANDO_ANALISE") return ["ACEITAR", "REJEITAR", "SOLICITAR_AJUSTES"]
            if (proposta.status === "ACEITO") return ["CANCELAR_ACEITE"]
            if (proposta.status === "REJEITADO") return ["CANCELAR_REJEICAO"]
            if (proposta.status === "AJUSTES_SOLICITADOS") return ["CANCELAR_SOLICITACAO"]
            return []
        }
        if (proposta.autorId !== actor.id) return []
        if (proposta.status === "RASCUNHO") return ["EDITAR", "ENVIAR_PARA_ANALISE"]
        if (proposta.status === "AJUSTES_SOLICITADOS") return ["EDITAR", "REENVIAR_AJUSTADO"]
        if (proposta.status === "ACEITO") return ["CANCELAR_ACEITE"]
        if (proposta.status === "REJEITADO") return ["CANCELAR_REJEICAO"]
        return []
    }
    function createProposal(input: Partial<MonitoramentoProposal>, origem: MonitoramentoOrigem, actor = atorAtual.value) {
        const item = proposal({ id: `proposta-${Date.now()}`, nome: input.nome || "Nova proposta", unidade: input.unidade || actor.unidadeSigla || "Minha Unidade", subunidade: input.subunidade, ciclo: input.ciclo || new Date().getFullYear().toString(), status: "RASCUNHO", origem, responsavel: actor.nome, autorId: actor.id, descricao: input.descricao || "", observacoes: input.observacoes })
        propostas.value.unshift(item)
        return item
    }
    function saveProposal(id: string, patch: Partial<MonitoramentoProposal>) {
        const item = getProposal(id); if (!item) return
        Object.assign(item, patch); item.versaoAtual += 1; const versionId = `${id}-v${item.versaoAtual}`
        item.versoes.push({ id: versionId, numero: item.versaoAtual, criadoEm: agora(), criadoPor: atorAtual.value.nome, resumo: "Campos da proposta atualizados" }); addEvent(item, "EDICAO", "Proposta editada", undefined, undefined, versionId)
    }
    function submitProposal(id: string) {
        const item = getProposal(id); if (!item || getAvailableActions(item).indexOf("ENVIAR_PARA_ANALISE") < 0) return { ok: false, errors: ["Ação não permitida para este contexto."] }
        const errors = [!item.nome.trim() ? "Informe o nome da proposta." : "", !item.unidade.trim() ? "Informe a Unidade." : "", !item.ciclo.trim() ? "Informe o ciclo/ano." : ""].filter(Boolean)
        if (errors.length) return { ok: false, errors }
        const anterior = item.status; item.status = "AGUARDANDO_ANALISE"; item.ultimaEnvio = dataAtual(); const eventId = `${item.id}-envio-${Date.now()}`; addEvent(item, "ENVIO", "Proposta enviada para análise", anterior, item.status); notify(item, "PROPOSTA_ENVIADA", "Nova proposta para análise", `${item.nome} foi enviada por ${atorAtual.value.nome}.`, "secgov-analista", eventId); return { ok: true, errors: [] }
    }
    function applyDecision(id: string, decision: MonitoramentoDecisao, justificativa: string, ponto?: string) {
        const item = getProposal(id); if (!item || !getAvailableActions(item).includes(decision as MonitoramentoAcao)) return { ok: false, error: "Ação não permitida." }
        if (!justificativa.trim()) return { ok: false, error: "A justificativa é obrigatória." }
        if (decision === "SOLICITAR_AJUSTES" && !ponto?.trim()) return { ok: false, error: "Informe pelo menos um ponto de ajuste." }
        const anterior = item.status; const status: MonitoramentoStatus = decision === "ACEITAR" ? "ACEITO" : decision === "REJEITAR" ? "REJEITADO" : "AJUSTES_SOLICITADOS"; item.status = status; item.justificativa = justificativa; item.ajustes = ponto
        if (decision === "SOLICITAR_AJUSTES") item.pontosAjuste.push({ id: `${item.id}-ajuste-${Date.now()}`, descricao: ponto || justificativa, campo: "Descrição", status: "ABERTO", solicitadoPor: atorAtual.value.nome, solicitadoEm: agora() })
        const tipo = decision === "ACEITAR" ? "PROPOSTA_ACEITA" : decision === "REJEITAR" ? "PROPOSTA_REJEITADA" : "AJUSTES_SOLICITADOS"; const eventId = `${item.id}-decisao-${Date.now()}`; addEvent(item, "DECISAO", `Decisão registrada: ${status}`, anterior, status); const destinatario = item.autorId; notify(item, tipo, status === "ACEITO" ? "Proposta aceita" : status === "REJEITADO" ? "Proposta rejeitada" : "Ajustes solicitados", justificativa, destinatario, eventId); return { ok: true }
    }
    function resendProposal(id: string) { const item = getProposal(id); if (!item || !getAvailableActions(item).includes("REENVIAR_AJUSTADO")) return { ok: false }; const anterior = item.status; item.status = "AGUARDANDO_ANALISE"; item.pontosAjuste.forEach((ponto) => { ponto.status = "RESPONDIDO"; ponto.respondidoEm = agora() }); const eventId = `${item.id}-reenvio-${Date.now()}`; addEvent(item, "REENVIO", "Proposta ajustada reenviada para análise", anterior, item.status); notify(item, "PROPOSTA_REENVIADA", "Proposta ajustada reenviada", `${item.nome} foi reenviada por ${atorAtual.value.nome}.`, "secgov-analista", eventId); return { ok: true } }
    function cancelDecision(id: string, action: MonitoramentoAcao) { const item = getProposal(id); if (!item || !getAvailableActions(item).includes(action)) return { ok: false }; const anterior = item.status; item.status = "AGUARDANDO_ANALISE"; item.pontosAjuste.forEach((ponto) => { ponto.status = "ENCERRADO" }); addEvent(item, "CANCELAMENTO", `Cancelamento realizado: ${action}`, anterior, item.status); return { ok: true } }
    function markNotificationAsRead(id: string) { const item = notificacoes.value.find((notification) => notification.id === id && notification.destinatarioId === atorAtual.value.id); if (item) item.lida = true }
    function markAllNotificationsAsRead() { notificacoes.value.filter((item) => item.destinatarioId === atorAtual.value.id).forEach((item) => { item.lida = true }) }
    function exportCsv(items = propostasVisiveis.value) { const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`; const rows = [["Processo", "Unidade", "Subunidade", "Ciclo", "Status", "Última atualização", "Responsável"], ...items.map((item) => [item.nome, item.unidade, item.subunidade, item.ciclo, item.status, item.ultimaAtualizacao, item.responsavel])]; return rows.map((row) => row.map(escape).join(";")).join("\r\n") }

    return { atores, atorAtual, atorAtualId, propostas, propostasVisiveis, notificacoes, naoLidas, setAtor, getProposal, getAccessibleProposal, getAvailableActions, actorCanAccess, createProposal, saveProposal, submitProposal, applyDecision, resendProposal, cancelDecision, markNotificationAsRead, markAllNotificationsAsRead, exportCsv }
})
