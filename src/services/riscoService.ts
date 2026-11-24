import axios from "axios"
import type { Risco } from "../types/risco"
import { BaseTabEntityService } from "./baseTabEntityService"

class RiscoService extends BaseTabEntityService<Risco> {
    constructor() {
        super("/riscos")
    }

    getWithoutAvalicao = async (processoId: number, riscoName = "") => {
        return (
            await axios.get(
                `${this.route}/withoutAvaliacao/${processoId}?riscoName=${riscoName.trim()}`
            )
        ).data
    }

    getWithoutResposta = async (processoId: number, riscoName = "") => {
        return (
            await axios.get(
                `${this.route}/withoutResposta/${processoId}?riscoName=${riscoName.trim()}`
            )
        ).data
    }

    getWithoutAtividade = async (processoId: number, riscoName = "") => {
        return (
            await axios.get(
                `${this.route}/withoutAtividade/${processoId}?riscoName=${riscoName.trim()}`
            )
        ).data
    }
}

const riscoService = new RiscoService()
export default riscoService
