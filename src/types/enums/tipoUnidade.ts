
export const TipoUnidade = {
    UNIDADE_ADMINISTRATIVA: "UNIDADE_ADMINISTRATIVA",
    UNIDADE_ACADEMICA: "UNIDADE_ACADEMICA",
} as const

export type TipoUnidade = (typeof TipoUnidade)[keyof typeof TipoUnidade];