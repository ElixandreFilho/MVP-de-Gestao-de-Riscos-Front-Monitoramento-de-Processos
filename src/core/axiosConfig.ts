import axios from "axios"
import { JsogService } from "jsog-typescript"
import { installMockApi } from "../mocks/mockApi"

axios.defaults.baseURL = ""
installMockApi()

const jsog = new JsogService()

axios.interceptors.response.use(
    (response) => {
        if (
            response.config.responseType === "blob" ||
            response.config.responseType === "arraybuffer"
        ) {
            return response
        }

        response.data = jsog.deserialize(response.data)
        return response
    },
    async (error) => {
        if (error.response?.data instanceof Blob) {
            const responseText = await error.response.data.text()

            if (responseText.trim()) {
                try {
                    error.response.data = JSON.parse(responseText)
                } catch {
                    error.response.data = responseText
                }
            }
        }

        throw error

    }
)

const configureAxios = (token = "") => {
    axios.interceptors.request.clear()
    axios.interceptors.request.use((request) => {
        if (token) {
            request.headers.Authorization = token
        }
        return request
    })
}
export default configureAxios
