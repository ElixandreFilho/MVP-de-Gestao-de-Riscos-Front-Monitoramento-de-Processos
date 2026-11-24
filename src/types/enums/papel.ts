export const Papel = {
    SECGOV: "secgov",
    UNIT: "unit",
} as const

export type Papel = (typeof Papel)[keyof typeof Papel]

export const FuncaoKeycloak = {
    GESTOR: "gestor",
    COLABORADOR: "colaborador",
} as const

export type FuncaoKeycloak = (typeof FuncaoKeycloak)[keyof typeof FuncaoKeycloak]

export type PapelOption = {
    value: FuncaoKeycloak
    label: string
    padrao: boolean
}
