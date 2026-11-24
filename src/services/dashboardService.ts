import axios from "axios"

export interface DashboardOverview {
    processesCount: number
    risksCount: number
    occurrencesCount: number
}

interface FilterParams { 
  unidadeId?: number | null
  initialDate?: string
  finalDate?: string
}

class DashboardService {
    private readonly route = "/dashboard"

    getOverview = async (filters?: FilterParams): Promise<DashboardOverview> => {
        const params = new URLSearchParams()
        if (filters?.unidadeId) params.append("unidadeId", filters.unidadeId.toString())
        if (filters?.initialDate) params.append("initialDate", filters.initialDate)
        if (filters?.finalDate) params.append("finalDate", filters.finalDate)
    
        const queryString = params.toString()
        const url = queryString ? `${this.route}/overview?${queryString}` : `${this.route}/overview`
        const { data } = await axios.get<DashboardOverview>(url)
        return data
    }
}

const dashboardService = new DashboardService()
export default dashboardService