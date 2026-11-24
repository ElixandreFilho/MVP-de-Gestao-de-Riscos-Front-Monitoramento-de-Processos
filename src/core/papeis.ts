import {
    FuncaoKeycloak,
    Papel,
    type FuncaoKeycloak as FuncaoKeycloakTipo,
    type Papel as PapelTipo,
    type PapelOption,
} from "../types/enums/papel"

export const papelLabels: Record<PapelTipo, string> = {
    secgov: "SecGov",
    unit: "Unidade",
}

export const funcaoLabels: Record<FuncaoKeycloakTipo, string> = {
    gestor: "Gestor",
    colaborador: "Colaborador",
}

export function hasRole(roles: string[] | null | undefined, role: string): boolean {
    return roles?.includes(role) ?? false
}

export function isGestor(roles: string[] | null | undefined): boolean {
    return hasRole(roles, FuncaoKeycloak.GESTOR)
}

export function papelPadrao(options: PapelOption[]): FuncaoKeycloakTipo | null {
    return options.find((option) => option.padrao)?.value ?? options[0]?.value ?? null
}

export function labelPapel(papel: PapelTipo | string | null | undefined): string {
    if (!papel || !Object.values(Papel).includes(papel as PapelTipo)) {
        return "-"
    }

    return papelLabels[papel as PapelTipo]
}

export function labelFuncao(funcao: FuncaoKeycloakTipo | string | null | undefined): string {
    if (!funcao || !Object.values(FuncaoKeycloak).includes(funcao as FuncaoKeycloakTipo)) {
        return "-"
    }

    return funcaoLabels[funcao as FuncaoKeycloakTipo]
}
