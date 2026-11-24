import axios from "axios"
import type { OcorrenciaRisco } from "../types/ocorrenciaRisco"
import { BaseService } from "./baseService"
import type { SpringPage } from "../types/page"

class OcorrenciaRiscoService extends BaseService<OcorrenciaRisco> {
    constructor() {
        super("/ocorrenciasRisco")
    }

    getAllByRisco = async (page: number, size: number, riscoId: number) => {
        return (await axios.get(`${this.route}/risco/${riscoId}?page=${page}&size=${size}`))
            .data as SpringPage<OcorrenciaRisco>
    }
}

const ocorrenciaRiscoService = new OcorrenciaRiscoService()
export default ocorrenciaRiscoService
