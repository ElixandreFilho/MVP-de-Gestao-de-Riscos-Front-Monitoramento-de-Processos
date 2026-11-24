import axios from "axios"
import type { SpringPage } from "../types/page"
import { BaseService } from "./baseService"

/**
 * Usado apenas por entidades que são listadas a partir de um processo
 */
export class BaseTabEntityService<T> extends BaseService<T> {
    getAllByProcesso = async (
        page: number,
        size: number,
        processoId: number,
        riscoName = ""
    ): Promise<SpringPage<T>> => {
        const { data } = await axios.get<SpringPage<T>>(
            this.route +
                `/processo/${processoId}?page=${page}&size=${size}&riscoName=${riscoName.trim()}`
        )
        if (!data.content) {
            data.content = []
        }
        return data
    }
}
