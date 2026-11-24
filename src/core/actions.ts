import {
    IconActivityHeartbeat,
    IconBuilding,
    IconClipboardCheck,
    IconFileDescription,
    IconHome,
    IconUser,
} from "@tabler/icons-vue"
import type { Component } from "vue"
import { isGestor } from "./papeis"

export type NavBarAction = { title: string; icon: Component; to: string }
export type NavBarCategory = { category: string; actions: NavBarAction[] }
const actionsSet = {
    home: { title: "Início", icon: IconHome, to: "Home" },
    processes: { title: "Processos", icon: IconFileDescription, to: "Processes" },
    acompanhamento: { title: "Acompanhamento", icon: IconClipboardCheck, to: "Acompanhamento" },
    monitoramento: { title: "Monitoramento", icon: IconActivityHeartbeat, to: "Monitoramento" },
    units: { title: "Unidades", icon: IconBuilding, to: "Units" },
    reports: { title: "Relatórios", icon: IconFileDescription, to: "Relatorios" },
    users: { title: "Usuários", icon: IconUser, to: "Users" },
    documents: { title: "Documentos", icon: IconFileDescription, to: "Documentos" },
}

export const secGovActions: NavBarCategory[] = [
    { category: "Início", actions: [actionsSet.home] },
    { category: "Processos", actions: [actionsSet.processes, actionsSet.acompanhamento, actionsSet.monitoramento] },
    { category: "Gestão", actions: [actionsSet.units, actionsSet.reports, actionsSet.users, actionsSet.documents] },
]

export const secGovColaboradorActions: NavBarCategory[] = [
    { category: "Início", actions: [actionsSet.home] },
    { category: "Processos", actions: [actionsSet.processes, actionsSet.acompanhamento, actionsSet.monitoramento] },
    { category: "Gestão", actions: [actionsSet.reports, actionsSet.documents] },
]

export const unidadeActions: NavBarCategory[] = [
    { category: "Início", actions: [actionsSet.home] },
    { category: "Processos", actions: [actionsSet.processes, actionsSet.monitoramento] },
    { category: "Relatórios", actions: [actionsSet.reports] },
    {category: "Unidades", actions: [actionsSet.units, actionsSet.users, actionsSet.documents]}
]

export const unidadeMembroActions: NavBarCategory[] = [
    { category: "Início", actions: [actionsSet.home] },
    { category: "Processos", actions: [actionsSet.processes, actionsSet.monitoramento] },
    { category: "Relatórios", actions: [actionsSet.reports] },
    { category: "Unidades", actions: [actionsSet.documents] },
]

export function getNavCategories(isAdmin: boolean, roles: string[] | null | undefined): NavBarCategory[] {
    const gestor = isGestor(roles)

    if (isAdmin) {
        return gestor ? secGovActions : secGovColaboradorActions
    }

    return gestor ? unidadeActions : unidadeMembroActions
}
