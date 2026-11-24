import axios from "axios"
import type { UnidadeOrganizacional } from "../types/unidadeOrganizacional"
import { BaseService } from "./baseService"

class UnidadeService extends BaseService<UnidadeOrganizacional> {
    constructor() {
        super("/unidadesOrganizacionais")
    }

    async getAllWithChildren() {
        const res = await axios.get(this.route + "/children")
        return res.data
    }
}

const unidadeService = new UnidadeService()
export default unidadeService
