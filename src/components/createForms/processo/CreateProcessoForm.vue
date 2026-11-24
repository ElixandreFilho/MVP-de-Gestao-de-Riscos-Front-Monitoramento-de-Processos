<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from "vue"
import TreeViewField from "../../TreeViewField.vue"
import { notEmptyRule, objectNotEmptyRule } from "../../../core/textFieldRules"
import { processo, processoDefault } from "./processo"
import type { VForm } from "vuetify/components"
import { IconPencilPlus } from "@tabler/icons-vue"
import type { Usuario } from "../../../types/usuario"
import userService from "../../../services/userService"
import { userInfo } from "../../../services/keycloakService"
import { getUnidadeTree, unidadesTree, type TreeNode } from "../../../core/unidades"
import { showMessage } from "../../snackbar/SnackbarState"
import processoService from "../../../services/processoService"
import type { Processo } from "../../../types/processo"
import { useUnidadeStore } from "../../../stores/unidadeStore"

const props = defineProps<{
    closeDialog: () => void
    processoEdicao?: Processo | null
}>()

const form: Ref<VForm | undefined> = ref()
const responsaveis: Ref<Usuario[]> = ref([])
const unidadeTree: Ref<TreeNode[] | undefined> = ref()
const processoId = ref<number | null>(null)
const isEditing = computed(() => !!props.processoEdicao)

const unidadeStore = useUnidadeStore()
const isAdmin = computed (() => unidadeStore.isAdmin)

const loadTree = () => {
    if (isAdmin.value) {
        unidadeTree.value = unidadesTree.value
    } else {
        unidadeTree.value = [getUnidadeTree(unidadeStore.unidade?.id ?? 0)!]
    }
}


watch(
    () => props.processoEdicao,
    async (novo) => {
        if (novo) {
            processoId.value = novo.id

            if (!unidadeTree.value) {
                loadTree()
            }

            const unidadeNode = getUnidadeTree(novo.unidadeOrganizacional?.id)
            processo.value.unidadeOrganizacional = unidadeNode ?? { id: null }

            if (novo.unidadeOrganizacional?.id) {
                responsaveis.value = await userService.findResponsaveis(
                    novo.unidadeOrganizacional.id
                )
            }

            processo.value.responsavel = { id: novo.responsavel?.id ?? null }

            processo.value.nome = novo.nome
            processo.value.objetivosGerais = novo.objetivosGerais
            processo.value.objetivosEstrategicos = novo.objetivosEstrategicos
        } else {
            form.value?.reset()
            processo.value = { ...processoDefault }
            processoId.value = null
        }
    },
    { immediate: true }
)

watch(
    () => processo.value.unidadeOrganizacional,
    async (newUnit, oldUnit) => {
        if (processo.value?.unidadeOrganizacional?.id) {
            responsaveis.value = await userService.findResponsaveis(
                processo.value.unidadeOrganizacional.id
            )
        } else {
            responsaveis.value = []
        }

        const hasUnidadeChanged = newUnit?.id !== oldUnit?.id

        if(hasUnidadeChanged || responsaveis.value.length === 0) {
            processo.value.responsavel.id = null
        }

        if (!isEditing.value) {
            processo.value.responsavel.id = null
        }
    },
    { deep: true }
)

onMounted(async () => {
    const user = await userService.getUserByKeycloakId(userInfo.value.keycloakId)
    if(isAdmin.value){
        unidadeTree.value = unidadesTree.value
    }
    else{
        unidadeTree.value = [getUnidadeTree(user.unidadeOrganizacional?.id ?? 0)!]
    }

})

const salvarProcesso = async () => {
    const { valid } = await form.value!.validate()
    if (!valid) {
        showMessage("Preencha todos os campos obrigatórios.", "error")
        return
    }
    try {
        if (isEditing.value) {
            if (processoId.value == null) {
                throw new Error("ID não encontrado para edição")
            }

            await processoService.update(processo.value, processoId.value)

            showMessage("Processo atualizado com sucesso!", "success")
        } else {
            await processoService.post(processo.value)

            showMessage("Processo criado com sucesso!", "success")
        }

        form.value?.reset()
        processo.value = { ...processoDefault }
        processoId.value = null
        props.closeDialog()
    } catch {
        showMessage(
            isEditing.value ? "Erro ao atualizar processo." : "Erro ao criar processo.",
            "error"
        )
    }
}

const cancel = () => {
    form.value?.reset()
    props.closeDialog()
}

</script>

<template>
    <VForm ref="form">
        <VCard style="padding: 20px" class="col processo-card">
            <div class="row" style="align-items: center; margin-bottom: 20px; margin-left: 5px">
                <div
                    style="
                        padding: 6px;
                        border-radius: 8px;
                        background: rgb(var(--v-theme-primary));
                    "
                >
                    <IconPencilPlus color="white" style="vertical-align: bottom"></IconPencilPlus>
                </div>
                <h2>{{ isEditing ? "Editar Processo" : "Criar Processo" }}</h2>
            </div>
            <div style="padding: 0 20px; gap: 15px" class="col">
                <VTextField
                    label="Nome do Processo"
                    :rules="[notEmptyRule]"
                    v-model="processo.nome"
                ></VTextField>
                <TreeViewField
                    placeholder="Selecione a unidade"
                    :items="unidadeTree ?? []"
                    :rules="[objectNotEmptyRule]"
                    label="Unidade Responsável"
                    v-model="processo.unidadeOrganizacional"
                    color="hsl(0,0%,65%)"
                    class="treeField"
                    :max-chars="45"
                >
                </TreeViewField>
                <VSelect
                    label="Responsável"
                    :items="responsaveis"
                    item-title="nome"
                    item-value="id"
                    :rules="[objectNotEmptyRule]"
                    v-model="processo.responsavel.id"
                    :disabled="false"
                    placeholder="Selecione um responsável"
                >
                    <template #no-data>
                        <div style="padding: 10px; opacity: 0.7">Nenhum responsável vinculado.</div>
                    </template>
                </VSelect>
                <VTextarea
                    v-model="processo.objetivosGerais"
                    label="Objetivos Gerais"
                    :rules="[notEmptyRule]"
                    bg-color="white"
                    variant="outlined"
                    auto-grow
                    max-rows="5"
                ></VTextarea>
                  <VTextarea
                    v-model="processo.objetivosEstrategicos"
                    label="Objetivos Estratégicos"
                    :rules="[notEmptyRule]"
                    bg-color="white"
                    variant="outlined"
                    auto-grow
                    max-rows="5"
                ></VTextarea>
            </div>
            <div class="row" style="justify-content: end">
                <VBtn variant="outlined" @click="cancel">Cancelar</VBtn>
                <VBtn @click="salvarProcesso">Confirmar</VBtn>
            </div>
        </VCard>
    </VForm>
</template>

<style scoped>
.processo-card {
    max-height: 100%;
    overflow-y: auto;
}

.treeField {
    height: 56px !important;
    margin-bottom: 23px;
    place-content: center start;
    color: black !important;
    border: 1px solid hsl(0, 0%, 70%);
}
</style>
