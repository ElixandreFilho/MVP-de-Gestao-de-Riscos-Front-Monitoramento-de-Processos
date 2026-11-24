import type { TipoRiscoIntegridade } from "../types/tipoRiscoIntegridade"
import { BaseService } from "./baseService"

class TipoRiscoIntegridadeService extends BaseService<TipoRiscoIntegridade> {
    constructor() {
        super("/tiposRiscoIntegridade")
    }
}

const tipoRiscoIntegridadeService = new TipoRiscoIntegridadeService()
export default tipoRiscoIntegridadeService
