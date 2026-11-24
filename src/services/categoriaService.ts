import type { CategoriaRisco } from "../types/categoriaRisco"
import { BaseService } from "./baseService"

class CategoriaService extends BaseService<CategoriaRisco> {
    constructor() {
        super("/categoriasRisco")
    }
}

const categoriaService = new CategoriaService()
export default categoriaService
