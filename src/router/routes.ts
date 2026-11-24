import type { RouteRecordRaw } from "vue-router"
import keycloakService from "../services/keycloakService"
import HomeLayout from "../views/HomeLayout.vue"
import HomePage from "../views/HomePage.vue"
import UnitsPage from "../views/UnitsPage.vue"
import ProcessesPage from "../views/Processos/ProcessesPage.vue"
import RelatoriosPage from "../views/RelatoriosPage.vue"
import UserProfilePage from "../views/UserProfilePage.vue"
import UsersPage from "../views/UsersPage.vue"
import CategoryPage from "../views/CategoriaRisco/CategoryPage.vue"
import AcronymsPage from "../views/Siglas/AcronymsPage.vue"
import ProcessSettingsPage from "../views/Processos/ProcessSettingsPage.vue"
import AcompanhamentoPage from "../views/Acompanhamento/AcompanhamentoPage.vue"
import DistribuicaoProcessosPage from "../views/Acompanhamento/DistribuicaoProcessosPage.vue"
import NotificacoesPage from "../views/Acompanhamento/NotificacoesPage.vue"
import MonitoramentoPage from "../views/Monitoramento/MonitoramentoPage.vue"
import MonitoramentoCadastroPage from "../views/Monitoramento/MonitoramentoCadastroPage.vue"
import MonitoramentoDetalhesPage from "../views/Monitoramento/MonitoramentoDetalhesPage.vue"
import MonitoramentoNotificacoesPage from "../views/Monitoramento/MonitoramentoNotificacoesPage.vue"

const routes: RouteRecordRaw[] = [
    {
        path: "/login",
        name: "Login",
        component: keycloakService.login,
    },
    { path: "/register", name: "Register", component: keycloakService.register },
    {
        path: "/",
        name: "HomeLayout",
        component: HomeLayout,
        meta: { title: "In\u00edcio" },
        children: [
            {
                path: "/",
                name: "Home",
                component: HomePage,
            },
            {
                path: "/processos",
                name: "Processes",
                component: ProcessesPage,
                meta: { title: "Processos" },
            },
            {
                path: "/processos/configuracoes",
                name: "ProcessSettings",
                component: ProcessSettingsPage,
                meta: { title: "Configurações de Processos", requiresAdmin: true, requiresGestor: true },
            },
            {
                path: "/acompanhamento",
                name: "Acompanhamento",
                component: AcompanhamentoPage,
                meta: { title: "Acompanhamento", requiresAdmin: true },
            },
            {
                path: "/monitoramento",
                name: "Monitoramento",
                component: MonitoramentoPage,
                meta: { title: "Monitoramento" },
            },
            {
                path: "/monitoramento/cadastro",
                name: "MonitoramentoCadastro",
                component: MonitoramentoCadastroPage,
                meta: { title: "Monitoramento — Cadastro", activeNav: "Monitoramento" },
            },
            {
                path: "/monitoramento/notificacoes",
                name: "MonitoramentoNotificacoes",
                component: MonitoramentoNotificacoesPage,
                meta: { title: "Monitoramento — Notificações", activeNav: "Monitoramento" },
            },
            {
                path: "/monitoramento/:id",
                name: "MonitoramentoDetalhes",
                component: MonitoramentoDetalhesPage,
                meta: { title: "Detalhes da proposta", activeNav: "Monitoramento" },
            },
            {
                path: "/acompanhamento/distribuicao",
                name: "DistribuicaoProcessos",
                component: DistribuicaoProcessosPage,
                meta: {
                    title: "Distribuir Processos",
                    requiresAdmin: true,
                    requiresGestor: true,
                    activeNav: "Acompanhamento",
                },
            },
            {
                path: "/acompanhamento/processo/:processoId",
                name: "AcompanhamentoProcesso",
                component: ProcessesPage,
                meta: {
                    title: "Acompanhamento",
                    requiresAdmin: true,
                    activeNav: "Acompanhamento",
                    acompanhamentoFlow: true,
                },
            },
            {
                path: "/unidades",
                name: "Units",
                component: UnitsPage,
                meta: { title: "Unidades", requiresAdmin: true, requiresGestor: true },
            },
            {
                path: "/setores",
                name: "Sectors",
                redirect: { name: "Units" },
            },
            {
                path: "/usuarios",
                name: "Users",
                component: UsersPage,
                meta: { title: "Usu\u00e1rios", requiresGestor: true },
            },
            {
                path: "/relatorios",
                name: "Relatorios",
                component: RelatoriosPage,
                meta: { title: "Relat\u00f3rios" },
            },
            {
                path: "/userprofile",
                name: "UserProfile",
                component: UserProfilePage,
                meta: { title: "Perfil" },
            },
            {
                path: "/categorias",
                name: "Categorias",
                component: CategoryPage,
                meta: { title: "Categorias de Risco", requiresAdmin: true, requiresGestor: true },
            },
            {
                path: "/documentos",
                name: "Documentos",
                component: () => import("../views/Documento/DocumentosRiscosPage.vue"),
                meta: { title: "Documentos" },
            },
            {
                path: "/notificacoes",
                name: "Notificacoes",
                component: NotificacoesPage,
                meta: { title: "Notificações" },
            },
            {
                path: "/siglas",
                name: "Siglas",
                component: AcronymsPage,
                meta: { title: "Siglas" },
            }
        ],
    },
]

export default routes
