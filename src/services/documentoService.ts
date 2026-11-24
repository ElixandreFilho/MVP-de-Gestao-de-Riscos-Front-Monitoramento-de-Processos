import axios from "axios"
import type { Documento } from "../types/documento"

const DOCUMENTOS_ROUTE = "/api/documentos"

export const isDocumentoNotFoundError = (error: unknown): boolean =>
    axios.isAxiosError(error) && error.response?.status === 404

class DocumentoService {
    async listar(): Promise<Documento[]> {
        const { data } = await axios.get<Documento[]>(DOCUMENTOS_ROUTE)
        return data
    }

    async upload(file: File): Promise<Documento> {
        const formData = new FormData()
        formData.append("file", file)

        const { data } = await axios.post<Documento>(`${DOCUMENTOS_ROUTE}/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return data
    }

    async deletar(id: number): Promise<void> {
        await axios.delete(`${DOCUMENTOS_ROUTE}/${id}`)
    }

    async downloadBlob(id: number): Promise<Blob> {
        const { data } = await axios.get<Blob>(`${DOCUMENTOS_ROUTE}/${id}`, {
            responseType: "blob",
        })

        return data
    }

    async baixar(documento: Documento): Promise<void> {
        const blob = await this.downloadBlob(documento.id)
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")

        link.href = objectUrl
        link.download = documento.nome
        document.body.appendChild(link)
        link.click()

        link.remove()
        URL.revokeObjectURL(objectUrl)
    }
}

const documentoService = new DocumentoService()
export default documentoService
