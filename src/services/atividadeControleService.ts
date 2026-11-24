import axios from "axios"
import type { AtividadeControle } from "../types/atividadeControle"
import { BaseTabEntityService } from "./baseTabEntityService"

class AtividadeControleService extends BaseTabEntityService<AtividadeControle> {
    constructor() {
        super("/atividadeControles")
    }

    deleteByRiscoId(riscoId: number) {
        return axios.delete(`${this.route}/risco/${riscoId}`)
    }
}

const atividadeControleService = new AtividadeControleService()
export default atividadeControleService
