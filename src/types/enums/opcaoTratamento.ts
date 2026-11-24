export const OpcaoTratamento = {
    EVITAR: "EVITAR",
    MITIGAR: "MITIGAR",
    COMPARTILHAR: "COMPARTILHAR",
    ACEITAR: "ACEITAR",
} as const

export type OpcaoTratamento = (typeof OpcaoTratamento)[keyof typeof OpcaoTratamento]
