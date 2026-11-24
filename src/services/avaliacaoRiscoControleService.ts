import type { AvaliacaoRiscoControle } from "../types/avaliacaoRiscoControle"
import axios from "axios"
import { BaseTabEntityService } from "./baseTabEntityService"

export interface FilterParams {
  unidadeId?: number | null
  initialDate?: string
  finalDate?: string
}

export type FacOption = {
    value: number
    label: string
}

class AvaliacaoRiscoControleService extends BaseTabEntityService<AvaliacaoRiscoControle> {
    constructor() {
        super("/avaliacoesRiscoControle")
    }

    getFacOptions = async (): Promise<FacOption[]> => {
        const { data } = await axios.get<FacOption[]>(`${this.route}/opcoes-fac`)
        return data
    }

    getRiskMatrixData = async (filters?: FilterParams): Promise<number[][]> => {
        const params = new URLSearchParams()
        if (filters?.unidadeId) params.append("unidadeId", filters.unidadeId.toString())
        if (filters?.initialDate) params.append("initialDate", filters.initialDate)
        if (filters?.finalDate) params.append("finalDate", filters.finalDate)
    
        const queryString = params.toString()
        const url = queryString ? `${this.route}/matrix?${queryString}` : `${this.route}/matrix`
        const { data } = await axios.get<number[][]>(url)
      
        return data
    }
}

const avaliacaoRiscoControleService = new AvaliacaoRiscoControleService()
export default avaliacaoRiscoControleService
