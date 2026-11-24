<script setup lang="ts">
import userService from "../services/userService"
import { useUserPageStore } from "../stores/userPageStore"
import { useUnidadeStore } from "../stores/unidadeStore"
import { Papel, type FuncaoKeycloak, type PapelOption } from "../types/enums/papel"

import type { UnidadeOrganizacional } from "../types/unidadeOrganizacional"
import type { Usuario } from "../types/usuario"
import { computed, onMounted, ref, watch } from "vue"
import { showMessage } from "./snackbar/SnackbarState"
import { labelFuncao, papelPadrao } from "../core/papeis"

type UsuarioTabela = Usuario & { funcaoKeycloak?: FuncaoKeycloak | null }

const searchQuery = ref("")
const loading = ref(false)
const snackbarText = ref("")
const users = ref<UsuarioTabela[]>([])
const usuariosVinculadosList = ref<UsuarioTabela[]>([])
const usuariosDesvinculadosList = ref<UsuarioTabela[]>([])
const usuariosComVinculoAlterado = ref<Set<number>>(new Set())
const usuariosComFuncaoAlterada = ref<Set<number>>(new Set())
const usuariosVinculadosListInitial = ref<UsuarioTabela[]>([])
const usuariosDesvinculadosListInitial = ref<UsuarioTabela[]>([])
const confirmDialog = ref(false)
const uoRef = ref<UnidadeOrganizacional>()
const loadingAlteracoes = ref(false)
const funcoesDisponiveis = ref<PapelOption[]>([])

const userPageStore = useUserPageStore()
const unidadeStore = useUnidadeStore()

const headers = [
    { title: "Nome", value: "nome", key: "nome", sortable: true, align: "start" as const },
    { title: "Email", value: "email", key: "email", sortable: true, align: "start" as const },
    { title: "Função", value: "funcaoKeycloak", key: "funcaoKeycloak", sortable: false, align: "start" as const },
    { title: "Vinculado", value: "vinculado", key: "vinculado", align: "end" as const },
]
const slotFuncao = "item.funcaoKeycloak"
const slotVinculado = "item.vinculado"

const Funcao = {
    USUARIOS_DA_UNIDADE: "usuariosDaUnidade",
    USUARIOS_DESVINCULADOS: "usuariosDesvinculados",
} as const

const props = defineProps<{
    titulo: string
    descricao: string
    funcao: string
    openDialog?: boolean
    reset?: boolean
}>()

const emits = defineEmits<{
    (e: "update:reset", value: boolean): void
    (e: "update:openDialog", value: boolean): void
}>()

const { funcao } = props
const mudançasLocais = computed(
    () => usuariosComVinculoAlterado.value.size > 0 || usuariosComFuncaoAlterada.value.size > 0
)

watch(
    () => unidadeStore.unidade,
    async (newUO) => {
        if (newUO && funcao === Funcao.USUARIOS_DA_UNIDADE) {
            await carregarPapeisDisponiveis(newUO.id)
            await usuariosDaUnidade()
        } else if (newUO && funcao === Funcao.USUARIOS_DESVINCULADOS) {
            await carregarPapeisDisponiveis(newUO.id)
            await usuariosDesvinculados()
        }
    }
)

watch(
    () => mudançasLocais.value,
    (temMudancas) => {
        userPageStore.setHasPendingChanges(temMudancas)
    },
    { immediate: true }
)

watch(
    () => props.openDialog,
    (newVal) => {
        if (newVal) {
            confirmDialog.value = true
        }
    }
)

watch(
    () => props.reset,
    (newVal) => {
        if (newVal) {
            resetToInitial()
            emits("update:reset", false)
        }
    }
)

watch(confirmDialog, (newVal) => {
    if (!newVal) {
        emits("update:openDialog", false)
    }
})

const unidadeOrganizacionalStore = computed(() => unidadeStore.unidade)

const itemsActived = computed(() => {
    if (funcao === Funcao.USUARIOS_DA_UNIDADE) {
        return usuariosVinculadosList.value
    } else if (funcao === Funcao.USUARIOS_DESVINCULADOS) {
        return usuariosDesvinculadosList.value
    } else {
        return users.value
    }
})

function openConfirmDialog() {
    confirmDialog.value = true
}

function toggleVinculacao(user: UsuarioTabela) {
    const usuarioInicial = usuarioInicialPorId(user.id)

    if (usuariosComVinculoAlterado.value.has(user.id)) {
        usuariosComVinculoAlterado.value.delete(user.id)
    } else {
        usuariosComVinculoAlterado.value.add(user.id)
    }

    if (estaVinculado(user) && !user.funcaoKeycloak) {
        user.funcaoKeycloak = usuarioInicial?.funcaoKeycloak ?? papelPadrao(funcoesDisponiveis.value)
    }

    if (!estaVinculado(user)) {
        user.funcaoKeycloak = null
    }

    sincronizarAlteracaoFuncao(user)
}

function estaVinculado(user: UsuarioTabela) {
    const isInitiallyVinculado = funcao === Funcao.USUARIOS_DA_UNIDADE

    if (usuariosComVinculoAlterado.value.has(user.id)) {
        return !isInitiallyVinculado
    }

    return isInitiallyVinculado
}

function alterarFuncao(user: UsuarioTabela, funcao: FuncaoKeycloak | null) {
    user.funcaoKeycloak = funcao
    sincronizarAlteracaoFuncao(user)
}

function sincronizarAlteracaoFuncao(user: UsuarioTabela) {
    const usuarioInicial = usuarioInicialPorId(user.id)
    const funcaoInicial = usuarioInicial?.funcaoKeycloak ?? null

    if (estaVinculado(user) && user.funcaoKeycloak !== funcaoInicial) {
        usuariosComFuncaoAlterada.value.add(user.id)
    } else {
        usuariosComFuncaoAlterada.value.delete(user.id)
    }
}

function usuarioInicialPorId(userId: number): UsuarioTabela | undefined {
    return [...usuariosVinculadosListInitial.value, ...usuariosDesvinculadosListInitial.value].find(
        (usuario) => usuario.id === userId
    )
}

function funcaoAtual(user: UsuarioTabela): FuncaoKeycloak | null {
    if (!estaVinculado(user)) return null
    return user.funcaoKeycloak ?? papelPadrao(funcoesDisponiveis.value)
}

async function salvaAlteracoes() {
    const usuariosAlterados = [...usuariosVinculadosList.value, ...usuariosDesvinculadosList.value]
        .filter((u) => usuariosComVinculoAlterado.value.has(u.id) || usuariosComFuncaoAlterada.value.has(u.id))

    usuariosAlterados.forEach((e) => {
        if (estaVinculado(e)) {
            e.papel = uoRef.value?.isAdmin ? Papel.SECGOV : Papel.UNIT
            e.funcaoKeycloak = funcaoAtual(e)
            e.unidadeOrganizacional = uoRef.value as UnidadeOrganizacional
            return
        }

        e.papel = null
        e.funcaoKeycloak = null
        e.unidadeOrganizacional = null
    })

    try {
        loadingAlteracoes.value = true

        for (const user of usuariosAlterados) {
            await userService.updateUser(user)
        }

        if (funcao === Funcao.USUARIOS_DA_UNIDADE) {
            snackbarText.value = `Foram atualizados ${usuariosAlterados.length} usuários`
        } else if (funcao === Funcao.USUARIOS_DESVINCULADOS) {
            snackbarText.value = `Foram vinculados ${usuariosAlterados.length} usuários`
        }

        showMessage(snackbarText.value, "success")
    } catch (error) {
        console.error("Erro na vinculação de usuários: ", error)
    } finally {
        loadingAlteracoes.value = false
    }
}

function cancelChanges() {
    resetToInitial()
    confirmDialog.value = false
}

async function confirmChanges() {
    await salvaAlteracoes()

    usuariosComVinculoAlterado.value.clear()
    usuariosComFuncaoAlterada.value.clear()

    if (funcao === Funcao.USUARIOS_DA_UNIDADE) {
        await usuariosDaUnidade()
    } else if (funcao === Funcao.USUARIOS_DESVINCULADOS) {
        await usuariosDesvinculados()
    }
    userPageStore.acionarReload(true)
    confirmDialog.value = false
}

function resetToInitial() {
    usuariosVinculadosList.value = JSON.parse(JSON.stringify(usuariosVinculadosListInitial.value))
    usuariosDesvinculadosList.value = JSON.parse(
        JSON.stringify(usuariosDesvinculadosListInitial.value)
    )

    usuariosComVinculoAlterado.value.clear()
    usuariosComFuncaoAlterada.value.clear()
    userPageStore.setHasPendingChanges(false)
}

async function carregarPapeisDisponiveis(unidadeId: number) {
    try {
        funcoesDisponiveis.value = await userService.getPapeisDisponiveis(unidadeId)
    } catch (error) {
        funcoesDisponiveis.value = []
        console.error("Erro ao carregar papéis disponíveis. Err: " + error)
    }
}

async function usuariosDaUnidade() {
    loading.value = true
    try {
        if (unidadeOrganizacionalStore.value) {
            const loadedUsers = await userService.findResponsaveis(
                unidadeOrganizacionalStore.value?.id
            )
            uoRef.value = unidadeOrganizacionalStore.value as UnidadeOrganizacional

            const mappedUsers = loadedUsers.map((user) => {
                return {
                    ...user,
                    funcaoKeycloak: user.funcaoKeycloak ?? papelPadrao(funcoesDisponiveis.value),
                }
            })

            users.value = mappedUsers
            usuariosVinculadosList.value = mappedUsers.filter(
                (u) => u.unidadeOrganizacional?.id == uoRef.value?.id
            )
            usuariosVinculadosListInitial.value = JSON.parse(
                JSON.stringify(usuariosVinculadosList.value)
            )
        }
    } catch (error) {
        console.error("Erro ao carregar os usuários da unidade. Err: " + error)
    } finally {
        loading.value = false
    }
}

async function usuariosDesvinculados() {
    loading.value = true
    try {
        const loadedUsers = await userService.getUsersWithoutUO()
        uoRef.value = unidadeOrganizacionalStore.value as UnidadeOrganizacional

        const mappedUsers = loadedUsers.map((user) => {
            return {
                ...user,
            }
        })

        usuariosDesvinculadosList.value = mappedUsers
        usuariosDesvinculadosListInitial.value = JSON.parse(JSON.stringify(mappedUsers))
    } catch (error) {
        console.error("Erro ao carregar os usuários desvinculados. Err: " + error)
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    loading.value = true

    if (unidadeOrganizacionalStore.value?.id) {
        await carregarPapeisDisponiveis(unidadeOrganizacionalStore.value.id)
    }

    if (funcao === Funcao.USUARIOS_DA_UNIDADE) {
        await usuariosDaUnidade()
    } else if (funcao === Funcao.USUARIOS_DESVINCULADOS) {
        await usuariosDesvinculados()
    }
})
</script>

<template>
    <v-card class="col">
        <div class="col">
            <h3 id="title">{{ props.titulo }}</h3>

            <h4 id="subtitle">{{ props.descricao }}</h4>
            <v-text-field
                variant="solo"
                class="filledField"
                bg-color="hsl(0,0%,95%)"
                density="compact"
                v-model="searchQuery"
                prepend-inner-icon="Search"
                placeholder="Pesquisar por nome, email, nome de usuário ou unidade"
            ></v-text-field>
        </div>

        <v-data-table
            :headers="headers"
            :items="itemsActived"
            :item-value="(item: UsuarioTabela) => item.id"
            :search="searchQuery"
            :loading="loading"
        >
            <template #[slotFuncao]="{ item }">
                <span v-if="!estaVinculado(item)">-</span>
                <v-select
                    v-else-if="funcoesDisponiveis.length"
                    :model-value="funcaoAtual(item)"
                    :items="funcoesDisponiveis"
                    item-title="label"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="min-width: 140px"
                    @update:model-value="(value) => alterarFuncao(item, value as FuncaoKeycloak)"
                />
                <span v-else>{{ labelFuncao(item.funcaoKeycloak) }}</span>
            </template>

            <template #[slotVinculado]="{ item }">
                <v-switch
                    :model-value="estaVinculado(item)"
                    @update:model-value="toggleVinculacao(item)"
                    :key="item.id"
                    density="compact"
                    :color="estaVinculado(item) ? 'primary' : 'secondary'"
                    :label="estaVinculado(item) ? 'Vinculado' : 'Desvinculado'"
                >
                </v-switch>
            </template>

            <template #loading>
                <v-container class="fetching-data">
                    <span> Carregando dados... </span>
                </v-container>
            </template>
        </v-data-table>

        <v-card-actions
            class="actions"
            v-if="mudançasLocais && props.funcao == 'usuariosDaUnidade'"
        >
            <v-btn color="primary" variant="outlined" @click="resetToInitial">Cancelar</v-btn>
            <v-btn color="primary" variant="flat" @click="openConfirmDialog">Salvar</v-btn>
        </v-card-actions>

        <v-dialog v-model="confirmDialog" max-width="400">
            <v-card>
                <v-card-title>Confirmar alterações</v-card-title>
                <v-card-text
                    >Deseja realmente salvar as alterações nos vínculos dos usuários?</v-card-text
                >
                <v-card-actions class="actions">
                    <v-btn color="primary" variant="outlined" @click="cancelChanges"
                        >Cancelar</v-btn
                    >
                    <v-btn
                        color="primary"
                        variant="flat"
                        @click="confirmChanges"
                        :loading="loadingAlteracoes"
                        >Confirmar</v-btn
                    >
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<style scoped>
#subtitle {
    color: hsl(0, 0%, 30%);
    margin-bottom: 1.5vh;
}

.no-padding {
    padding: 0;
}

.actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 1vw;
}

.v-switch {
    display: flex;
    place-content: end;
}

.fetching-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1vh;
}
</style>
