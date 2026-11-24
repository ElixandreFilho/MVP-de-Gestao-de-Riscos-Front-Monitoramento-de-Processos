import { ref, type Ref } from "vue"

type Message = {
    text: string
    color: string
    show: boolean
}

export const messages: Ref<Message[]> = ref([])

export const defaultTimeout = 4000

type MessageType = "error" | "success" | "info"

const colors = {
    error: "red",
    success: "green",
    info: "blue",
}

export const showMessage = (text: string, messageType: MessageType) => {
    messages.value.push({
        color: colors[messageType],
        text: text,
        show: true,
    })
}
