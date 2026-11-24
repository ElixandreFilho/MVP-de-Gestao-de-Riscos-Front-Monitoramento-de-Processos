import { ref } from "vue"
import type { ProcessoRequest } from "../../../types/processRequest"

export const processoDefault: ProcessoRequest = {
    nome: "",
    responsavel: { id: null as number | null },
    objetivosGerais: "",
    objetivosEstrategicos: "",
    unidadeOrganizacional: { id: null as number | null },
}

export const processo = ref({ ...processoDefault })
