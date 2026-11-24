import { createApp } from "vue"
import "./style.css"
import keycloakService from "./services/keycloakService"

const initialize = async () => {
    await keycloakService.init()
    await keycloakService.getUserId()
    createApp((await import("./App.vue")).default)
        .use((await import("./stores/index")).default)
        .use((await import("./router")).default)
        .use((await import("./plugins/vuetify")).default)
        .mount("#app")
}
initialize()
