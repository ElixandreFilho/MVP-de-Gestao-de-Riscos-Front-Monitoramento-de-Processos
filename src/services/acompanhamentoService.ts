import axios from "axios"
import type {
    AcompanhamentoFilters,
    AcompanhamentoIndicadores,
    AcompanhamentoPage,
    AcompanhamentoProcessoResumo,
    AnalistaCarga,
    HistoricoAcompanhamento,
    NotificacaoAcompanhamento,
    PendenciasProcesso,
    PrazoRevisao,
} from "../types/acompanhamento"

export type AcompanhamentoActionPayload = {
    analistaId?: number | null
    analistaResponsavelId?: number | null
    segundoAnalistaId?: number | null
    observacao?: string
    justificativa?: string
    prazoAjuste?: string
}

export type PrazoRevisaoPayload = {
    anoReferencia: number
    prazo: string
}

class AcompanhamentoService {
    private readonly route = "/acompanhamentos"

    async listarProcessos(
        page = 1,
        size = 10,
        filters: AcompanhamentoFilters = {}
    ): Promise<AcompanhamentoPage> {
        const params = new URLSearchParams()
        params.set("page", String(Math.max(page - 1, 0)))
        params.set("size", String(size))

        if (filters.nome?.trim()) params.set("nome", filters.nome.trim())
        if (filters.dataInicial) params.set("dataInicial", filters.dataInicial)
        if (filters.dataFinal) params.set("dataFinal", filters.dataFinal)
        if (filters.unidadeId) params.set("unidadeId", String(filters.unidadeId))
        if (filters.status) params.set("status", filters.status)
        if (filters.analistaId) params.set("analistaId", String(filters.analistaId))

        const { data } = await axios.get<AcompanhamentoPage>(
            `${this.route}/processos?${params.toString()}`
        )

        if (!data.content) data.content = []
        return data
    }

    async indicadores(): Promise<AcompanhamentoIndicadores> {
        const { data } = await axios.get<AcompanhamentoIndicadores>(
            `${this.route}/processos/indicadores`
        )
        return data
    }

    async detalhar(processoId: number): Promise<AcompanhamentoProcessoResumo> {
        const { data } = await axios.get<AcompanhamentoProcessoResumo>(
            `${this.route}/processos/${processoId}`
        )
        return data
    }

    async consultarPendencias(processoId: number): Promise<PendenciasProcesso> {
        const { data } = await axios.get<PendenciasProcesso>(
            `${this.route}/processos/${processoId}/pendencias`
        )
        return data
    }

    enviarParaAnalise(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "enviar", payload)
    }

    cancelarEnvio(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "cancelar-envio", payload)
    }

    atribuirAnalista(processoId: number, payload: AcompanhamentoActionPayload) {
        return this.postAcao(processoId, "atribuir-analista", payload)
    }

    desvincularAnalista(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "desvincular-analista", payload)
    }

    iniciarAnalise(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "iniciar-analise", payload)
    }

    solicitarAjustes(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "solicitar-ajustes", payload)
    }

    reenviarAjustado(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "reenviar-ajustado", payload)
    }

    concluirAnalise(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "concluir-analise", payload)
    }

    cancelarAnalise(processoId: number, payload: AcompanhamentoActionPayload) {
        return this.postAcao(processoId, "cancelar-analise", payload)
    }

    iniciarRevisao(processoId: number, payload: AcompanhamentoActionPayload = {}) {
        return this.postAcao(processoId, "iniciar-revisao", payload)
    }

    async listarHistorico(processoId: number): Promise<HistoricoAcompanhamento[]> {
        const { data } = await axios.get<HistoricoAcompanhamento[]>(
            `${this.route}/processos/${processoId}/historico`
        )
        return data
    }

    async listarAnalistas(): Promise<AnalistaCarga[]> {
        const { data } = await axios.get<AnalistaCarga[]>(`${this.route}/analistas`)
        return data
    }

    async listarNotificacoes(): Promise<NotificacaoAcompanhamento[]> {
        const { data } = await axios.get<NotificacaoAcompanhamento[]>(
            `${this.route}/notificacoes`
        )
        return data
    }

    async marcarNotificacaoComoLida(id: number): Promise<NotificacaoAcompanhamento> {
        const { data } = await axios.post<NotificacaoAcompanhamento>(
            `${this.route}/notificacoes/${id}/ler`
        )
        return data
    }

    async listarPrazosRevisao(): Promise<PrazoRevisao[]> {
        const { data } = await axios.get<PrazoRevisao[]>(`${this.route}/prazos-revisao`)
        return data
    }

    async salvarPrazoRevisao(payload: PrazoRevisaoPayload): Promise<PrazoRevisao> {
        const { data } = await axios.post<PrazoRevisao>(`${this.route}/prazos-revisao`, payload)
        return data
    }

    async atualizarPrazoRevisao(id: number, payload: PrazoRevisaoPayload): Promise<PrazoRevisao> {
        const { data } = await axios.put<PrazoRevisao>(`${this.route}/prazos-revisao/${id}`, payload)
        return data
    }

    async removerPrazoRevisao(id: number): Promise<void> {
        await axios.delete(`${this.route}/prazos-revisao/${id}`)
    }

    private async postAcao(
        processoId: number,
        acao: string,
        payload: AcompanhamentoActionPayload
    ): Promise<AcompanhamentoProcessoResumo> {
        const { data } = await axios.post<AcompanhamentoProcessoResumo>(
            `${this.route}/processos/${processoId}/${acao}`,
            payload
        )
        return data
    }
}

export default new AcompanhamentoService()
