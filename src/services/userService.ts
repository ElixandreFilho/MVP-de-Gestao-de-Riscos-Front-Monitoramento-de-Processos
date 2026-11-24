import axios from "axios"
import { BaseService } from "./baseService"
import type { AtualizacaoPerfilUsuario, Usuario } from "../types/usuario"
import type { PapelOption } from "../types/enums/papel"

class UserService extends BaseService<Usuario> {
    constructor() {
        super("/usuarios")
    }

    async findByIdKeycloakId(idKeycloak: string): Promise<number> {
        const { data } = await axios.get(
            `${this.route}/search/findUserIdByKeycloakId?idKeycloak=${idKeycloak}`
        )
        return data
    }

    async updatePassword(keycloakId: string, password: string, oldPassword: string) {
        await axios.patch(`${this.route}/${keycloakId}/updatePassword`, {
            newPassword: password,
            oldPassword: oldPassword,
        })
    }

    async updateUser(user: Usuario | AtualizacaoPerfilUsuario): Promise<void> {
        await axios.put(`${this.route}/update`, user)
    }

    async findResponsaveis(unidadeId: number): Promise<Usuario[]> {
        const { data } = await axios.get(`${this.route}/responsaveis/${unidadeId}`)
        return data
    }

    async getUserByKeycloakId(idKeycloak: string): Promise<Usuario> {
        const { data } = await axios.get(`${this.route}/${idKeycloak}`)
        return data
    }

    async getUserById(id: number): Promise<Usuario> {
        const { data } = await axios.get(`${this.route}/byId/${id}`)
        return data
    }

    async getUsersWithoutUO(): Promise<Usuario[]> {
        const { data } = await axios.get(`${this.route}/withoutUO`)
        return data
    }

    async getPapeisDisponiveis(unidadeId: number): Promise<PapelOption[]> {
        const { data } = await axios.get<PapelOption[]>(
            `${this.route}/papeis-disponiveis/${unidadeId}`
        )
        return data
    }
}

const userService = new UserService()
export default userService
