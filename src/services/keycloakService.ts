import { ref } from "vue"
import configureAxios from "../core/axiosConfig"
import userService from "./userService"
import { FuncaoKeycloak, Papel } from "../types/enums/papel"
import { MOCK_KEYCLOAK_ID } from "../mocks/mockApi"

export const userInfo = ref({
    nome: "Ana Lúcia Ferreira",
    email: "ana.ferreira@ufc.br",
    nomeSocial: "Ana Ferreira",
    keycloakId: MOCK_KEYCLOAK_ID,
    papel: Papel.SECGOV as string,
    roles: [Papel.SECGOV, FuncaoKeycloak.GESTOR] as string[],
    isEmailVerified: true,
    username: "ana.ferreira",
    id: 1,
})

class KeycloakService {
    private authenticated = true

    public async init() {
        configureAxios("Bearer mvp-demo-token")
        await this.reloadUserData()
    }

    readonly login = () => {
        this.authenticated = true
    }

    readonly register = () => {
        this.authenticated = true
    }

    readonly logout = () => {
        this.authenticated = true
        globalThis.location?.assign("/")
    }

    readonly reloadUserData = async () => {
        const usuario = await userService.getUserByKeycloakId(MOCK_KEYCLOAK_ID)

        userInfo.value.email = usuario.email ?? ""
        userInfo.value.isEmailVerified = true
        userInfo.value.nome = usuario.nome ?? ""
        userInfo.value.nomeSocial = (usuario as { nomeSocial?: string }).nomeSocial ?? ""
        userInfo.value.keycloakId = usuario.idKeycloak ?? MOCK_KEYCLOAK_ID
        userInfo.value.papel = usuario.papel ?? Papel.SECGOV
        userInfo.value.roles = [usuario.papel, usuario.funcaoKeycloak].filter(Boolean) as string[]
        userInfo.value.username =
            usuario.email?.split("@")[0] ?? usuario.nome?.toLocaleLowerCase("pt-BR") ?? "mvp"
    }

    public async getUserId() {
        userInfo.value.id = await userService.findByIdKeycloakId(MOCK_KEYCLOAK_ID)
    }

    public getToken() {
        return "mvp-demo-token"
    }

    public hasRole(role: string) {
        return userInfo.value.roles.includes(role)
    }

    public isAuthenticated() {
        return this.authenticated
    }

    public userMananger() {
        return undefined
    }
}

const keycloakService = new KeycloakService()
export default keycloakService
