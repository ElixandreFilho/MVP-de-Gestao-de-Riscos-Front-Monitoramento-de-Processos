import { ref, type Ref } from "vue"
import type { TipoRisco } from "../../../types/enums/tipoRisco"
import type { CategoriaRisco } from "../../../types/categoriaRisco"
import type { TipoRiscoIntegridade } from "../../../types/tipoRiscoIntegridade"

export const risco = ref({
    nome: "",
    faseProcesso: "",
    tipoRisco: null as TipoRisco | null,
    categoria: { id: null as number | null },
    tipoRiscoIntegridade: { id: null as number | null } as { id: number | null } | null,
    causa: "",
    consequencias: "",
    processo: { id: null as number | null },
})

export const selectItems = ref({
    tipoRiscoIntegridade: [] as TipoRiscoIntegridade[],
    categoria: [] as CategoriaRisco[],
})

export const categoriaIntegridade: Ref<CategoriaRisco | undefined> = ref()
