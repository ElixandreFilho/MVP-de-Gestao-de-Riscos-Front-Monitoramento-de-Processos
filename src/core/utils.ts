export function formatDateForRequest(dateString: string | Date) {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

export function formatDateForDisplay(dateString?: string | Date | null) {
    if (!dateString) return "-"

    if (typeof dateString === "string") {
        const [datePart = ""] = dateString.split("T")
        const [year, month, day] = datePart.split("-")

        if (year && month && day) {
            return `${day}/${month}/${year}`
        }
    }

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "-"

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}

export function formatDateForInput(dateString: string | Date) {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${year}-${month}-${day}`
}
