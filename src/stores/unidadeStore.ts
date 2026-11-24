import { defineStore } from "pinia"
import type { UnidadeOrganizacional } from "../types/unidadeOrganizacional"
import { computed, ref, type Ref } from "vue"
import { userInfo } from "../services/keycloakService"
import userService from "../services/userService"

export const useUnidadeStore = defineStore("unidadeStore", () => {
    const unidade: Ref<UnidadeOrganizacional | undefined> = ref()
    const loaded = ref(false)

    const isAdmin = computed(() => {
        return unidade.value?.isAdmin ?? false
    })
    const loadUnidade = async () => {
        const usuario = await userService.getUserByKeycloakId(userInfo.value.keycloakId)
        unidade.value = usuario.unidadeOrganizacional ?? undefined
        userInfo.value.papel = usuario.papel ?? ""
        loaded.value = true
    }

    return {
        unidade,
        isAdmin,
        loaded,
        loadUnidade,
    }
})
