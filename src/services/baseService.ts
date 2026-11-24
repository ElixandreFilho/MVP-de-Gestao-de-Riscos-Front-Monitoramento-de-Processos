import axios from "axios"
import type { SpringPage } from "../types/page"
import type { DeepPartial } from "../types/types"

export interface PageFilters {
    name?: string
    initialDate?: string
    finalDate?: string
    unit?: number | string | null
}
export class BaseService<T> {
    route = "/"
    constructor(route: string) {
        this.route = route
    }
    post = async (value: DeepPartial<T>): Promise<void> => {
        await axios.post(this.route, value)
    }
    update = async (value: DeepPartial<T>, id: number): Promise<void> => {
        await axios.put(this.route + `/${id}`, value)
    }
    getAll = async (page = 0, size = 10, filters: PageFilters = {}): Promise<SpringPage<T>> => {
        let queryString = `?page=${page}&size=${size}`
        const hasFilters = filters.name || filters.initialDate || filters.finalDate || filters.unit
        let endpoint = this.route

        if (hasFilters) {
            endpoint += "/filter"
        }

        if (filters.name) {
            queryString += `&name=${filters.name}`
        }

        if (filters.initialDate) {
            queryString += `&initialDate=${filters.initialDate}`
        }
        if (filters.finalDate) {
            queryString += `&finalDate=${filters.finalDate}`
        }
        if (filters.unit) {
            queryString += `&unit=${filters.unit}`
        }

        const { data } = await axios.get<SpringPage<T>>(endpoint + queryString)

        if (!data.content) {
            data.content = []
        }
        return data
    }
    get = () => {
        throw new Error("delete not implemented")
    }
    delete = async (id: number) => {
        await axios.delete(this.route + `/${id}`)
    }
}
