export const emailRule = (value: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]{2,}$/.test(value) ? true : "Email inválido"

export const nameRule = (value: string) =>
    /^[a-zA-ZÀ-ÿ\s'-]*$/.test(value) ? true : "Nome possui caracteres inválidos"

export const fullNameRule = (value: string) =>
    /.+\s.+/.test(value) ? true : "Nome inteiro é necessário"

export const notEmptyRule = (value: string | null | undefined) =>
    value?.trim() ? true : "Campo deve ser preenchido"

export const objectNotEmptyRule = (value: { id: number | string | null } | string | null) =>
    !value || (value as { id: number | null }).id === null ? "Seleção obrigatória" : true
