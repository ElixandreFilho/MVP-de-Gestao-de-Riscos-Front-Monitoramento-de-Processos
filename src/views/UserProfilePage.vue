<script setup lang="ts">
import { computed, ref, watch, type Ref } from "vue"
import keycloakService, { userInfo } from "../services/keycloakService"
import { IconArrowBackUp, IconEdit, IconInfoCircle, IconX } from "@tabler/icons-vue"
import type { ValidationResult } from "vuetify/lib/composables/validation.mjs"
import TabTransition from "../components/tabTransition/TabTransition.vue"
import userService from "../services/userService"
import type { Papel } from "../types/enums/papel"
import type { AtualizacaoPerfilUsuario } from "../types/usuario"
import { emailRule, fullNameRule, nameRule, notEmptyRule } from "../core/textFieldRules"
import { showMessage } from "../components/snackbar/SnackbarState"
import axios from "axios"

const getInitialValue = (): AtualizacaoPerfilUsuario => ({
    email: userInfo.value.email,
    nomeSocial: userInfo.value.nomeSocial,
    nome: userInfo.value.nome,
    idKeycloak: userInfo.value.keycloakId,
    papeis: [userInfo.value.papel] as Papel[],
})

let initialValue = getInitialValue()

const user = ref({ ...initialValue })
const validated = ref()
const passwords = ref(["", ""])
const oldPassword = ref("")
const isSamePassword = ref(true)
const error: Ref<string | null> = ref("")
const tab = ref(0)
const editing = ref(false)

const modified = computed(() => {
    return fields.value.some((x) => x.modified) || passwords.value[0] !== ""
})

const fields: Ref<
    {
        name: string
        value: keyof typeof user.value
        rules: ((value: string) => ValidationResult)[]
        permanent?: boolean
        modified?: boolean
    }[]
> = ref([
    {
        name: "Nome",
        value: "nome",
        rules: [nameRule, fullNameRule, notEmptyRule],
    },
    {
        name: "Email",
        value: "email",
        rules: [emailRule, notEmptyRule],
    },
    { name: "Nome Social", value: "nomeSocial", rules: [nameRule] },
])

const setFieldValue = <K extends keyof typeof initialValue>(value: K) => {
    user.value[value] = initialValue[value] as (typeof user.value)[K]
}

const save = async () => {
    editing.value = false
    tab.value = 0

    try {
        await userService.updateUser(user.value)

        if (isSamePassword.value && passwords.value[0] !== "") {
            await userService.updatePassword(
                user.value.idKeycloak,
                passwords.value[0] ?? "",
                oldPassword.value
            )
        }

        await keycloakService.reloadUserData()

        resetValues()

        showMessage("Dados atualizados com sucesso", "success")
    } catch (e) {
        if (axios.isAxiosError(e)) {
            showMessage(e.response?.data, "error")
        }

        showMessage("Erro ao atualizar dados de perfil", "error")
    }
}

const cancel = () => {
    tab.value = 0
    editing.value = false
    resetValues()
    showMessage("Operação cancelada", "info")
}

const resetValues = () => {
    initialValue = getInitialValue()

    Object.assign(user.value, initialValue)

    for (let field of fields.value) {
        field.modified = false
    }

    passwords.value = ["", ""]
    oldPassword.value = ""
}

watch(
    passwords,
    (passwords) => {
        isSamePassword.value = passwords[0] === passwords[1]
        error.value = isSamePassword.value ? null : "Senhas divergem"
    },
    { deep: true }
)
</script>

<template>
    <VContainer class="col" style="height: 100%">
        <div class="fields col">
            <VBtn
                :style="{
                    height: editing ? '0' : '36px',
                    opacity: editing ? 0 : 1,
                    marginBottom: editing ? '0' : '30px',
                }"
                style="place-self: end"
                class="fadedButton"
                @click="
                    () => {
                        editing = true
                    }
                "
                >Editar <IconEdit stroke-width="1.5"></IconEdit>
            </VBtn>

            <VForm v-model="validated" class="col" style="gap: 30px">
                <div class="row" style="gap: 30px">
                    <VTextField
                        label="Username"
                        :model-value="userInfo.username"
                        :readonly="true"
                        style="height: 56px; flex: 1"
                    ></VTextField>
                    <div
                        class="infoCard"
                        style="width: fit-content; padding: 15px; align-content: center"
                    >
                        <IconInfoCircle
                            stroke-width="1.5"
                            style="vertical-align: bottom"
                        ></IconInfoCircle>
                        O username não pode ser modificado
                    </div>
                </div>
                <VTextField
                    v-model="user[field.value]"
                    :label="field.name"
                    :readonly="!field.permanent ? !editing : true"
                    style="height: 56px"
                    v-for="field in fields"
                    :key="field.name"
                    :placeholder="`Sem ${field.name}`"
                    :rules="field.rules"
                    @update:model-value="
                        () => {
                            if (user[field.value] === initialValue[field.value]) {
                                field.modified = false
                            } else {
                                field.modified = true
                            }
                        }
                    "
                >
                    <template #append-inner v-if="field.modified">
                        <VTooltip>
                            <template #activator="{ props }">
                                <VBtn
                                    style="padding: 5px"
                                    v-bind="props"
                                    @click="
                                        () => {
                                            field.modified = false
                                            setFieldValue(field.value)
                                        }
                                    "
                                    ><IconArrowBackUp></IconArrowBackUp>
                                </VBtn>
                            </template>
                            Desfazer mudança
                        </VTooltip>
                    </template>
                </VTextField>

                <TabTransition :tab-slots="2" v-model="tab">
                    <template #0>
                        <div class="row" style="gap: 20px">
                            <div class="row infoCard">
                                <div>
                                    <IconInfoCircle
                                        stroke-width="1.5"
                                        style="vertical-align: bottom"
                                    ></IconInfoCircle>
                                    Por razões de segurança a sua senha não pode ser visualizada.
                                    Clique em editar para mudar a senha.
                                </div>
                                <VBtn
                                    class="fadedButton"
                                    :style="{
                                        height: editing ? '35px' : 0,
                                        opacity: editing ? 1 : 0,
                                    }"
                                    @click="
                                        () => {
                                            tab = 1
                                        }
                                    "
                                    >Mudar Senha</VBtn
                                >
                            </div>
                        </div>
                    </template>
                    <template #1>
                        <div class="col" style="gap: 10px">
                            <div
                                style="align-items: center; margin-bottom: 20px"
                                class="infoCard row"
                            >
                                <VTooltip>
                                    <template #activator="{ props }">
                                        <VBtn
                                            v-bind="props"
                                            @click="
                                                () => {
                                                    tab = 0
                                                    passwords = ['', '']
                                                }
                                            "
                                            style="padding: 5px"
                                            ><IconX></IconX
                                        ></VBtn> </template
                                    >Cancelar mudança de senha
                                </VTooltip>
                                <div>
                                    <IconInfoCircle style="vertical-align: bottom"></IconInfoCircle>
                                    Para confirmar a mudança de senha clique em salvar
                                </div>
                            </div>
                            <VTextField
                                label="Senha antiga"
                                type="password"
                                v-model="oldPassword"
                                :rules="[notEmptyRule]"
                            ></VTextField>
                            <VTextField
                                label="Nova Senha"
                                type="password"
                                v-model="passwords[0]"
                                :error-messages="error"
                                :rules="[notEmptyRule]"
                            ></VTextField>
                            <VTextField
                                label="Confirmar Senha"
                                type="password"
                                v-model="passwords[1]"
                                :error-messages="error"
                                :rules="[notEmptyRule]"
                            ></VTextField>
                        </div>
                    </template>
                </TabTransition>
            </VForm>
        </div>
        <div
            class="row floatingActionBar"
            :style="{
                opacity: editing ? 1 : 0,
                width: editing ? '100%' : '0%',
            }"
        >
            <VBtn @click="cancel">Cancelar</VBtn
            ><VBtn @click="save" :disabled="!validated || !modified">Salvar</VBtn>
        </div>
    </VContainer>
</template>

<style>
.fields {
    margin-bottom: 20px;
}
.fields > * {
    text-align: start;
}
.infoCard {
    --info-border: 1px solid hsl(0, 0%, 70%);
    border: var(--info-border);
    border-radius: 10px;
    background: none;
    padding: 10px;
    gap: 10px;
    flex: 1;
    min-width: 200px;
    align-items: center;
}
.fadedButton {
    transition: all 0.5s;
    place-content: center;
}
.floatingActionBar {
    justify-content: space-between;
    padding: 10px;
    bottom: 0;
    position: sticky;
    transition: all 0.5s;
    place-self: center;
    border: var(--border);
    background: white;
    border-radius: 10px;
    margin-top: auto;
    overflow: hidden;
    flex-wrap: nowrap;
    flex-shrink: 0;
}
</style>
