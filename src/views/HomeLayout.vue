<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { getNavCategories } from "../core/actions"
import { useDisplay } from "vuetify"
import { IconBell, IconLogout, IconMenu2, IconUser } from "@tabler/icons-vue"
import router from "../router"
import keycloakService, { userInfo } from "../services/keycloakService"
import { useUnidadeStore } from "../stores/unidadeStore"
import { useMonitoramentoStore } from "../stores/monitoramentoStore"

const route = useRoute()

const unidadeStore = useUnidadeStore()
const monitoramentoStore = useMonitoramentoStore()
const isAdmin = computed(() => unidadeStore.isAdmin)
const isMonitoramentoContext = computed(() => String(route.name || "").startsWith("Monitoramento"))
const notificationRoute = computed(() => isMonitoramentoContext.value ? "MonitoramentoNotificacoes" : "Notificacoes")

const navCategoriesFiltradas = computed(() => {
    const navCategories = getNavCategories(isAdmin.value, userInfo.value.roles)
    
    return navCategories.map(category => ({
        ...category,
        actions: category.actions.filter(action => {
            if (action.to === "Units" && !isAdmin.value) {
                return false
            }
            return true
        })
    })).filter(category => category.actions.length > 0) 
})

const title = computed(() => route.meta.title)
const activeNav = computed(() => route.meta.activeNav ?? route.name)
const { mdAndUp } = useDisplay()
const isDrawerOpen = ref(mdAndUp)

const userOptionsSet = {
    logout: {
        name: "Sair",
        icon: "Logout",
        action: keycloakService.logout,
    },
    options: {
        name: "Perfil",
        icon: "Settings",
        action: () => router.push("/userprofile")
    },
}

const userOptions = computed(() =>
    userInfo.value.papel === ""
        ? [userOptionsSet.logout]
        : [userOptionsSet.options, userOptionsSet.logout]
)

const unidadeNome = ref("")
const unidadeSigla = ref("")

onMounted(async () => {
    await unidadeStore.loadUnidade()
    unidadeNome.value = unidadeStore.unidade?.nome ?? ""
    unidadeSigla.value = unidadeStore.unidade?.sigla ?? ""
})
</script>

<template>
    <VApp>
        <VNavigationDrawer
            color="primary"
            style="border-right: var(--border)"
            mobile-breakpoint="md"
            v-model="isDrawerOpen"
            :absolute="mdAndUp"
        >
            <div class="navButtons col">
                <img class="logo" src="/static/logo.png" alt="Logo" />

                <h2>Gestão de Riscos</h2>

                <div class="subTitle">
                    <VTooltip :text="unidadeNome" location="bottom">
                        <template #activator="{ props }">
                            <h4 v-bind="props" class="twoLineClamp">
                                {{ unidadeNome }}
                            </h4>
                        </template>
                    </VTooltip>

                    <h4>{{ unidadeSigla }}</h4>
                </div>

                <VDivider color="white" style="margin: 10px 0"></VDivider>

                <template v-for="category in navCategoriesFiltradas" :key="category.category">
                    <p>{{ category.category }}</p>

                    <VBtn
                        v-for="action in category.actions"
                        :key="action.title"
                        @click="() => { router.push({ name: action.to }) }"
                        :class="activeNav === action.to ? 'selected' : ''"
                    >
                        <component class="navIcon" :is="action.icon"></component>
                        {{ action.title }}
                    </VBtn>
                </template>

                <VBtn style="margin-top: auto" :onclick="() => keycloakService.logout()">
                    <IconLogout class="navIcon"></IconLogout> Sair
                </VBtn>
            </div>
        </VNavigationDrawer>
        <VMain
            :style="{ padding: mdAndUp ? '' : '0', display: 'flex', flexDirection: 'column' }"
        >
            <VContainer class="titleBar row">
                <VBtn
                    @click="() => { isDrawerOpen = !isDrawerOpen }"
                    style="width: fit-content; padding: 5px"
                    color="white"
                >
                    <IconMenu2></IconMenu2>
                </VBtn>
                <h2>{{ title }}</h2>
                <div class="titleBarActions">
                    <VTooltip text="Notificações" location="bottom">
                        <template #activator="{ props }">
                            <VBtn
                                v-bind="props"
                                color="white"
                                class="notificationButton"
                                :class="{ 'notificationButton--active': route.name === 'Notificacoes' || route.name === 'MonitoramentoNotificacoes' }"
                                aria-label="Notificações"
                                @click="router.push({ name: notificationRoute })"
                            >
                                <IconBell size="20" />
                                <span v-if="isMonitoramentoContext && monitoramentoStore.naoLidas" class="notificationBadge">{{ monitoramentoStore.naoLidas }}</span>
                            </VBtn>
                        </template>
                    </VTooltip>
                    <VMenu
                        class="userSelect"
                        density="compact"
                        variant="outlined"
                        hide-details
                        item-title="name"
                        :items="userOptions"
                        prepend-inner-icon="User"
                    >
                        <template #activator="{ props }">
                            <VBtn
                                v-bind="props"
                                color="white"
                                density="compact"
                                class="userSelectButton"
                            >
                                <IconUser style="width: 20px; height: 20px"></IconUser>
                                <VDivider
                                    vertical
                                    opacity="0.5"
                                    thickness="1"
                                    color="black"
                                    style="margin: 0 10px"
                                ></VDivider>
                                <span style="overflow: hidden; flex: 1; text-overflow: ellipsis">
                                    {{
                                        userInfo.nomeSocial.trim() !== ""
                                            ? userInfo.nomeSocial
                                            : userInfo.nome
                                    }}
                                </span>
                            </VBtn>
                        </template>
                        <VList
                            class="col"
                            style="
                                padding: 10px !important;
                                border-radius: 8px;
                                box-shadow: 0px 0px 6px 2px hsl(210, 50%, 0%, 20%) !important;
                            "
                            elevation="0"
                        >
                            <VBtn
                                v-for="item in userOptions"
                                :key="item.name"
                                :value="item.name"
                                variant="tonal"
                                class="userSelectOption"
                                style="place-content: start"
                                @click="() => item.action()"
                            >
                                <div
                                    class="row"
                                    style="align-items: center; gap: 5px; padding-left: 5px"
                                >
                                    <VIcon class="row" size="18">{{ item.icon }}</VIcon
                                    >{{ item.name }}
                                </div>
                            </VBtn>
                        </VList>
                    </VMenu>
                </div>
            </VContainer>
            <VContainer style="margin: 0; height: 100%; position: relative; overflow: auto" fluid>
                <router-view></router-view>
            </VContainer>
        </VMain>
    </VApp>
</template>

<style>
h2,
h4 {
    font-weight: normal;
}
p {
    font-size: small;
}
h2,
p {
    padding: 5px 10px;
}
.subTitle {
    padding: 0 10px;
    gap: 5px;
}
.twoLineClamp {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-word;
}
button.selected {
    background: hsl(0, 0%, 100%, 20%) !important;
    color: hsl(200, 10%, 100%) !important;
}
.navButtons > * {
    text-align: left;
}
.navButtons > button {
    border-radius: 5px !important;
    justify-content: flex-start;
    padding: 5px 5px;
    margin: 0 5px;
    text-transform: capitalize;
    height: fit-content !important;
}
.navButtons {
    gap: 5px !important;
    padding: 20px 10px;
    height: 100%;
}
.titleBar {
    margin: 0 !important;
    border-bottom: var(--border);
    justify-content: start;
    align-items: center;
    max-width: none !important;
    background: white;
}
.titleBarActions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}
.notificationButton {
    width: 42px !important;
    min-width: 42px !important;
    height: 42px !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 8px !important;
}
.notificationButton--active {
    color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 0.1) !important;
}
.notificationButton {
    position: relative;
}
.notificationBadge {
    position: absolute;
    top: 3px;
    right: 3px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 9px;
    color: white;
    background: #c62828;
    font-size: 10px;
    line-height: 16px;
}
.navIcon {
    margin-right: 10px;
    width: 30px;
    height: 30px;
    border: 1px solid hsl(200, 10%, 100%, 50%);
    border-radius: 5px;
    padding: 3px;
}
#app {
    margin: 0;
    width: 100%;
}
.userSelect > * > * {
    padding: 0px 5px !important;
}
.userSelect {
    margin-right: 10px;
}
.userSelectButton,
.userSelectButton > * {
    overflow: hidden;
    flex: 1;
    text-transform: capitalize;
}
.userSelectButton {
    padding: 0 8px;
    display: flex;
    width: auto !important;
    height: auto !important;
    flex: 1;
    border: none !important;
    background: hsl(0, 0%, 100%, 20%);
    padding: 10px !important;
    font-size: 16px;
    max-width: 300px;
}
div:has(> div > .userSelectOption) {
    padding: 4px 0;
}
.userSelectOption {
    padding: 5px;
    gap: 5px;
    display: flex;
    align-items: center;
    transition: background 0.5s;
}
.userSelectOption:hover {
    background: hsl(0, 0%, 100%, 30%) !important;
}
.logo {
    border-radius: 10px;
    padding: 5px;
    margin: 0 10px;
    background: hsl(200, 10%, 90%);
    width: 46px;
    height: 46px;
}
</style>

