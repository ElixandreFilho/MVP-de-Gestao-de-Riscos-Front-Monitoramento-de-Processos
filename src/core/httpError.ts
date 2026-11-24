import axios, { type AxiosError } from "axios"

type ErrorResponse = {
    message?: string
    error?: string
    detail?: string
}

const getResponseMessage = (error: AxiosError): string | null => {
    const data = error.response?.data

    if (typeof data === "string" && data.trim()) {
        return data
    }

    if (data && typeof data === "object") {
        const response = data as ErrorResponse
        return response.message ?? response.detail ?? response.error ?? null
    }

    return null
}

export const getHttpErrorMessage = (error: unknown, fallback: string): string => {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error && error.message ? error.message : fallback
    }

    const responseMessage = getResponseMessage(error)
    if (responseMessage) return responseMessage

    if (!error.response) {
        return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
    }

    switch (error.response.status) {
    case 400:
        return "Os dados enviados são inválidos. Revise as informações e tente novamente."
    case 401:
        return "Sua sessão expirou. Faça login novamente."
    case 403:
        return "Você não tem permissão para realizar esta ação."
    case 404:
        return "O registro solicitado não foi encontrado."
    case 409:
        return "Não foi possível concluir a ação porque existe um conflito com dados já cadastrados."
    case 413:
        return "O arquivo enviado é maior que o limite permitido pelo servidor."
    case 415:
        return "O formato do arquivo não é aceito pelo servidor."
    case 422:
        return "Algumas informações não passaram na validação. Revise os dados e tente novamente."
    case 500:
        return "O servidor encontrou um erro inesperado. Tente novamente mais tarde."
    default:
        return fallback
    }
}
