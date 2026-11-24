import axios from "axios"
import type { Processo } from "../types/processo"
import { BaseService } from "./baseService"

class ProcessoService extends BaseService<Processo> {
    constructor() {
        super("/processos")
    }

    exportSpreadsheet = async (id: number): Promise<Blob> => {
        const { data } = await axios.get<Blob>(`${this.route}/${id}/export/xlsx`, {
            responseType: "blob",
        })

        return data
    }
}

const processoService = new ProcessoService()
export default processoService
