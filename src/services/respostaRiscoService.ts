import type { RespostaRisco } from "../types/respostaRisco"
import { BaseTabEntityService } from "./baseTabEntityService"

class RespostaRiscoService extends BaseTabEntityService<RespostaRisco> {
    constructor() {
        super("/respostasRisco")
    }
}

const respostaRiscoService = new RespostaRiscoService()
export default respostaRiscoService
