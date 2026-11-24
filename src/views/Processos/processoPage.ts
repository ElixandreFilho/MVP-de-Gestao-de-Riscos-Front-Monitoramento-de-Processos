import { ref, type Ref } from "vue"
import type { Processo } from "../../types/processo"
import type { DeepPartial } from "../../types/types"
import type { RespostaRisco } from "../../types/respostaRisco"
import type { VForm } from "vuetify/components"

export const selectedProcesso: Ref<Processo | null> = ref(null)

export type RespostaTabRefs = {
    opened: Ref<number>
    update: Ref<number>
    model: Ref<DeepPartial<RespostaRisco>>
    form: Ref<VForm | undefined | null>
}

export const respostaTabRefs: Map<number, RespostaTabRefs> = new Map()
