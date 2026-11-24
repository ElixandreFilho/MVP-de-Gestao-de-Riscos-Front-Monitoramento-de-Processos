import { createRouter, createWebHistory } from "vue-router"
import routes from "./routes"
import keycloakService, { userInfo } from "../services/keycloakService"
import { useUnidadeStore } from "../stores/unidadeStore"
import { isGestor } from "../core/papeis"

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to) => {
    if (to.path !== "/login" && !keycloakService.isAuthenticated()) {
        return "/login"
    }

    if (to.path === "/login" && keycloakService.isAuthenticated()) {
        return "/"
    }

    const unidadeStore = useUnidadeStore()
    if (!unidadeStore.loaded) {
        await unidadeStore.loadUnidade()
    }

    if (to.meta.requiresAdmin) {
        if (!unidadeStore.isAdmin) {
            return "/"
        }
    }

    if (to.meta.requiresGestor && !isGestor(userInfo.value.roles)) {
        return "/"
    }

    if (to.path !== "/" && userInfo.value.papel === "") {
        return "/"
    }

    return true
})
export default router
