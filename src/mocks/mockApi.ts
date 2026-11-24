import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"

export const MOCK_KEYCLOAK_ID = "mvp-user-001"

type JsonRecord = Record<string, any>
type PageMode = "zero" | "one"

type UnidadeRecord = {
    id: number
    codigo: string | null
    nome: string
    sigla: string
    isAdmin: boolean
    tipoUnidade: string
    parentId: number | null
    criadoEm: string
    atualizadoEm: string
}

type UsuarioRecord = {
    id: number
    nome: string
    email: string
    senha: string
    cargo: string
    papel: string | null
    funcaoKeycloak: string | null
    unidadeId: number | null
    idKeycloak: string
    ativo: boolean
    nomeSocial?: string
}

type ProcessoRecord = {
    id: number
    nome: string
    unidadeId: number
    responsavelId: number
    objetivosGerais: string
    objetivosEstrategicos: string
    criadoEm: string
    atualizadoEm: string
    dataConclusao: string
    statusAcompanhamento: string
    analistaResponsavelId: number | null
    segundoAnalistaId: number | null
    enviadoParaAnaliseEm: string | null
    reenviadoParaAnaliseEm: string | null
    analiseIniciadaEm: string | null
    analiseConcluidaEm: string | null
    ajusteSolicitadoEm: string | null
    prazoAjuste: string | null
    cicloAcompanhamento: number
    emCicloRevisao: boolean
}

type RiscoRecord = {
    id: number
    nome: string
    faseProcesso: string
    tipoRisco: string
    categoriaId: number
    tipoRiscoIntegridadeId: number | null
    causa: string
    consequencias: string
    criadoEm: string
    atualizadoEm: string
    processoId: number
}

type AvaliacaoRecord = {
    id: number
    riscoId: number
    probabilidade: number
    impacto: number
    fac: number
    controlesPreventivos: string
    controlesAtenuacao: string
    atualizadoEm: string
    dataUltimaAvaliacao: string
}

type RespostaRecord = {
    id: number
    riscoId: number
    opcaoTratamento: string
    justificativa: string
    atualizadoEm: string
}

type AtividadeRecord = {
    id: number
    riscoId: number
    statusImplementacao: string
    responsavelTratamento: string
    dataInicio: string
    dataTermino: string
    gatilho: string
    acoesContingencia: string
    responsavelContingencia: string
    atualizadoEm: string
    acoesPreventivas: string
    monitoramentoAcoesPreventivas: string
}

type OcorrenciaRecord = {
    id: number
    riscoId: number
    dataOcorrencia: string
    responsavelRegistroId: number
    responsavelSolucao: string
    descricao: string
    criadoEm: string
    atualizadoEm: string
    resultados: string
    solucao: string
}

type PrazoRecord = {
    id: number
    anoReferencia: number
    prazo: string
    limiteAtraso: string
    responsavelId: number | null
    criadoEm: string
    atualizadoEm: string
}

type HistoricoRecord = {
    id: number
    processoId: number
    tipo: string
    criadoEm: string
    usuarioId: number | null
    statusAnterior: string | null
    statusNovo: string | null
    observacao: string | null
    ciclo: number
}

type NotificacaoRecord = {
    id: number
    titulo: string
    descricao: string
    processoId: number | null
    tipo: string
    destino: "PROCESSO" | "ANALISE" | "HISTORICO" | "DOCUMENTOS"
    criadoEm: string
    lida: boolean
}

const day = (offset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    return date.toISOString().slice(0, 10)
}

const timestamp = (offset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    return date.toISOString()
}

const addDaysTo = (dateString: string, days: number) => {
    const date = new Date(`${dateString}T12:00:00`)
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
}

const currentYear = new Date().getFullYear()

let unidades: UnidadeRecord[] = [
    {
        id: 1,
        codigo: "SEC-001",
        nome: "Secretaria de Governança",
        sigla: "SECGOV",
        isAdmin: true,
        tipoUnidade: "UNIDADE_ADMINISTRATIVA",
        parentId: null,
        criadoEm: timestamp(-180),
        atualizadoEm: timestamp(-10),
    },
    {
        id: 2,
        codigo: "PRO-010",
        nome: "Pró-Reitoria de Planejamento e Administração",
        sigla: "PROPLAD",
        isAdmin: false,
        tipoUnidade: "UNIDADE_ADMINISTRATIVA",
        parentId: null,
        criadoEm: timestamp(-170),
        atualizadoEm: timestamp(-12),
    },
    {
        id: 3,
        codigo: "COMP-021",
        nome: "Departamento de Compras e Contratos",
        sigla: "DCC",
        isAdmin: false,
        tipoUnidade: "UNIDADE_ADMINISTRATIVA",
        parentId: 2,
        criadoEm: timestamp(-160),
        atualizadoEm: timestamp(-8),
    },
    {
        id: 4,
        codigo: "CT-100",
        nome: "Centro de Tecnologia",
        sigla: "CT",
        isAdmin: false,
        tipoUnidade: "UNIDADE_ACADEMICA",
        parentId: null,
        criadoEm: timestamp(-150),
        atualizadoEm: timestamp(-9),
    },
    {
        id: 5,
        codigo: "STI-102",
        nome: "Coordenação de Tecnologia da Informação",
        sigla: "CTI",
        isAdmin: false,
        tipoUnidade: "UNIDADE_ADMINISTRATIVA",
        parentId: 4,
        criadoEm: timestamp(-140),
        atualizadoEm: timestamp(-7),
    },
    {
        id: 6,
        codigo: "ENG-205",
        nome: "Departamento de Engenharia de Produção",
        sigla: "DEP",
        isAdmin: false,
        tipoUnidade: "UNIDADE_ACADEMICA",
        parentId: 4,
        criadoEm: timestamp(-132),
        atualizadoEm: timestamp(-5),
    },
]

let usuarios: UsuarioRecord[] = [
    {
        id: 1,
        nome: "Ana Lúcia Ferreira",
        nomeSocial: "Ana Ferreira",
        email: "ana.ferreira@ufc.br",
        senha: "",
        cargo: "Gestora de riscos",
        papel: "secgov",
        funcaoKeycloak: "gestor",
        unidadeId: 1,
        idKeycloak: MOCK_KEYCLOAK_ID,
        ativo: true,
    },
    {
        id: 2,
        nome: "Bruno Cavalcante",
        email: "bruno.cavalcante@ufc.br",
        senha: "",
        cargo: "Analista de governança",
        papel: "secgov",
        funcaoKeycloak: "colaborador",
        unidadeId: 1,
        idKeycloak: "mvp-user-002",
        ativo: true,
    },
    {
        id: 3,
        nome: "Carla Menezes",
        email: "carla.menezes@ufc.br",
        senha: "",
        cargo: "Coordenadora administrativa",
        papel: "unit",
        funcaoKeycloak: "gestor",
        unidadeId: 2,
        idKeycloak: "mvp-user-003",
        ativo: true,
    },
    {
        id: 4,
        nome: "Diego Alencar",
        email: "diego.alencar@ufc.br",
        senha: "",
        cargo: "Responsável por compras",
        papel: "unit",
        funcaoKeycloak: "colaborador",
        unidadeId: 3,
        idKeycloak: "mvp-user-004",
        ativo: true,
    },
    {
        id: 5,
        nome: "Eloísa Rocha",
        email: "eloisa.rocha@ufc.br",
        senha: "",
        cargo: "Gestora de TI",
        papel: "unit",
        funcaoKeycloak: "gestor",
        unidadeId: 5,
        idKeycloak: "mvp-user-005",
        ativo: true,
    },
    {
        id: 6,
        nome: "Fábio Nogueira",
        email: "fabio.nogueira@ufc.br",
        senha: "",
        cargo: "Colaborador",
        papel: null,
        funcaoKeycloak: null,
        unidadeId: null,
        idKeycloak: "mvp-user-006",
        ativo: true,
    },
]

let categorias = [
    { id: 1, nome: "Integridade", persistente: true },
    { id: 2, nome: "Operacional", persistente: true },
    { id: 3, nome: "Estratégico", persistente: true },
    { id: 4, nome: "Financeiro", persistente: false },
]

let tiposRiscoIntegridade = [
    { id: 1, nome: "Conflito de interesses" },
    { id: 2, nome: "Fraude" },
    { id: 3, nome: "Nepotismo" },
]

let processos: ProcessoRecord[] = [
    {
        id: 101,
        nome: "Contratação de serviços terceirizados",
        unidadeId: 3,
        responsavelId: 4,
        objetivosGerais:
            "Garantir contratações aderentes ao planejamento institucional e com rastreabilidade das decisões.",
        objetivosEstrategicos:
            "Reduzir atrasos, melhorar a fiscalização contratual e padronizar evidências de conformidade.",
        criadoEm: timestamp(-48),
        atualizadoEm: timestamp(-3),
        dataConclusao: "",
        statusAcompanhamento: "AGUARDANDO_ANALISE",
        analistaResponsavelId: 2,
        segundoAnalistaId: null,
        enviadoParaAnaliseEm: timestamp(-2),
        reenviadoParaAnaliseEm: null,
        analiseIniciadaEm: null,
        analiseConcluidaEm: null,
        ajusteSolicitadoEm: null,
        prazoAjuste: null,
        cicloAcompanhamento: 1,
        emCicloRevisao: false,
    },
    {
        id: 102,
        nome: "Gestão de contratos de tecnologia",
        unidadeId: 5,
        responsavelId: 5,
        objetivosGerais:
            "Acompanhar contratos de TI, níveis de serviço, renovações e riscos de continuidade operacional.",
        objetivosEstrategicos:
            "Assegurar disponibilidade dos serviços digitais críticos e cumprimento dos acordos contratuais.",
        criadoEm: timestamp(-72),
        atualizadoEm: timestamp(-1),
        dataConclusao: "",
        statusAcompanhamento: "EM_ANALISE",
        analistaResponsavelId: 1,
        segundoAnalistaId: 2,
        enviadoParaAnaliseEm: timestamp(-14),
        reenviadoParaAnaliseEm: null,
        analiseIniciadaEm: timestamp(-10),
        analiseConcluidaEm: null,
        ajusteSolicitadoEm: null,
        prazoAjuste: null,
        cicloAcompanhamento: 1,
        emCicloRevisao: false,
    },
    {
        id: 103,
        nome: "Execução orçamentária anual",
        unidadeId: 2,
        responsavelId: 3,
        objetivosGerais:
            "Monitorar execução do orçamento anual e antecipar desvios que comprometam entregas planejadas.",
        objetivosEstrategicos:
            "Aumentar previsibilidade financeira e qualificar a tomada de decisão da gestão superior.",
        criadoEm: timestamp(-110),
        atualizadoEm: timestamp(-20),
        dataConclusao: day(-20),
        statusAcompanhamento: "CONCLUIDO",
        analistaResponsavelId: 1,
        segundoAnalistaId: null,
        enviadoParaAnaliseEm: timestamp(-45),
        reenviadoParaAnaliseEm: null,
        analiseIniciadaEm: timestamp(-40),
        analiseConcluidaEm: timestamp(-20),
        ajusteSolicitadoEm: null,
        prazoAjuste: null,
        cicloAcompanhamento: 1,
        emCicloRevisao: false,
    },
]

let riscos: RiscoRecord[] = [
    {
        id: 201,
        nome: "Restrição indevida de competitividade",
        faseProcesso: "Planejamento da contratação",
        tipoRisco: "AMEACA",
        categoriaId: 1,
        tipoRiscoIntegridadeId: 1,
        causa: "Descrição técnica direcionada ou pesquisa de preços insuficiente.",
        consequencias: "Impugnações, atraso na contratação e questionamentos de controle.",
        criadoEm: timestamp(-46),
        atualizadoEm: timestamp(-6),
        processoId: 101,
    },
    {
        id: 202,
        nome: "Atraso na aprovação do termo de referência",
        faseProcesso: "Formalização da demanda",
        tipoRisco: "AMEACA",
        categoriaId: 2,
        tipoRiscoIntegridadeId: null,
        causa: "Baixa disponibilidade dos responsáveis e retrabalho nas especificações.",
        consequencias: "Prorrogação de contratos emergenciais e perda de prazo institucional.",
        criadoEm: timestamp(-43),
        atualizadoEm: timestamp(-5),
        processoId: 101,
    },
    {
        id: 203,
        nome: "Indisponibilidade de serviço crítico",
        faseProcesso: "Execução contratual",
        tipoRisco: "AMEACA",
        categoriaId: 2,
        tipoRiscoIntegridadeId: null,
        causa: "Falhas recorrentes de SLA e baixa redundância operacional.",
        consequencias: "Interrupção de sistemas usados por estudantes e servidores.",
        criadoEm: timestamp(-68),
        atualizadoEm: timestamp(-2),
        processoId: 102,
    },
    {
        id: 204,
        nome: "Realocação eficiente de saldo orçamentário",
        faseProcesso: "Monitoramento",
        tipoRisco: "OPORTUNIDADE",
        categoriaId: 4,
        tipoRiscoIntegridadeId: null,
        causa: "Saldos remanescentes identificados antes do encerramento do exercício.",
        consequencias: "Possibilidade de financiar prioridades emergentes sem suplementação.",
        criadoEm: timestamp(-95),
        atualizadoEm: timestamp(-30),
        processoId: 103,
    },
]

let avaliacoes: AvaliacaoRecord[] = [
    {
        id: 301,
        riscoId: 201,
        probabilidade: 5,
        impacto: 8,
        fac: 0.7,
        controlesPreventivos: "Revisão cruzada da especificação e checklist de pesquisa de preços.",
        controlesAtenuacao: "Acionamento de equipe de apoio para adequação do termo de referência.",
        atualizadoEm: timestamp(-4),
        dataUltimaAvaliacao: day(-4),
    },
    {
        id: 302,
        riscoId: 203,
        probabilidade: 8,
        impacto: 10,
        fac: 0.4,
        controlesPreventivos: "Reuniões mensais de SLA e análise de incidentes críticos.",
        controlesAtenuacao: "Plano de contingência para serviços digitais essenciais.",
        atualizadoEm: timestamp(-1),
        dataUltimaAvaliacao: day(-1),
    },
    {
        id: 303,
        riscoId: 204,
        probabilidade: 5,
        impacto: 5,
        fac: 0.6,
        controlesPreventivos: "Revisões quinzenais de execução e painel de disponibilidade orçamentária.",
        controlesAtenuacao: "Priorização de demandas com maior aderência ao PDI.",
        atualizadoEm: timestamp(-25),
        dataUltimaAvaliacao: day(-25),
    },
]

let respostas: RespostaRecord[] = [
    {
        id: 401,
        riscoId: 201,
        opcaoTratamento: "MITIGAR",
        justificativa: "O risco é relevante e pode ser reduzido com controles preventivos simples.",
        atualizadoEm: timestamp(-4),
    },
    {
        id: 402,
        riscoId: 203,
        opcaoTratamento: "MITIGAR",
        justificativa: "A continuidade dos serviços digitais exige acompanhamento ativo.",
        atualizadoEm: timestamp(-1),
    },
    {
        id: 403,
        riscoId: 204,
        opcaoTratamento: "ACEITAR",
        justificativa: "A oportunidade será monitorada sem necessidade de plano adicional.",
        atualizadoEm: timestamp(-24),
    },
]

let atividades: AtividadeRecord[] = [
    {
        id: 501,
        riscoId: 201,
        statusImplementacao: "EMIMPLEMENTACAO",
        responsavelTratamento: "Diego Alencar",
        dataInicio: day(-8),
        dataTermino: day(20),
        gatilho: "Impugnação do edital ou apontamento da área jurídica.",
        acoesContingencia: "Revisar edital e republicar cronograma com justificativa técnica.",
        responsavelContingencia: "Equipe de compras",
        atualizadoEm: timestamp(-3),
        acoesPreventivas: "Validar termo de referência com checklist de integridade.",
        monitoramentoAcoesPreventivas: "Registro semanal de pendências até a publicação do edital.",
    },
    {
        id: 502,
        riscoId: 203,
        statusImplementacao: "IMPLEMENTADO",
        responsavelTratamento: "Eloísa Rocha",
        dataInicio: day(-30),
        dataTermino: day(-5),
        gatilho: "Indisponibilidade superior a duas horas em serviço crítico.",
        acoesContingencia: "Abrir sala de crise e acionar fornecedor com prioridade máxima.",
        responsavelContingencia: "Coordenação de TI",
        atualizadoEm: timestamp(-1),
        acoesPreventivas: "Revisar relatórios de SLA com o fornecedor.",
        monitoramentoAcoesPreventivas: "Indicadores acompanhados em reunião quinzenal.",
    },
]

let ocorrencias: OcorrenciaRecord[] = [
    {
        id: 601,
        riscoId: 201,
        dataOcorrencia: day(-7),
        responsavelRegistroId: 1,
        responsavelSolucao: "Equipe de compras",
        descricao: "Fornecedor solicitou esclarecimento sobre requisito técnico restritivo.",
        criadoEm: timestamp(-7),
        atualizadoEm: timestamp(-5),
        resultados: "Item revisado antes da publicação final.",
        solucao: "Especificação ajustada e anexada ao processo.",
    },
    {
        id: 602,
        riscoId: 203,
        dataOcorrencia: day(-15),
        responsavelRegistroId: 5,
        responsavelSolucao: "Fornecedor contratado",
        descricao: "Sistema acadêmico ficou indisponível durante janela não programada.",
        criadoEm: timestamp(-15),
        atualizadoEm: timestamp(-14),
        resultados: "Serviço restabelecido e causa registrada.",
        solucao: "Aplicação de correção e reforço do monitoramento.",
    },
]

let siglas = [
    {
        id: 701,
        sigla: "TR",
        descricao: "Termo de Referência",
        processoId: 101,
    },
    {
        id: 702,
        sigla: "SLA",
        descricao: "Acordo de Nível de Serviço",
        processoId: 102,
    },
    {
        id: 703,
        sigla: "PDI",
        descricao: "Plano de Desenvolvimento Institucional",
        processoId: 103,
    },
]

let documentos = [
    {
        id: 801,
        nome: "modelo-plano-gestao-riscos.pdf",
        contentType: "application/pdf",
        criadoEm: timestamp(-30),
    },
    {
        id: 802,
        nome: "checklist-controles.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        criadoEm: timestamp(-12),
    },
]

const documentoBlobs = new Map<number, Blob>()

let prazos: PrazoRecord[] = [
    {
        id: 901,
        anoReferencia: currentYear,
        prazo: day(45),
        limiteAtraso: day(60),
        responsavelId: 1,
        criadoEm: timestamp(-20),
        atualizadoEm: timestamp(-20),
    },
    {
        id: 902,
        anoReferencia: currentYear + 1,
        prazo: `${currentYear + 1}-03-31`,
        limiteAtraso: `${currentYear + 1}-04-15`,
        responsavelId: 1,
        criadoEm: timestamp(-10),
        atualizadoEm: timestamp(-10),
    },
]

let historicos: HistoricoRecord[] = [
    {
        id: 1001,
        processoId: 101,
        tipo: "ENVIO_ANALISE",
        criadoEm: timestamp(-2),
        usuarioId: 4,
        statusAnterior: "RASCUNHO",
        statusNovo: "AGUARDANDO_ANALISE",
        observacao: "Processo enviado para análise no MVP.",
        ciclo: 1,
    },
    {
        id: 1002,
        processoId: 102,
        tipo: "INICIO_ANALISE",
        criadoEm: timestamp(-10),
        usuarioId: 1,
        statusAnterior: "AGUARDANDO_ANALISE",
        statusNovo: "EM_ANALISE",
        observacao: "Análise iniciada pela SecGov.",
        ciclo: 1,
    },
    {
        id: 1003,
        processoId: 103,
        tipo: "CONCLUSAO_ANALISE",
        criadoEm: timestamp(-20),
        usuarioId: 1,
        statusAnterior: "EM_ANALISE",
        statusNovo: "CONCLUIDO",
        observacao: "Processo aprovado para encerramento do ciclo.",
        ciclo: 1,
    },
]

let notificacoes: NotificacaoRecord[] = [
    {
        id: 1101,
        titulo: "Novo processo aguardando análise",
        descricao: "Contratação de serviços terceirizados foi enviada para análise.",
        processoId: 101,
        tipo: "PROCESSO_ENVIADO",
        destino: "ANALISE",
        criadoEm: timestamp(-2),
        lida: false,
    },
    {
        id: 1102,
        titulo: "Documentos oficiais disponíveis",
        descricao: "Novos modelos podem ser usados pelas unidades.",
        processoId: null,
        tipo: "DOCUMENTO",
        destino: "DOCUMENTOS",
        criadoEm: timestamp(-8),
        lida: false,
    },
]

const nextId = {
    unidade: 7,
    usuario: 7,
    processo: 104,
    risco: 205,
    avaliacao: 304,
    resposta: 404,
    atividade: 503,
    ocorrencia: 603,
    categoria: 5,
    tipoIntegridade: 4,
    sigla: 704,
    documento: 803,
    prazo: 903,
    historico: 1004,
    notificacao: 1103,
}

const facOptions = [
    { value: 1, label: "Sem controle efetivo" },
    { value: 0.7, label: "Controle parcial" },
    { value: 0.4, label: "Controle satisfatório" },
    { value: 0.2, label: "Controle robusto" },
]

let installed = false

export function installMockApi() {
    if (installed) return

    installed = true
    axios.defaults.baseURL = ""
    axios.defaults.adapter = async (config) => {
        await wait(120)
        return handleRequest(config as InternalAxiosRequestConfig)
    }
}

function wait(ms: number) {
    return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function handleRequest(config: InternalAxiosRequestConfig): AxiosResponse | Promise<AxiosResponse> {
    const method = (config.method ?? "get").toLowerCase()
    const { path, params } = parseRequestUrl(config.url)
    const segments = path.split("/").filter(Boolean)
    const payload = parsePayload(config.data)

    if (segments[0] === "api" && segments[1] === "documentos") {
        return handleDocumentos(method, segments.slice(2), payload, config)
    }

    if (segments[0] === "dashboard") {
        return ok(config, getDashboardOverview(params))
    }

    if (segments[0] === "acompanhamentos") {
        return handleAcompanhamentos(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "usuarios") {
        return handleUsuarios(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "unidadesOrganizacionais") {
        return handleUnidades(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "processos") {
        return handleProcessos(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "categoriasRisco") {
        return handleCategorias(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "tiposRiscoIntegridade") {
        return handleTiposRiscoIntegridade(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "riscos") {
        return handleRiscos(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "avaliacoesRiscoControle") {
        return handleAvaliacoes(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "respostasRisco") {
        return handleRespostas(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "atividadeControles") {
        return handleAtividades(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "ocorrenciasRisco") {
        return handleOcorrencias(method, segments.slice(1), params, payload, config)
    }

    if (segments[0] === "siglas") {
        return handleSiglas(method, segments.slice(1), params, payload, config)
    }

    return fail(config, 404, `Endpoint mockado não encontrado: ${method.toUpperCase()} ${path}`)
}

function parseRequestUrl(rawUrl = "/") {
    const parsed = new URL(rawUrl, "http://gestao-riscos-mvp.local")
    return {
        path: parsed.pathname.replace(/\/+$/, "") || "/",
        params: parsed.searchParams,
    }
}

function parsePayload(data: unknown): any {
    if (!data) return {}

    if (typeof FormData !== "undefined" && data instanceof FormData) {
        return data
    }

    if (typeof data === "string") {
        try {
            return JSON.parse(data)
        } catch {
            return data
        }
    }

    return data
}

function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
    return {
        data: clone(data),
        status,
        statusText: status === 204 ? "No Content" : "OK",
        headers: {},
        config,
        request: {},
    }
}

function fail(config: InternalAxiosRequestConfig, status: number, data: unknown): never {
    const message = typeof data === "string" ? data : "Erro na API mockada"
    const response: AxiosResponse = {
        data,
        status,
        statusText: String(status),
        headers: {},
        config,
        request: {},
    }

    throw new AxiosError(message, undefined, config, {}, response)
}

function clone<T>(data: T): T {
    if (typeof Blob !== "undefined" && data instanceof Blob) {
        return data
    }

    if (typeof File !== "undefined" && data instanceof File) {
        return data
    }

    return JSON.parse(JSON.stringify(data)) as T
}

function numberParam(params: URLSearchParams, name: string, fallback: number) {
    const value = Number(params.get(name))
    return Number.isFinite(value) ? value : fallback
}

function pageOf<T>(items: T[], params: URLSearchParams, mode: PageMode) {
    const fallbackPage = mode === "zero" ? 0 : 1
    const rawPage = numberParam(params, "page", fallbackPage)
    const size = Math.max(numberParam(params, "size", 10), 1)
    const pageIndex = mode === "zero" ? Math.max(rawPage, 0) : Math.max(rawPage - 1, 0)
    const start = pageIndex * size

    return {
        content: items.slice(start, start + size),
        totalPages: Math.max(Math.ceil(items.length / size), 1),
        totalElements: items.length,
        size,
        number: rawPage,
    }
}

function normalize(value: unknown) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim()
}

function maybeTextMatch(value: unknown, query: string) {
    if (!query.trim()) return true
    return normalize(value).includes(normalize(query))
}

function getId(value: unknown): number | null {
    if (value == null || value === "") return null
    if (typeof value === "object") {
        const candidate = (value as JsonRecord).id
        return candidate == null ? null : Number(candidate)
    }
    return Number(value)
}

function unidadeRecord(id?: number | null) {
    return unidades.find((unidade) => unidade.id === id) ?? null
}

function usuarioRecord(id?: number | null) {
    return usuarios.find((usuario) => usuario.id === id) ?? null
}

function processoRecord(id?: number | null) {
    return processos.find((processo) => processo.id === id) ?? null
}

function riscoRecord(id?: number | null) {
    return riscos.find((risco) => risco.id === id) ?? null
}

function categoriaRecord(id?: number | null) {
    return categorias.find((categoria) => categoria.id === id) ?? null
}

function tipoIntegridadeRecord(id?: number | null) {
    return tiposRiscoIntegridade.find((tipo) => tipo.id === id) ?? null
}

function unidadeRef(id?: number | null): JsonRecord | null {
    const unidade = unidadeRecord(id)
    if (!unidade) return null

    return {
        id: unidade.id,
        codigo: unidade.codigo,
        nome: unidade.nome,
        sigla: unidade.sigla,
        isAdmin: unidade.isAdmin,
        tipoUnidade: unidade.tipoUnidade,
        unidadeOrganizacionalPai: unidade.parentId ? unidadeRef(unidade.parentId) : undefined,
        unidadesOrganizacionais: [],
        usuarios: [],
        processos: [],
        criadoEm: unidade.criadoEm,
        atualizadoEm: unidade.atualizadoEm,
    }
}

function unidadeResponse(unidade: UnidadeRecord): JsonRecord {
    return {
        ...unidadeRef(unidade.id),
        unidadesOrganizacionais: unidades
            .filter((child) => child.parentId === unidade.id)
            .map((child) => unidadeRef(child.id)),
        usuarios: usuarios
            .filter((usuario) => usuario.unidadeId === unidade.id)
            .map((usuario) => usuarioResponse(usuario, false)),
        processos: processos
            .filter((processo) => processo.unidadeId === unidade.id)
            .map((processo) => processoRef(processo.id)),
    }
}

function usuarioResumo(id?: number | null) {
    const usuario = usuarioRecord(id)
    if (!usuario) return null

    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
    }
}

function usuarioResponse(usuario: UsuarioRecord, includeUnidade = true): JsonRecord {
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senha: usuario.senha,
        cargo: usuario.cargo,
        papel: usuario.papel,
        funcaoKeycloak: usuario.funcaoKeycloak,
        unidadeOrganizacional: includeUnidade ? unidadeRef(usuario.unidadeId) : null,
        idKeycloak: usuario.idKeycloak,
        ativo: usuario.ativo,
        nomeSocial: usuario.nomeSocial ?? "",
    }
}

function categoriaResponse(id?: number | null) {
    const categoria = categoriaRecord(id)
    if (!categoria) return null
    return { ...categoria, risco: [] }
}

function tipoIntegridadeResponse(id?: number | null) {
    const tipo = tipoIntegridadeRecord(id)
    if (!tipo) return null
    return { ...tipo, riscos: [] }
}

function processoRef(id?: number | null): JsonRecord | null {
    const processo = processoRecord(id)
    if (!processo) return null
    const responsavel = usuarioRecord(processo.responsavelId)
    const analistaResponsavel = usuarioRecord(processo.analistaResponsavelId)
    const segundoAnalista = usuarioRecord(processo.segundoAnalistaId)

    return {
        id: processo.id,
        nome: processo.nome,
        unidadeOrganizacional: unidadeRef(processo.unidadeId),
        responsavel: responsavel ? usuarioResponse(responsavel, false) : null,
        objetivosGerais: processo.objetivosGerais,
        objetivosEstrategicos: processo.objetivosEstrategicos,
        criadoEm: processo.criadoEm,
        atualizadoEm: processo.atualizadoEm,
        dataConclusao: processo.dataConclusao,
        statusAcompanhamento: processo.statusAcompanhamento,
        analistaResponsavel: analistaResponsavel ? usuarioResponse(analistaResponsavel, false) : null,
        segundoAnalista: segundoAnalista ? usuarioResponse(segundoAnalista, false) : null,
        enviadoParaAnaliseEm: processo.enviadoParaAnaliseEm,
        reenviadoParaAnaliseEm: processo.reenviadoParaAnaliseEm,
        analiseIniciadaEm: processo.analiseIniciadaEm,
        analiseConcluidaEm: processo.analiseConcluidaEm,
        ajusteSolicitadoEm: processo.ajusteSolicitadoEm,
        prazoAjuste: processo.prazoAjuste,
        cicloAcompanhamento: processo.cicloAcompanhamento,
        emCicloRevisao: processo.emCicloRevisao,
        ...prazoEnvioFields(processo),
        riscos: [],
    }
}

function processoResponse(processo: ProcessoRecord): JsonRecord {
    return {
        ...processoRef(processo.id),
        riscos: riscos
            .filter((risco) => risco.processoId === processo.id)
            .map((risco) => riscoResponse(risco, false)),
    }
}

function riscoResponse(risco: RiscoRecord, includeRelated = true): JsonRecord {
    const riscoRespostas = respostas.filter((resposta) => resposta.riscoId === risco.id)

    return {
        id: risco.id,
        nome: risco.nome,
        faseProcesso: risco.faseProcesso,
        tipoRisco: risco.tipoRisco,
        categoria: categoriaResponse(risco.categoriaId),
        tipoRiscoIntegridade: tipoIntegridadeResponse(risco.tipoRiscoIntegridadeId),
        causa: risco.causa,
        consequencias: risco.consequencias,
        criadoEm: risco.criadoEm,
        atualizadoEm: risco.atualizadoEm,
        processo: processoRef(risco.processoId),
        avaliacaoRiscoControle: includeRelated
            ? avaliacoes
                .filter((avaliacao) => avaliacao.riscoId === risco.id)
                .map((avaliacao) => avaliacaoResponse(avaliacao, false))
            : [],
        respostaRisco: includeRelated
            ? riscoRespostas[0]
                ? respostaResponse(riscoRespostas[0], false)
                : null
            : [],
        atividadeControle: includeRelated
            ? atividades
                .filter((atividade) => atividade.riscoId === risco.id)
                .map((atividade) => atividadeResponse(atividade, false))
            : [],
        ocorrenciaRisco: includeRelated
            ? ocorrencias
                .filter((ocorrencia) => ocorrencia.riscoId === risco.id)
                .map((ocorrencia) => ocorrenciaResponse(ocorrencia, false))
            : [],
    }
}

function avaliacaoResponse(avaliacao: AvaliacaoRecord, includeRisk = true): JsonRecord {
    return {
        id: avaliacao.id,
        risco: includeRisk ? riscoResponse(riscoRecord(avaliacao.riscoId)!, false) : { id: avaliacao.riscoId },
        probabilidade: avaliacao.probabilidade,
        impacto: avaliacao.impacto,
        fac: avaliacao.fac,
        controlesPreventivos: avaliacao.controlesPreventivos,
        controlesAtenuacao: avaliacao.controlesAtenuacao,
        atualizadoEm: avaliacao.atualizadoEm,
        dataUltimaAvaliacao: avaliacao.dataUltimaAvaliacao,
    }
}

function respostaResponse(resposta: RespostaRecord, includeRisk = true): JsonRecord {
    return {
        id: resposta.id,
        risco: includeRisk ? riscoResponse(riscoRecord(resposta.riscoId)!, false) : { id: resposta.riscoId },
        opcaoTratamento: resposta.opcaoTratamento,
        justificativa: resposta.justificativa,
        atualizadoEm: resposta.atualizadoEm,
    }
}

function atividadeResponse(atividade: AtividadeRecord, includeRisk = true): JsonRecord {
    return {
        id: atividade.id,
        statusImplementacao: atividade.statusImplementacao,
        responsavelTratamento: atividade.responsavelTratamento,
        dataInicio: atividade.dataInicio,
        dataTermino: atividade.dataTermino,
        gatilho: atividade.gatilho,
        acoesContingencia: atividade.acoesContingencia,
        responsavelContingencia: atividade.responsavelContingencia,
        risco: includeRisk ? riscoResponse(riscoRecord(atividade.riscoId)!, true) : { id: atividade.riscoId },
        atualizadoEm: atividade.atualizadoEm,
        acoesPreventivas: atividade.acoesPreventivas,
        monitoramentoAcoesPreventivas: atividade.monitoramentoAcoesPreventivas,
    }
}

function ocorrenciaResponse(ocorrencia: OcorrenciaRecord, includeRisk = true): JsonRecord {
    return {
        id: ocorrencia.id,
        risco: includeRisk ? riscoResponse(riscoRecord(ocorrencia.riscoId)!, false) : { id: ocorrencia.riscoId },
        dataOcorrencia: ocorrencia.dataOcorrencia,
        responsavelRegistro: usuarioResponse(usuarioRecord(ocorrencia.responsavelRegistroId)!, false),
        responsavelSolucao: ocorrencia.responsavelSolucao,
        descricao: ocorrencia.descricao,
        criadoEm: ocorrencia.criadoEm,
        atualizadoEm: ocorrencia.atualizadoEm,
        resultados: ocorrencia.resultados,
        solucao: ocorrencia.solucao,
    }
}

function siglaResponse(sigla: { id: number; sigla: string; descricao: string; processoId: number }) {
    return {
        id: sigla.id,
        sigla: sigla.sigla,
        descricao: sigla.descricao,
        processo: { id: sigla.processoId },
    }
}

function prazoResponse(prazo: PrazoRecord) {
    const hoje = day()

    return {
        id: prazo.id,
        anoReferencia: prazo.anoReferencia,
        prazo: prazo.prazo,
        limiteAtraso: prazo.limiteAtraso,
        responsavel: usuarioResumo(prazo.responsavelId),
        criadoEm: prazo.criadoEm,
        atualizadoEm: prazo.atualizadoEm,
        prazoProximo: prazo.prazo >= hoje && prazo.prazo <= day(15),
        prazoVencido: prazo.prazo < hoje,
        prazoAtrasoVencido: prazo.limiteAtraso < hoje,
    }
}

function historicoResponse(historico: HistoricoRecord) {
    return {
        id: historico.id,
        tipo: historico.tipo,
        criadoEm: historico.criadoEm,
        usuario: usuarioResumo(historico.usuarioId),
        statusAnterior: historico.statusAnterior,
        statusNovo: historico.statusNovo,
        observacao: historico.observacao,
        ciclo: historico.ciclo,
    }
}

function notificacaoResponse(notificacao: NotificacaoRecord) {
    return {
        id: notificacao.id,
        titulo: notificacao.titulo,
        descricao: notificacao.descricao,
        processoId: notificacao.processoId,
        processoNome: processoRecord(notificacao.processoId)?.nome ?? null,
        tipo: notificacao.tipo,
        destino: notificacao.destino,
        criadoEm: notificacao.criadoEm,
        lida: notificacao.lida,
    }
}

function prazoEnvioFields(processo: ProcessoRecord) {
    const prazo = prazos.find((item) => item.anoReferencia === currentYear) ?? prazos[0]
    const envioPendente =
        processo.statusAcompanhamento === "RASCUNHO" ||
        processo.statusAcompanhamento === "PENDENTE_REVISAO"

    return {
        anoReferenciaPrazoEnvio: prazo?.anoReferencia ?? null,
        prazoEnvio: prazo?.prazo ?? null,
        limiteAtrasoPrazoEnvio: prazo?.limiteAtraso ?? null,
        envioPendente,
        envioAtrasado: envioPendente && Boolean(prazo?.limiteAtraso && prazo.limiteAtraso < day()),
    }
}

function findRootUnidade(unidadeId: number | null) {
    let unidade = unidadeRecord(unidadeId)
    while (unidade?.parentId) {
        unidade = unidadeRecord(unidade.parentId)
    }
    return unidade
}

function isUnitInScope(unidadeId: number, scopeId?: number | null) {
    if (!scopeId) return true

    let unidade = unidadeRecord(unidadeId)
    while (unidade) {
        if (unidade.id === scopeId) return true
        unidade = unidade.parentId ? unidadeRecord(unidade.parentId) : null
    }

    return false
}

function acompanhamentoResumo(processo: ProcessoRecord) {
    const unidadeDoProcesso = unidadeRecord(processo.unidadeId)
    const unidadeRaiz = findRootUnidade(processo.unidadeId) ?? unidadeDoProcesso
    const setor = unidadeDoProcesso?.parentId ? unidadeDoProcesso : null

    return {
        id: processo.id,
        nome: processo.nome,
        unidadeId: unidadeRaiz?.id ?? null,
        unidadeNome: unidadeRaiz?.nome ?? null,
        unidadeSigla: unidadeRaiz?.sigla ?? null,
        setorId: setor?.id ?? null,
        setorNome: setor?.nome ?? null,
        setorSigla: setor?.sigla ?? null,
        responsavelId: processo.responsavelId,
        responsavelNome: usuarioRecord(processo.responsavelId)?.nome ?? null,
        analistaResponsavel: usuarioResumo(processo.analistaResponsavelId),
        segundoAnalista: usuarioResumo(processo.segundoAnalistaId),
        statusAcompanhamento: processo.statusAcompanhamento,
        enviadoParaAnaliseEm: processo.enviadoParaAnaliseEm,
        reenviadoParaAnaliseEm: processo.reenviadoParaAnaliseEm,
        analiseIniciadaEm: processo.analiseIniciadaEm,
        analiseConcluidaEm: processo.analiseConcluidaEm,
        ajusteSolicitadoEm: processo.ajusteSolicitadoEm,
        prazoAjuste: processo.prazoAjuste,
        alertaPrazoAjuste: Boolean(processo.prazoAjuste && processo.prazoAjuste <= day(5)),
        prazoAjusteVencido: Boolean(processo.prazoAjuste && processo.prazoAjuste < day()),
        emCicloRevisao: processo.emCicloRevisao,
        cicloAcompanhamento: processo.cicloAcompanhamento,
        acoesDisponiveis: acoesDisponiveis(processo),
        ...prazoEnvioFields(processo),
    }
}

function acoesDisponiveis(processo: ProcessoRecord): string[] {
    const common = ["VER_HISTORICO", "VER_DOCUMENTOS"]

    if (processo.statusAcompanhamento === "AGUARDANDO_ANALISE") {
        return ["ATRIBUIR_ANALISTA", "INICIAR_ANALISE", "CANCELAR_ENVIO", ...common]
    }

    if (processo.statusAcompanhamento === "EM_ANALISE") {
        return ["SOLICITAR_AJUSTES", "FINALIZAR_ANALISE", "CANCELAR_ANALISE", ...common]
    }

    if (processo.statusAcompanhamento === "CONCLUIDO") {
        return ["INICIAR_REVISAO", ...common]
    }

    return common
}

function filterProcessos(params: URLSearchParams) {
    const nome = params.get("name") ?? params.get("nome") ?? ""
    const dataInicial = params.get("initialDate") ?? params.get("dataInicial") ?? ""
    const dataFinal = params.get("finalDate") ?? params.get("dataFinal") ?? ""
    const unidadeId = getId(params.get("unit") ?? params.get("unidadeId"))
    const status = params.get("status") ?? ""
    const analistaId = getId(params.get("analistaId"))

    return processos
        .filter((processo) => maybeTextMatch(processo.nome, nome))
        .filter((processo) => !dataInicial || processo.criadoEm.slice(0, 10) >= dataInicial)
        .filter((processo) => !dataFinal || processo.criadoEm.slice(0, 10) <= dataFinal)
        .filter((processo) => isUnitInScope(processo.unidadeId, unidadeId))
        .filter((processo) => !status || processo.statusAcompanhamento === status)
        .filter(
            (processo) =>
                !analistaId ||
                processo.analistaResponsavelId === analistaId ||
                processo.segundoAnalistaId === analistaId
        )
}

function filterRiscosByProcesso(processoId: number, riscoName = "") {
    return riscos
        .filter((risco) => risco.processoId === processoId)
        .filter((risco) => maybeTextMatch(risco.nome, riscoName))
}

function getDashboardOverview(params: URLSearchParams) {
    const filteredProcessos = filterProcessos(params)
    const processoIds = new Set(filteredProcessos.map((processo) => processo.id))
    const filteredRiscos = riscos.filter((risco) => processoIds.has(risco.processoId))
    const riscoIds = new Set(filteredRiscos.map((risco) => risco.id))

    return {
        processesCount: filteredProcessos.length,
        risksCount: filteredRiscos.length,
        occurrencesCount: ocorrencias.filter((ocorrencia) => riscoIds.has(ocorrencia.riscoId))
            .length,
    }
}

function getMatrixData(params: URLSearchParams) {
    const weights = [1, 2, 5, 8, 10]
    const matrix = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0))
    const processoIds = new Set(filterProcessos(params).map((processo) => processo.id))

    avaliacoes.forEach((avaliacao) => {
        const risco = riscoRecord(avaliacao.riscoId)
        if (!risco || !processoIds.has(risco.processoId)) return

        const row = weights.indexOf(avaliacao.probabilidade)
        const col = weights.indexOf(avaliacao.impacto)
        if (row >= 0 && col >= 0) {
            matrix[row]![col]! += 1
        }
    })

    return matrix
}

function handleDocumentos(
    method: string,
    segments: string[],
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments.length === 0) {
        return ok(config, documentos.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)))
    }

    if (method === "post" && segments[0] === "upload") {
        const file = typeof FormData !== "undefined" && payload instanceof FormData
            ? payload.get("file")
            : null
        const id = nextId.documento++
        const nome = file instanceof File ? file.name : `documento-mvp-${id}.txt`
        const contentType = file instanceof File ? file.type || "application/octet-stream" : "text/plain"
        const documento = { id, nome, contentType, criadoEm: timestamp() }

        documentos = [documento, ...documentos]
        if (file instanceof Blob) documentoBlobs.set(id, file)
        return ok(config, documento, 201)
    }

    const id = Number(segments[0])
    if (method === "get" && Number.isFinite(id)) {
        const documento = documentos.find((item) => item.id === id)
        if (!documento) return fail(config, 404, "Documento não encontrado.")

        const blob =
            documentoBlobs.get(id) ??
            new Blob([`Conteúdo demonstrativo do documento ${documento.nome}.`], {
                type: documento.contentType || "text/plain",
            })

        return ok(config, blob)
    }

    if (method === "delete" && Number.isFinite(id)) {
        documentos = documentos.filter((documento) => documento.id !== id)
        documentoBlobs.delete(id)
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de documentos não encontrada.")
}

function handleUsuarios(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "search" && segments[1] === "findUserIdByKeycloakId") {
        const idKeycloak = params.get("idKeycloak")
        return ok(config, usuarios.find((usuario) => usuario.idKeycloak === idKeycloak)?.id ?? 1)
    }

    if (method === "get" && segments[0] === "responsaveis") {
        const unidadeId = Number(segments[1])
        return ok(
            config,
            usuarios
                .filter((usuario) => usuario.ativo && usuario.unidadeId === unidadeId)
                .map((usuario) => usuarioResponse(usuario))
        )
    }

    if (method === "get" && segments[0] === "withoutUO") {
        return ok(
            config,
            usuarios
                .filter((usuario) => usuario.ativo && !usuario.unidadeId)
                .map((usuario) => usuarioResponse(usuario))
        )
    }

    if (method === "get" && segments[0] === "papeis-disponiveis") {
        return ok(config, [
            { value: "gestor", label: "Gestor", padrao: true },
            { value: "colaborador", label: "Colaborador", padrao: false },
        ])
    }

    if (method === "get" && segments[0] === "byId") {
        const usuario = usuarioRecord(Number(segments[1]))
        if (!usuario) return fail(config, 404, "Usuário não encontrado.")
        return ok(config, usuarioResponse(usuario))
    }

    if (method === "get" && segments.length === 1) {
        const usuario = usuarios.find((item) => item.idKeycloak === segments[0])
        if (!usuario) return fail(config, 404, "Usuário não encontrado.")
        return ok(config, usuarioResponse(usuario))
    }

    if (method === "get" && segments.length === 0) {
        return ok(config, pageOf(usuarios.map((usuario) => usuarioResponse(usuario)), params, "zero"))
    }

    if (method === "put" && segments[0] === "update") {
        const usuario =
            usuarioRecord(getId(payload.id)) ??
            usuarios.find((item) => item.idKeycloak === payload.idKeycloak) ??
            usuarioRecord(1)

        if (!usuario) return fail(config, 404, "Usuário não encontrado.")

        usuario.nome = payload.nome ?? usuario.nome
        usuario.email = payload.email ?? usuario.email
        usuario.nomeSocial = payload.nomeSocial ?? usuario.nomeSocial
        usuario.cargo = payload.cargo ?? usuario.cargo
        usuario.papel = payload.papel ?? payload.papeis?.[0] ?? usuario.papel
        usuario.funcaoKeycloak = payload.funcaoKeycloak ?? usuario.funcaoKeycloak

        if ("unidadeOrganizacional" in payload) {
            usuario.unidadeId = getId(payload.unidadeOrganizacional)
            if (!usuario.unidadeId) {
                usuario.papel = null
                usuario.funcaoKeycloak = null
            }
        }

        notifyDataChanged("usuarios")
        return ok(config, usuarioResponse(usuario))
    }

    if (method === "patch" && segments[1] === "updatePassword") {
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de usuários não encontrada.")
}

function handleUnidades(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "children") {
        return ok(config, unidades.map((unidade) => unidadeResponse(unidade)))
    }

    if (method === "get" && segments.length === 0) {
        return ok(config, pageOf(unidades.map((unidade) => unidadeResponse(unidade)), params, "zero"))
    }

    if (method === "post" && segments.length === 0) {
        const id = nextId.unidade++
        const record: UnidadeRecord = {
            id,
            codigo: payload.codigo ?? null,
            nome: payload.nome ?? `Unidade ${id}`,
            sigla: payload.sigla ?? `UND${id}`,
            isAdmin: Boolean(payload.isAdmin),
            tipoUnidade: payload.tipoUnidade ?? "UNIDADE_ADMINISTRATIVA",
            parentId: getId(payload.unidadeOrganizacionalPai),
            criadoEm: timestamp(),
            atualizadoEm: timestamp(),
        }
        unidades.push(record)
        notifyDataChanged("unidades")
        return ok(config, unidadeResponse(record), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = unidadeRecord(id)
        if (!record) return fail(config, 404, "Unidade não encontrada.")

        record.codigo = payload.codigo ?? record.codigo
        record.nome = payload.nome ?? record.nome
        record.sigla = payload.sigla ?? record.sigla
        record.isAdmin = "isAdmin" in payload ? Boolean(payload.isAdmin) : record.isAdmin
        record.tipoUnidade = payload.tipoUnidade ?? record.tipoUnidade
        record.parentId = "unidadeOrganizacionalPai" in payload
            ? getId(payload.unidadeOrganizacionalPai)
            : record.parentId
        record.atualizadoEm = timestamp()

        notifyDataChanged("unidades")
        return ok(config, unidadeResponse(record))
    }

    if (method === "delete" && Number.isFinite(id)) {
        deleteUnidadeCascade(id)
        notifyDataChanged("unidades")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de unidades não encontrada.")
}

function handleProcessos(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[1] === "export" && segments[2] === "xlsx") {
        const processo = processoRecord(Number(segments[0]))
        if (!processo) return fail(config, 404, "Processo não encontrado.")

        const blob = new Blob([`Planilha demonstrativa do processo: ${processo.nome}`], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        return ok(config, blob)
    }

    if (method === "get" && segments.length === 1 && segments[0] !== "filter") {
        const processo = processoRecord(Number(segments[0]))
        if (!processo) return fail(config, 404, "Processo não encontrado.")
        return ok(config, processoResponse(processo))
    }

    if (method === "get") {
        return ok(config, pageOf(filterProcessos(params).map(processoResponse), params, "one"))
    }

    if (method === "post" && segments.length === 0) {
        const id = nextId.processo++
        const unidadeId = getId(payload.unidadeOrganizacional) ?? 1
        const responsavelId = getId(payload.responsavel) ?? 1
        const record: ProcessoRecord = {
            id,
            nome: payload.nome ?? `Processo ${id}`,
            unidadeId,
            responsavelId,
            objetivosGerais: payload.objetivosGerais ?? "",
            objetivosEstrategicos: payload.objetivosEstrategicos ?? "",
            criadoEm: timestamp(),
            atualizadoEm: timestamp(),
            dataConclusao: "",
            statusAcompanhamento: "RASCUNHO",
            analistaResponsavelId: null,
            segundoAnalistaId: null,
            enviadoParaAnaliseEm: null,
            reenviadoParaAnaliseEm: null,
            analiseIniciadaEm: null,
            analiseConcluidaEm: null,
            ajusteSolicitadoEm: null,
            prazoAjuste: null,
            cicloAcompanhamento: 1,
            emCicloRevisao: false,
        }

        processos.push(record)
        notifyDataChanged("processos")
        return ok(config, processoResponse(record), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = processoRecord(id)
        if (!record) return fail(config, 404, "Processo não encontrado.")

        record.nome = payload.nome ?? record.nome
        record.unidadeId = getId(payload.unidadeOrganizacional) ?? record.unidadeId
        record.responsavelId = getId(payload.responsavel) ?? record.responsavelId
        record.objetivosGerais = payload.objetivosGerais ?? record.objetivosGerais
        record.objetivosEstrategicos = payload.objetivosEstrategicos ?? record.objetivosEstrategicos
        record.atualizadoEm = timestamp()
        notifyDataChanged("processos")
        return ok(config, processoResponse(record))
    }

    if (method === "delete" && Number.isFinite(id)) {
        deleteProcessoCascade(id)
        notifyDataChanged("processos")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de processos não encontrada.")
}

function handleCategorias(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get") {
        return ok(
            config,
            pageOf(categorias.map((categoria) => categoriaResponse(categoria.id)), params, "zero")
        )
    }

    if (method === "post") {
        if (categorias.some((categoria) => normalize(categoria.nome) === normalize(payload.nome))) {
            return fail(config, 409, "Já existe uma categoria com esse nome.")
        }

        const categoria = {
            id: nextId.categoria++,
            nome: payload.nome ?? "Nova categoria",
            persistente: false,
        }
        categorias.push(categoria)
        notifyDataChanged("categorias")
        return ok(config, categoriaResponse(categoria.id), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const categoria = categoriaRecord(id)
        if (!categoria) return fail(config, 404, "Categoria não encontrada.")
        if (categoria.persistente) return fail(config, 409, "Esta categoria não pode ser editada.")

        categoria.nome = payload.nome ?? categoria.nome
        notifyDataChanged("categorias")
        return ok(config, categoriaResponse(categoria.id))
    }

    if (method === "delete" && Number.isFinite(id)) {
        const categoria = categoriaRecord(id)
        if (!categoria) return fail(config, 404, "Categoria não encontrada.")
        if (categoria.persistente) return fail(config, 409, "Esta categoria não pode ser excluída.")
        categorias = categorias.filter((item) => item.id !== id)
        notifyDataChanged("categorias")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de categorias não encontrada.")
}

function handleTiposRiscoIntegridade(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get") {
        return ok(
            config,
            pageOf(
                tiposRiscoIntegridade.map((tipo) => tipoIntegridadeResponse(tipo.id)),
                params,
                "zero"
            )
        )
    }

    if (method === "post") {
        const tipo = { id: nextId.tipoIntegridade++, nome: payload.nome ?? "Novo tipo" }
        tiposRiscoIntegridade.push(tipo)
        return ok(config, tipoIntegridadeResponse(tipo.id), 201)
    }

    const id = Number(segments[0])
    if (method === "put" && Number.isFinite(id)) {
        const tipo = tipoIntegridadeRecord(id)
        if (!tipo) return fail(config, 404, "Tipo de risco não encontrado.")
        tipo.nome = payload.nome ?? tipo.nome
        return ok(config, tipoIntegridadeResponse(tipo.id))
    }

    if (method === "delete" && Number.isFinite(id)) {
        tiposRiscoIntegridade = tiposRiscoIntegridade.filter((tipo) => tipo.id !== id)
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de tipos de risco não encontrada.")
}

function handleRiscos(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "processo") {
        const processoId = Number(segments[1])
        const riscoName = params.get("riscoName") ?? ""
        return ok(
            config,
            pageOf(
                filterRiscosByProcesso(processoId, riscoName).map((risco) => riscoResponse(risco, true)),
                params,
                "one"
            )
        )
    }

    if (method === "get" && segments[0]?.startsWith("without")) {
        const processoId = Number(segments[1])
        const riscoName = params.get("riscoName") ?? ""
        const base = filterRiscosByProcesso(processoId, riscoName)

        const filtered = base.filter((risco) => {
            if (segments[0] === "withoutAvaliacao") {
                return !avaliacoes.some((avaliacao) => avaliacao.riscoId === risco.id)
            }
            if (segments[0] === "withoutResposta") {
                return !respostas.some((resposta) => resposta.riscoId === risco.id)
            }
            if (segments[0] === "withoutAtividade") {
                return !atividades.some((atividade) => atividade.riscoId === risco.id)
            }
            return false
        })

        return ok(config, filtered.map((risco) => riscoResponse(risco, true)))
    }

    if (method === "post") {
        const id = nextId.risco++
        const record: RiscoRecord = {
            id,
            nome: payload.nome ?? `Risco ${id}`,
            faseProcesso: payload.faseProcesso ?? "",
            tipoRisco: payload.tipoRisco ?? "AMEACA",
            categoriaId: getId(payload.categoria) ?? 2,
            tipoRiscoIntegridadeId: getId(payload.tipoRiscoIntegridade),
            causa: payload.causa ?? "",
            consequencias: payload.consequencias ?? "",
            criadoEm: timestamp(),
            atualizadoEm: timestamp(),
            processoId: getId(payload.processo) ?? processos[0]!.id,
        }
        riscos.push(record)
        touchProcesso(record.processoId)
        notifyDataChanged("riscos")
        return ok(config, riscoResponse(record, true), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = riscoRecord(id)
        if (!record) return fail(config, 404, "Risco não encontrado.")

        record.nome = payload.nome ?? record.nome
        record.faseProcesso = payload.faseProcesso ?? record.faseProcesso
        record.tipoRisco = payload.tipoRisco ?? record.tipoRisco
        record.categoriaId = getId(payload.categoria) ?? record.categoriaId
        record.tipoRiscoIntegridadeId = getId(payload.tipoRiscoIntegridade)
        record.causa = payload.causa ?? record.causa
        record.consequencias = payload.consequencias ?? record.consequencias
        record.processoId = getId(payload.processo) ?? record.processoId
        record.atualizadoEm = timestamp()
        touchProcesso(record.processoId)
        notifyDataChanged("riscos")
        return ok(config, riscoResponse(record, true))
    }

    if (method === "delete" && Number.isFinite(id)) {
        deleteRiscoCascade(id)
        notifyDataChanged("riscos")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de riscos não encontrada.")
}

function handleAvaliacoes(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "opcoes-fac") {
        return ok(config, facOptions)
    }

    if (method === "get" && segments[0] === "matrix") {
        return ok(config, getMatrixData(params))
    }

    if (method === "get" && segments[0] === "processo") {
        const processoId = Number(segments[1])
        const riscoName = params.get("riscoName") ?? ""
        const riscoIds = new Set(filterRiscosByProcesso(processoId, riscoName).map((risco) => risco.id))

        return ok(
            config,
            pageOf(
                avaliacoes
                    .filter((avaliacao) => riscoIds.has(avaliacao.riscoId))
                    .map((avaliacao) => avaliacaoResponse(avaliacao)),
                params,
                "one"
            )
        )
    }

    if (method === "post") {
        const riscoId = getId(payload.risco) ?? 0
        const record: AvaliacaoRecord = {
            id: nextId.avaliacao++,
            riscoId,
            probabilidade: Number(payload.probabilidade ?? 1),
            impacto: Number(payload.impacto ?? 1),
            fac: Number(payload.fac ?? 1),
            controlesPreventivos: payload.controlesPreventivos ?? "",
            controlesAtenuacao: payload.controlesAtenuacao ?? "",
            atualizadoEm: timestamp(),
            dataUltimaAvaliacao: payload.dataUltimaAvaliacao ?? day(),
        }
        avaliacoes = avaliacoes.filter((avaliacao) => avaliacao.riscoId !== riscoId)
        avaliacoes.push(record)
        touchFromRisco(riscoId)
        notifyDataChanged("avaliacoes")
        return ok(config, avaliacaoResponse(record), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = avaliacoes.find((avaliacao) => avaliacao.id === id)
        if (!record) return fail(config, 404, "Avaliação não encontrada.")

        record.probabilidade = Number(payload.probabilidade ?? record.probabilidade)
        record.impacto = Number(payload.impacto ?? record.impacto)
        record.fac = Number(payload.fac ?? record.fac)
        record.controlesPreventivos = payload.controlesPreventivos ?? record.controlesPreventivos
        record.controlesAtenuacao = payload.controlesAtenuacao ?? record.controlesAtenuacao
        record.dataUltimaAvaliacao = payload.dataUltimaAvaliacao ?? record.dataUltimaAvaliacao
        record.atualizadoEm = timestamp()
        touchFromRisco(record.riscoId)
        notifyDataChanged("avaliacoes")
        return ok(config, avaliacaoResponse(record))
    }

    if (method === "delete" && Number.isFinite(id)) {
        avaliacoes = avaliacoes.filter((avaliacao) => avaliacao.id !== id)
        notifyDataChanged("avaliacoes")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de avaliações não encontrada.")
}

function handleRespostas(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "processo") {
        const processoId = Number(segments[1])
        const riscoName = params.get("riscoName") ?? ""
        const riscoIds = new Set(filterRiscosByProcesso(processoId, riscoName).map((risco) => risco.id))

        return ok(
            config,
            pageOf(
                respostas
                    .filter((resposta) => riscoIds.has(resposta.riscoId))
                    .map((resposta) => respostaResponse(resposta)),
                params,
                "one"
            )
        )
    }

    if (method === "post") {
        const riscoId = getId(payload.risco) ?? 0
        const record: RespostaRecord = {
            id: nextId.resposta++,
            riscoId,
            opcaoTratamento: payload.opcaoTratamento ?? "MITIGAR",
            justificativa: payload.justificativa ?? "",
            atualizadoEm: timestamp(),
        }
        respostas = respostas.filter((resposta) => resposta.riscoId !== riscoId)
        respostas.push(record)
        if (record.opcaoTratamento === "ACEITAR") {
            atividades = atividades.filter((atividade) => atividade.riscoId !== riscoId)
        }
        touchFromRisco(riscoId)
        notifyDataChanged("respostas")
        return ok(config, respostaResponse(record), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = respostas.find((resposta) => resposta.id === id)
        if (!record) return fail(config, 404, "Resposta não encontrada.")

        record.opcaoTratamento = payload.opcaoTratamento ?? record.opcaoTratamento
        record.justificativa = payload.justificativa ?? record.justificativa
        record.atualizadoEm = timestamp()
        if (record.opcaoTratamento === "ACEITAR") {
            atividades = atividades.filter((atividade) => atividade.riscoId !== record.riscoId)
        }
        touchFromRisco(record.riscoId)
        notifyDataChanged("respostas")
        return ok(config, respostaResponse(record))
    }

    if (method === "delete" && Number.isFinite(id)) {
        respostas = respostas.filter((resposta) => resposta.id !== id)
        notifyDataChanged("respostas")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de respostas não encontrada.")
}

function handleAtividades(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "delete" && segments[0] === "risco") {
        const riscoId = Number(segments[1])
        atividades = atividades.filter((atividade) => atividade.riscoId !== riscoId)
        touchFromRisco(riscoId)
        notifyDataChanged("atividades")
        return ok(config, null, 204)
    }

    if (method === "get" && segments[0] === "processo") {
        const processoId = Number(segments[1])
        const riscoName = params.get("riscoName") ?? ""
        const riscoIds = new Set(filterRiscosByProcesso(processoId, riscoName).map((risco) => risco.id))

        return ok(
            config,
            pageOf(
                atividades
                    .filter((atividade) => riscoIds.has(atividade.riscoId))
                    .map((atividade) => atividadeResponse(atividade)),
                params,
                "one"
            )
        )
    }

    if (method === "post") {
        const riscoId = getId(payload.risco) ?? 0
        const record: AtividadeRecord = {
            id: nextId.atividade++,
            riscoId,
            statusImplementacao: payload.statusImplementacao ?? "EMIMPLEMENTACAO",
            responsavelTratamento: payload.responsavelTratamento ?? "",
            dataInicio: payload.dataInicio ?? day(),
            dataTermino: payload.dataTermino ?? day(30),
            gatilho: payload.gatilho ?? "",
            acoesContingencia: payload.acoesContingencia ?? "",
            responsavelContingencia: payload.responsavelContingencia ?? "",
            atualizadoEm: timestamp(),
            acoesPreventivas: payload.acoesPreventivas ?? "",
            monitoramentoAcoesPreventivas: payload.monitoramentoAcoesPreventivas ?? "",
        }
        atividades = atividades.filter((atividade) => atividade.riscoId !== riscoId)
        atividades.push(record)
        touchFromRisco(riscoId)
        notifyDataChanged("atividades")
        return ok(config, atividadeResponse(record), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = atividades.find((atividade) => atividade.id === id)
        if (!record) return fail(config, 404, "Atividade não encontrada.")

        record.statusImplementacao = payload.statusImplementacao ?? record.statusImplementacao
        record.responsavelTratamento = payload.responsavelTratamento ?? record.responsavelTratamento
        record.dataInicio = payload.dataInicio ?? record.dataInicio
        record.dataTermino = payload.dataTermino ?? record.dataTermino
        record.gatilho = payload.gatilho ?? record.gatilho
        record.acoesContingencia = payload.acoesContingencia ?? record.acoesContingencia
        record.responsavelContingencia = payload.responsavelContingencia ?? record.responsavelContingencia
        record.acoesPreventivas = payload.acoesPreventivas ?? record.acoesPreventivas
        record.monitoramentoAcoesPreventivas =
            payload.monitoramentoAcoesPreventivas ?? record.monitoramentoAcoesPreventivas
        record.atualizadoEm = timestamp()
        touchFromRisco(record.riscoId)
        notifyDataChanged("atividades")
        return ok(config, atividadeResponse(record))
    }

    if (method === "delete" && Number.isFinite(id)) {
        atividades = atividades.filter((atividade) => atividade.id !== id)
        notifyDataChanged("atividades")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de atividades não encontrada.")
}

function handleOcorrencias(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "risco") {
        const riscoId = Number(segments[1])
        return ok(
            config,
            pageOf(
                ocorrencias
                    .filter((ocorrencia) => ocorrencia.riscoId === riscoId)
                    .map((ocorrencia) => ocorrenciaResponse(ocorrencia)),
                params,
                "one"
            )
        )
    }

    if (method === "post") {
        const riscoId = getId(payload.risco) ?? 0
        const record: OcorrenciaRecord = {
            id: nextId.ocorrencia++,
            riscoId,
            dataOcorrencia: payload.dataOcorrencia ?? day(),
            responsavelRegistroId: getId(payload.responsavelRegistro) ?? 1,
            responsavelSolucao: payload.responsavelSolucao ?? "",
            descricao: payload.descricao ?? "",
            criadoEm: timestamp(),
            atualizadoEm: timestamp(),
            resultados: payload.resultados ?? "",
            solucao: payload.solucao ?? "",
        }
        ocorrencias.push(record)
        touchFromRisco(riscoId)
        notifyDataChanged("ocorrencias")
        return ok(config, ocorrenciaResponse(record), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const record = ocorrencias.find((ocorrencia) => ocorrencia.id === id)
        if (!record) return fail(config, 404, "Ocorrência não encontrada.")

        record.dataOcorrencia = payload.dataOcorrencia ?? record.dataOcorrencia
        record.responsavelRegistroId = getId(payload.responsavelRegistro) ?? record.responsavelRegistroId
        record.responsavelSolucao = payload.responsavelSolucao ?? record.responsavelSolucao
        record.descricao = payload.descricao ?? record.descricao
        record.resultados = payload.resultados ?? record.resultados
        record.solucao = payload.solucao ?? record.solucao
        record.atualizadoEm = timestamp()
        touchFromRisco(record.riscoId)
        notifyDataChanged("ocorrencias")
        return ok(config, ocorrenciaResponse(record))
    }

    if (method === "delete" && Number.isFinite(id)) {
        ocorrencias = ocorrencias.filter((ocorrencia) => ocorrencia.id !== id)
        notifyDataChanged("ocorrencias")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de ocorrências não encontrada.")
}

function handleSiglas(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get") {
        const processoId = segments[0] === "processo" ? Number(segments[1]) : null
        const filtered = siglas
            .filter((sigla) => !processoId || sigla.processoId === processoId)
            .map(siglaResponse)
        return ok(config, pageOf(filtered, params, "one"))
    }

    if (method === "post") {
        const processoId = getId(payload.processo) ?? processos[0]!.id
        if (hasDuplicateSigla(payload.sigla, processoId)) {
            return fail(config, 409, "Já existe uma sigla com essa combinação.")
        }

        const sigla = {
            id: nextId.sigla++,
            sigla: payload.sigla ?? "",
            descricao: payload.descricao ?? "",
            processoId,
        }
        siglas.push(sigla)
        return ok(config, siglaResponse(sigla), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const sigla = siglas.find((item) => item.id === id)
        if (!sigla) return fail(config, 404, "Sigla não encontrada.")

        const processoId = getId(payload.processo) ?? sigla.processoId
        if (hasDuplicateSigla(payload.sigla, processoId, id)) {
            return fail(config, 409, "Já existe uma sigla com essa combinação.")
        }

        sigla.sigla = payload.sigla ?? sigla.sigla
        sigla.descricao = payload.descricao ?? sigla.descricao
        sigla.processoId = processoId
        return ok(config, siglaResponse(sigla))
    }

    if (method === "delete" && Number.isFinite(id)) {
        siglas = siglas.filter((sigla) => sigla.id !== id)
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de siglas não encontrada.")
}

function handleAcompanhamentos(
    method: string,
    segments: string[],
    params: URLSearchParams,
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get" && segments[0] === "processos" && segments[1] === "indicadores") {
        return ok(config, {
            aguardandoAnalise: processos.filter((p) => p.statusAcompanhamento === "AGUARDANDO_ANALISE").length,
            emAnalise: processos.filter((p) => p.statusAcompanhamento === "EM_ANALISE").length,
            emAjuste: processos.filter((p) => p.statusAcompanhamento === "EM_AJUSTE").length,
            concluidos: processos.filter((p) => p.statusAcompanhamento === "CONCLUIDO").length,
            pendenteRevisao: processos.filter((p) => p.statusAcompanhamento === "PENDENTE_REVISAO").length,
        })
    }

    if (method === "get" && segments[0] === "processos" && segments.length === 1) {
        return ok(
            config,
            pageOf(filterProcessos(params).map(acompanhamentoResumo), params, "zero")
        )
    }

    if (method === "get" && segments[0] === "processos" && segments[2] === "pendencias") {
        return ok(config, pendenciasProcesso(Number(segments[1])))
    }

    if (method === "get" && segments[0] === "processos" && segments[2] === "historico") {
        const processoId = Number(segments[1])
        return ok(
            config,
            historicos
                .filter((historico) => historico.processoId === processoId)
                .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
                .map(historicoResponse)
        )
    }

    if (method === "get" && segments[0] === "processos" && segments.length === 2) {
        const processo = processoRecord(Number(segments[1]))
        if (!processo) return fail(config, 404, "Processo não encontrado.")
        return ok(config, acompanhamentoResumo(processo))
    }

    if (method === "post" && segments[0] === "processos" && segments.length === 3) {
        const processo = processoRecord(Number(segments[1]))
        if (!processo) return fail(config, 404, "Processo não encontrado.")
        return ok(config, aplicarAcaoAcompanhamento(processo, segments[2]!, payload))
    }

    if (method === "get" && segments[0] === "analistas") {
        return ok(config, listarAnalistas())
    }

    if (method === "get" && segments[0] === "notificacoes") {
        return ok(config, notificacoes.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map(notificacaoResponse))
    }

    if (method === "post" && segments[0] === "notificacoes" && segments[2] === "ler") {
        const notificacao = notificacoes.find((item) => item.id === Number(segments[1]))
        if (!notificacao) return fail(config, 404, "Notificação não encontrada.")
        notificacao.lida = true
        return ok(config, notificacaoResponse(notificacao))
    }

    if (segments[0] === "prazos-revisao") {
        return handlePrazosRevisao(method, segments.slice(1), payload, config)
    }

    return fail(config, 404, "Rota de acompanhamento não encontrada.")
}

function handlePrazosRevisao(
    method: string,
    segments: string[],
    payload: any,
    config: InternalAxiosRequestConfig
) {
    if (method === "get") {
        return ok(config, prazos.sort((a, b) => b.anoReferencia - a.anoReferencia).map(prazoResponse))
    }

    if (method === "post") {
        const prazo: PrazoRecord = {
            id: nextId.prazo++,
            anoReferencia: Number(payload.anoReferencia),
            prazo: payload.prazo,
            limiteAtraso: addDaysTo(payload.prazo, 15),
            responsavelId: 1,
            criadoEm: timestamp(),
            atualizadoEm: timestamp(),
        }
        prazos = prazos.filter((item) => item.anoReferencia !== prazo.anoReferencia)
        prazos.push(prazo)
        notifyDataChanged("prazos")
        return ok(config, prazoResponse(prazo), 201)
    }

    const id = Number(segments[0])

    if (method === "put" && Number.isFinite(id)) {
        const prazo = prazos.find((item) => item.id === id)
        if (!prazo) return fail(config, 404, "Prazo não encontrado.")
        prazo.anoReferencia = Number(payload.anoReferencia)
        prazo.prazo = payload.prazo
        prazo.limiteAtraso = addDaysTo(payload.prazo, 15)
        prazo.atualizadoEm = timestamp()
        notifyDataChanged("prazos")
        return ok(config, prazoResponse(prazo))
    }

    if (method === "delete" && Number.isFinite(id)) {
        prazos = prazos.filter((prazo) => prazo.id !== id)
        notifyDataChanged("prazos")
        return ok(config, null, 204)
    }

    return fail(config, 404, "Rota de prazos não encontrada.")
}

function listarAnalistas() {
    return usuarios
        .filter((usuario) => usuario.papel === "secgov" && usuario.ativo)
        .map((usuario) => ({
            ...usuarioResumo(usuario.id)!,
            processosAtribuidos: processos.filter(
                (processo) =>
                    processo.analistaResponsavelId === usuario.id ||
                    processo.segundoAnalistaId === usuario.id
            ).length,
            processosEmAnalise: processos.filter(
                (processo) =>
                    processo.statusAcompanhamento === "EM_ANALISE" &&
                    (processo.analistaResponsavelId === usuario.id ||
                        processo.segundoAnalistaId === usuario.id)
            ).length,
            processosAguardandoAnalise: processos.filter(
                (processo) =>
                    processo.statusAcompanhamento === "AGUARDANDO_ANALISE" &&
                    (processo.analistaResponsavelId === usuario.id ||
                        processo.segundoAnalistaId === usuario.id)
            ).length,
        }))
}

function pendenciasProcesso(processoId: number) {
    const processo = processoRecord(processoId)
    if (!processo) {
        return {
            processoId,
            aptoParaEnvio: false,
            pendencias: ["Dados gerais: processo não encontrado."],
        }
    }

    const pendencias: string[] = []
    if (!processo.nome || !processo.objetivosGerais || !processo.objetivosEstrategicos) {
        pendencias.push("Dados gerais: preencha os campos obrigatórios.")
    }

    const riscosDoProcesso = riscos.filter((risco) => risco.processoId === processoId)
    if (!riscosDoProcesso.length) {
        pendencias.push("Identificação: cadastre ao menos um risco.")
    }

    riscosDoProcesso.forEach((risco) => {
        const avaliacao = avaliacoes.find((item) => item.riscoId === risco.id)
        const resposta = respostas.find((item) => item.riscoId === risco.id)
        const atividade = atividades.find((item) => item.riscoId === risco.id)

        if (!avaliacao) pendencias.push(`Avaliação: informe avaliação para ${risco.nome}.`)
        if (!resposta) pendencias.push(`Respostas: informe resposta para ${risco.nome}.`)
        if (resposta && resposta.opcaoTratamento !== "ACEITAR" && !atividade) {
            pendencias.push(`Atividades: informe atividade de controle para ${risco.nome}.`)
        }
    })

    return {
        processoId,
        aptoParaEnvio: pendencias.length === 0,
        pendencias,
    }
}

function aplicarAcaoAcompanhamento(
    processo: ProcessoRecord,
    acao: string,
    payload: JsonRecord
) {
    const anterior = processo.statusAcompanhamento
    let tipo = acao.toUpperCase().replace(/-/g, "_")

    if (acao === "enviar") {
        processo.statusAcompanhamento = "AGUARDANDO_ANALISE"
        processo.enviadoParaAnaliseEm = timestamp()
        tipo = "ENVIO_ANALISE"
        criarNotificacao("Processo enviado para análise", processo.id, "ANALISE")
    }

    if (acao === "cancelar-envio") {
        processo.statusAcompanhamento = processo.emCicloRevisao ? "PENDENTE_REVISAO" : "RASCUNHO"
        processo.enviadoParaAnaliseEm = null
        processo.reenviadoParaAnaliseEm = null
    }

    if (acao === "atribuir-analista") {
        processo.analistaResponsavelId =
            getId(payload.analistaResponsavelId) ?? getId(payload.analistaId) ?? processo.analistaResponsavelId
        processo.segundoAnalistaId = getId(payload.segundoAnalistaId)
    }

    if (acao === "desvincular-analista") {
        processo.analistaResponsavelId = null
        processo.segundoAnalistaId = null
    }

    if (acao === "iniciar-analise") {
        processo.statusAcompanhamento = "EM_ANALISE"
        processo.analiseIniciadaEm = timestamp()
    }

    if (acao === "solicitar-ajustes") {
        processo.statusAcompanhamento = "EM_AJUSTE"
        processo.ajusteSolicitadoEm = timestamp()
        processo.prazoAjuste = payload.prazoAjuste ?? day(15)
        criarNotificacao("Ajustes solicitados", processo.id, "PROCESSO")
    }

    if (acao === "reenviar-ajustado") {
        processo.statusAcompanhamento = "AGUARDANDO_ANALISE"
        processo.reenviadoParaAnaliseEm = timestamp()
        processo.ajusteSolicitadoEm = null
        processo.prazoAjuste = null
    }

    if (acao === "concluir-analise") {
        processo.statusAcompanhamento = "CONCLUIDO"
        processo.analiseConcluidaEm = timestamp()
        processo.dataConclusao = day()
        criarNotificacao("Análise concluída", processo.id, "HISTORICO")
    }

    if (acao === "cancelar-analise") {
        processo.statusAcompanhamento = "AGUARDANDO_ANALISE"
        processo.analiseIniciadaEm = null
    }

    if (acao === "iniciar-revisao") {
        processo.statusAcompanhamento = "PENDENTE_REVISAO"
        processo.emCicloRevisao = true
        processo.cicloAcompanhamento += 1
        processo.dataConclusao = ""
    }

    processo.atualizadoEm = timestamp()
    historicos.push({
        id: nextId.historico++,
        processoId: processo.id,
        tipo,
        criadoEm: timestamp(),
        usuarioId: 1,
        statusAnterior: anterior,
        statusNovo: processo.statusAcompanhamento,
        observacao: payload.observacao ?? payload.justificativa ?? null,
        ciclo: processo.cicloAcompanhamento,
    })
    notifyDataChanged("acompanhamentos")

    return acompanhamentoResumo(processo)
}

function criarNotificacao(titulo: string, processoId: number, destino: NotificacaoRecord["destino"]) {
    const processo = processoRecord(processoId)
    notificacoes.push({
        id: nextId.notificacao++,
        titulo,
        descricao: processo ? `${processo.nome} teve movimentação no acompanhamento.` : titulo,
        processoId,
        tipo: titulo.toUpperCase().replace(/\s+/g, "_"),
        destino,
        criadoEm: timestamp(),
        lida: false,
    })
}

function hasDuplicateSigla(sigla: string, processoId: number, ignoreId?: number) {
    return siglas.some(
        (item) =>
            item.id !== ignoreId &&
            item.processoId === processoId &&
            normalize(item.sigla) === normalize(sigla)
    )
}

function touchProcesso(processoId?: number | null) {
    const processo = processoRecord(processoId)
    if (processo) processo.atualizadoEm = timestamp()
}

function touchFromRisco(riscoId?: number | null) {
    const risco = riscoRecord(riscoId)
    if (!risco) return
    risco.atualizadoEm = timestamp()
    touchProcesso(risco.processoId)
}

function deleteRiscoCascade(riscoId: number) {
    const risco = riscoRecord(riscoId)
    avaliacoes = avaliacoes.filter((avaliacao) => avaliacao.riscoId !== riscoId)
    respostas = respostas.filter((resposta) => resposta.riscoId !== riscoId)
    atividades = atividades.filter((atividade) => atividade.riscoId !== riscoId)
    ocorrencias = ocorrencias.filter((ocorrencia) => ocorrencia.riscoId !== riscoId)
    riscos = riscos.filter((item) => item.id !== riscoId)
    touchProcesso(risco?.processoId)
}

function deleteProcessoCascade(processoId: number) {
    const riscoIds = riscos.filter((risco) => risco.processoId === processoId).map((risco) => risco.id)
    riscoIds.forEach(deleteRiscoCascade)
    siglas = siglas.filter((sigla) => sigla.processoId !== processoId)
    historicos = historicos.filter((historico) => historico.processoId !== processoId)
    notificacoes = notificacoes.filter((notificacao) => notificacao.processoId !== processoId)
    processos = processos.filter((processo) => processo.id !== processoId)
}

function deleteUnidadeCascade(unidadeId: number) {
    const ids = new Set<number>([unidadeId])
    let changed = true

    while (changed) {
        changed = false
        unidades.forEach((unidade) => {
            if (unidade.parentId && ids.has(unidade.parentId) && !ids.has(unidade.id)) {
                ids.add(unidade.id)
                changed = true
            }
        })
    }

    usuarios.forEach((usuario) => {
        if (usuario.unidadeId && ids.has(usuario.unidadeId)) {
            usuario.unidadeId = null
            usuario.papel = null
            usuario.funcaoKeycloak = null
        }
    })

    processos
        .filter((processo) => ids.has(processo.unidadeId))
        .map((processo) => processo.id)
        .forEach(deleteProcessoCascade)

    unidades = unidades.filter((unidade) => !ids.has(unidade.id))
}

function notifyDataChanged(collection: string) {
    if (typeof CustomEvent === "undefined" || typeof globalThis.dispatchEvent !== "function") {
        return
    }

    globalThis.dispatchEvent(
        new CustomEvent("gestao-riscos-mvp:data-changed", {
            detail: { collection },
        })
    )
}
