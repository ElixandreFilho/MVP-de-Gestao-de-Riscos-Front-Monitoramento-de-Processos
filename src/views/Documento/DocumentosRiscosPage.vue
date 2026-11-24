<script lang="ts">
import { defineComponent, type Component } from "vue"
import { useUnidadeStore } from "../../stores/unidadeStore"
import DatePicker from "../../components/DatePicker.vue"
import documentoService, { isDocumentoNotFoundError } from "../../services/documentoService"
import { getHttpErrorMessage } from "../../core/httpError"
import type { Documento } from "../../types/documento"
import { showMessage } from "../../components/snackbar/SnackbarState"
import {
    IconFileText,
    IconFileTypePdf,
    IconFileSpreadsheet,
    IconFileDescription,
    IconFileTypeDoc,
    IconX,
    IconTrash,
} from "@tabler/icons-vue"

const MAX_FILE_SIZE_MB = 8
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png"]

interface DataTableHeader {
    title: string
    key: string
    align?: "start" | "center" | "end"
    sortable?: boolean
}

export default defineComponent({
    name: "DocumentosRiscos",
    components: {
        DatePicker,
        IconX,
        IconTrash,
    },
    data() {
        return {
            valid: false,
            arquivoSelecionado: null as File | null,
            documentos: [] as Documento[],
            loadingTabela: false,
            loadingUpload: false,
            selecionandoArquivo: false,
            selecionarArquivoTimer: undefined as number | undefined,
            filtros: {
                nome: "",
                dataInicial: "",
                dataFinal: "",
            },
            dialogPreview: false,
            loadingPreview: false,
            documentoAberto: null as Documento | null,
            previewUrl: "" as string,
            previewMime: "" as string,

            dialogDeletar: false,
            documentoParaDeletar: null as Documento | null,
            loadingDeletar: false,
            atualizarDocumentosAoFocarTimer: undefined as number | undefined,

            headers: [
                { title: "DOCUMENTO", key: "nome", align: "start", sortable: false },
                { title: "UPLOAD", key: "criadoEm", sortable: false },
                { title: "AÇÕES", key: "acoes", sortable: false, align: "center", width: "1%", minWidth: "120px", fixed: "end" },
            ] as DataTableHeader[],
        }
    },

    computed: {
        isAdmin(): boolean {
            const unidadeStore = useUnidadeStore()
            return unidadeStore.isAdmin
        },

        documentosFiltrados(): Documento[] {
            const nomeFiltro = this.filtros.nome
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()

            const dataInicial = this.filtros.dataInicial
            const dataFinal = this.filtros.dataFinal

            return this.documentos.filter((documento) => {
                const nomeDocumentoNormalizado = (documento.nome || "")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()

                const correspondeNome = !nomeFiltro || nomeDocumentoNormalizado.includes(nomeFiltro)

                const dataDocumento = documento.criadoEm?.slice(0, 10) ?? ""
                const correspondeDataInicial = !dataInicial || dataDocumento >= dataInicial
                const correspondeDataFinal = !dataFinal || dataDocumento <= dataFinal

                return correspondeNome && correspondeDataInicial && correspondeDataFinal
            })
        },

        temFiltrosAtivos(): boolean {
            return (
                this.filtros.nome.trim() !== "" ||
                this.filtros.dataInicial !== "" ||
                this.filtros.dataFinal !== ""
            )
        },
        nomeArquivoSelecionado(): string {
            return this.arquivoSelecionado?.name?.trim() || "arquivo selecionado"
        },
        isPreviewImagem(): boolean {
            return this.previewMime.startsWith("image/")
        },
        isPreviewPdf(): boolean {
            return this.previewMime === "application/pdf"
        },
    },

    mounted() {
        this.buscarDocumentos()
        globalThis.addEventListener("focus", this.atualizarDocumentosAoFocar)
    },

    beforeUnmount() {
        globalThis.removeEventListener("focus", this.atualizarDocumentosAoFocar)
        if (this.atualizarDocumentosAoFocarTimer) {
            globalThis.clearTimeout(this.atualizarDocumentosAoFocarTimer)
        }
        if (this.selecionarArquivoTimer) {
            globalThis.clearTimeout(this.selecionarArquivoTimer)
        }
    },

    methods: {
        inferirMimePeloNome(nomeArquivo: string): string {
            const nome = (nomeArquivo || "").toLowerCase()
            if (nome.endsWith(".pdf")) return "application/pdf"
            if (nome.endsWith(".png")) return "image/png"
            if (nome.endsWith(".jpg") || nome.endsWith(".jpeg")) return "image/jpeg"
            if (nome.endsWith(".doc") || nome.endsWith(".docx")) return "application/msword"
            if (nome.endsWith(".xls") || nome.endsWith(".xlsx")) return "application/vnd.ms-excel"
            return "application/octet-stream"
        },
        limparPreviewUrl(): void {
            if (this.previewUrl) {
                globalThis.URL.revokeObjectURL(this.previewUrl)
            }
            this.previewUrl = ""
            this.previewMime = ""
        },
        async abrirPreviewDocumento(item: Documento): Promise<void> {
            this.documentoAberto = item
            this.dialogPreview = true
            this.loadingPreview = true

            this.limparPreviewUrl()

            try {
                const blob: Blob = await documentoService.downloadBlob(item.id)
                this.previewMime = blob.type || this.inferirMimePeloNome(item.nome)
                this.previewUrl = globalThis.URL.createObjectURL(blob)
            } catch (error) {
                console.error(error)

                if (isDocumentoNotFoundError(error)) {
                    this.removerDocumentoDaLista(item.id)
                    showMessage(
                        "Documento não encontrado no armazenamento e removido da lista.",
                        "error"
                    )
                    this.dialogPreview = false
                    return
                }

                showMessage(
                    getHttpErrorMessage(error, "Erro ao carregar pré-visualização do arquivo."),
                    "error"
                )
                this.dialogPreview = false
            } finally {
                this.loadingPreview = false
            }
        },
        async baixarDocumentoDoModal(): Promise<void> {
            if (!this.documentoAberto) return
            try {
                await documentoService.baixar(this.documentoAberto)
            } catch (error) {
                console.error(error)
                showMessage(getHttpErrorMessage(error, "Erro ao baixar o arquivo."), "error")
            }
        },

        fecharPreview(): void {
            this.dialogPreview = false
            this.documentoAberto = null
            this.limparPreviewUrl()
        },
        async visualizarDocumento(item: Documento): Promise<void> {
            await this.abrirPreviewDocumento(item)
        },
        obterIconePorExtensao(nomeArquivo: string): Component {
            if (!nomeArquivo) return IconFileText

            const nomeMinusculo = nomeArquivo.toLowerCase()

            if (nomeMinusculo.endsWith(".pdf")) {
                return IconFileTypePdf
            }
            if (nomeMinusculo.endsWith(".doc") || nomeMinusculo.endsWith(".docx")) {
                return IconFileTypeDoc
            }
            if (nomeMinusculo.endsWith(".xls") || nomeMinusculo.endsWith(".xlsx")) {
                return IconFileSpreadsheet
            }
            if (
                nomeMinusculo.endsWith(".png") ||
                nomeMinusculo.endsWith(".jpg") ||
                nomeMinusculo.endsWith(".jpeg")
            ) {
                return IconFileDescription
            }

            return IconFileText
        },
        obterCorPorExtensao(nomeArquivo: string): string {
            const nomeMinusculo = nomeArquivo?.toLowerCase() ?? ""
            if (nomeMinusculo.endsWith(".pdf")) return "#E01A22"
            if (nomeMinusculo.endsWith(".xlsx") || nomeMinusculo.endsWith(".xls")) return "#107C41"
            if (nomeMinusculo.endsWith(".docx") || nomeMinusculo.endsWith(".doc")) return "#185ABD"
            if (nomeMinusculo.endsWith(".png")) return "#E28743"
            return "#5B3DF5"
        },
        async buscarDocumentos(mostrarLoading = true, mostrarErro = true): Promise<void> {
            if (mostrarLoading) {
                this.loadingTabela = true
            }

            try {
                this.documentos = await documentoService.listar()
            } catch (error) {
                console.error(error)
                if (mostrarErro) {
                    showMessage("Erro ao carregar a lista de documentos.", "error")
                }
            } finally {
                if (mostrarLoading) {
                    this.loadingTabela = false
                }
            }
        },

        prepararSelecaoArquivo(): void {
            this.selecionandoArquivo = true

            if (this.atualizarDocumentosAoFocarTimer) {
                globalThis.clearTimeout(this.atualizarDocumentosAoFocarTimer)
                this.atualizarDocumentosAoFocarTimer = undefined
            }

            if (this.selecionarArquivoTimer) {
                globalThis.clearTimeout(this.selecionarArquivoTimer)
            }

            this.selecionarArquivoTimer = globalThis.setTimeout(() => {
                this.selecionandoArquivo = false
                this.selecionarArquivoTimer = undefined
            }, 120000)
        },

        concluirSelecaoArquivo(): void {
            this.selecionandoArquivo = false

            if (this.selecionarArquivoTimer) {
                globalThis.clearTimeout(this.selecionarArquivoTimer)
                this.selecionarArquivoTimer = undefined
            }
        },

        selecionarArquivo(event: Event): void {
            this.concluirSelecaoArquivo()

            const input = event.target as HTMLInputElement
            const arquivo = input.files?.[0] ?? null

            if (!arquivo) {
                this.cancelarArquivoSelecionado()
                return
            }

            const erroValidacao = this.validarArquivo(arquivo)
            if (erroValidacao) {
                this.arquivoSelecionado = null
                input.value = ""
                showMessage(erroValidacao, "error")
                return
            }

            this.arquivoSelecionado = arquivo
        },

        cancelarArquivoSelecionado(): void {
            this.arquivoSelecionado = null

            const fileInputRef = this.$refs.fileInput as HTMLInputElement | undefined
            if (fileInputRef) fileInputRef.value = ""
        },

        async fazerUpload(): Promise<void> {
            if (!this.arquivoSelecionado) return

            const erroValidacao = this.validarArquivo(this.arquivoSelecionado)
            if (erroValidacao) {
                showMessage(erroValidacao, "error")
                return
            }

            this.loadingUpload = true

            try {
                const documento = await documentoService.upload(this.arquivoSelecionado)

                showMessage("Documento salvo com sucesso!", "success")
                this.cancelarArquivoSelecionado()
                this.documentos = [documento, ...this.documentos]

                const formRef = this.$refs.form as unknown as { reset: () => void }
                if (formRef) formRef.reset()
            } catch (error) {
                console.error(error)
                showMessage(
                    getHttpErrorMessage(error, "Falha ao enviar arquivo para o servidor."),
                    "error"
                )
            } finally {
                this.loadingUpload = false
            }
        },

        async baixarDocumento(item: Documento): Promise<void> {
            try {
                await documentoService.baixar(item)
            } catch (error) {
                console.error(error)

                if (isDocumentoNotFoundError(error)) {
                    this.removerDocumentoDaLista(item.id)
                    showMessage(
                        "Documento não encontrado no armazenamento e removido da lista.",
                        "error"
                    )
                    return
                }

                showMessage(getHttpErrorMessage(error, "Erro ao baixar o arquivo."), "error")
            }
        },

        deletarDocumento(item: Documento): void {
            this.documentoParaDeletar = item
            this.dialogDeletar = true
        },

        fecharModalDeletar(): void {
            this.dialogDeletar = false
            this.documentoParaDeletar = null
        },

        async confirmarDeletarDocumento(): Promise<void> {
            if (!this.documentoParaDeletar) return

            this.loadingDeletar = true
            try {
                await documentoService.deletar(this.documentoParaDeletar.id)
                showMessage("Documento removido com sucesso.", "success")
                this.fecharModalDeletar()
                this.buscarDocumentos()
            } catch (error) {
                console.error(error)
                showMessage(
                    getHttpErrorMessage(error, "Erro ao tentar excluir o documento."),
                    "error"
                )
            } finally {
                this.loadingDeletar = false
            }
        },

        validarArquivo(arquivo: File): string | null {
            const nomeArquivo = arquivo.name.toLowerCase()
            const formatoAceito = ACCEPTED_FILE_EXTENSIONS.some((extensao) =>
                nomeArquivo.endsWith(extensao)
            )

            if (!formatoAceito) {
                return "Formato inválido. Envie arquivos PDF, DOC, DOCX, XLS, XLSX ou PNG."
            }

            if (arquivo.size === 0) {
                return "O arquivo selecionado está vazio."
            }

            if (arquivo.size > MAX_FILE_SIZE_BYTES) {
                return `O arquivo deve ter no máximo ${MAX_FILE_SIZE_MB} MB.`
            }

            return null
        },

        formatarData(dataIso: string): string {
            if (!dataIso) return ""
            const data = new Date(dataIso)
            return (
                data.toLocaleDateString("pt-BR") +
                " " +
                data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            )
        },

        validarDataFinal(value: string): boolean | string {
            if (!this.filtros.dataInicial || !value) return true
            return (
                value >= this.filtros.dataInicial ||
                "Data final não pode ser anterior à data inicial."
            )
        },

        limparFiltros(): void {
            this.filtros.nome = ""
            this.filtros.dataInicial = ""
            this.filtros.dataFinal = ""
        },

        atualizarDocumentosAoFocar(): void {
            if (
                this.loadingTabela ||
                this.selecionandoArquivo ||
                this.atualizarDocumentosAoFocarTimer
            ) {
                return
            }

            this.atualizarDocumentosAoFocarTimer = globalThis.setTimeout(() => {
                this.atualizarDocumentosAoFocarTimer = undefined
                if (!this.loadingTabela) {
                    this.buscarDocumentos(false, false)
                }
            }, 400)
        },

        removerDocumentoDaLista(id: number): void {
            this.documentos = this.documentos.filter((documento) => documento.id !== id)
        },
    },
})
</script>

<template>
    <v-container fluid class="documentos-page pa-6">
        <div style="text-align: start">
            <h2 style="padding: 0">Anexos</h2>
            <h4 style="text-wrap: wrap; color: #1f2937; padding: 0"> 
                Gerencie documentos disponíveis para uso no sistema.
            </h4>
        </div>

        <v-card v-if="isAdmin" class="upload-card mb-8" elevation="0">
            <v-form ref="form" v-model="valid">
                <div class="upload-content">
                    <div class="upload-icon">
                        <v-icon size="34" color="primary"> cloud-upload </v-icon>
                    </div>

                    <h2 class="upload-title">Enviar Novo Documento</h2>

                    <p class="upload-description">
                        Faça upload de modelos oficiais, checklists, manuais, relatórios ou
                        documentos utilizados como padrão pelas unidades do sistema.
                    </p>

                    <label class="custom-file-input">
                        <input
                            ref="fileInput"
                            class="native-file-input"
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png"
                            aria-label="Selecionar arquivo"
                            @click="prepararSelecaoArquivo"
                            @change="selecionarArquivo"
                        />
                        <span class="file-input-button">
                            <v-icon size="18" color="white"> cloud-upload </v-icon>
                            <span class="file-input-label"> Selecionar Arquivo </span>
                        </span>
                    </label>

                    <span class="upload-info">
                        Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG. Tamanho máximo: 8 MB.
                    </span>

                    <div v-if="arquivoSelecionado" class="selected-file">
                        <div class="selected-file-info">
                            <component
                                :is="obterIconePorExtensao(nomeArquivoSelecionado)"
                                :size="20"
                                :stroke="2"
                                :style="{ color: obterCorPorExtensao(nomeArquivoSelecionado) }"
                            />
                            <span class="selected-file-name" :title="nomeArquivoSelecionado">
                                {{ nomeArquivoSelecionado }}
                            </span>
                        </div>

                        <div class="upload-actions">
                            <v-btn
                                variant="outlined"
                                class="cancel-upload-button"
                                :disabled="loadingUpload"
                                @click="cancelarArquivoSelecionado"
                            >
                                Cancelar
                            </v-btn>

                            <v-btn
                                class="upload-button"
                                :loading="loadingUpload"
                                :disabled="!arquivoSelecionado"
                                @click="fazerUpload"
                            >
                                Salvar Documento
                            </v-btn>
                        </div>
                    </div>
                </div>
            </v-form>
        </v-card>

        <section class="documents-list">
            <VCard class="row filter-card">
                <div class="filterField filter-name">
                    Busca por nome
                    <VTextField
                        v-model="filtros.nome"
                        density="compact"
                        prepend-inner-icon="Search"
                        hide-details
                        variant="solo"
                        bg-color="hsl(0,0%,95%)"
                        placeholder="Digite o nome do documento"
                        class="filledField"
                    />
                </div>

                <div class="filterField filter-date">
                    Data inicial
                    <DatePicker v-model="filtros.dataInicial" hide-details />
                </div>

                <div class="filterField filter-date">
                    Data final
                    <DatePicker
                        v-model="filtros.dataFinal"
                        :min="filtros.dataInicial"
                        :rules="[validarDataFinal as (value: string | null | undefined) => string | boolean]"
                    />
                </div>

                <div v-if="temFiltrosAtivos" class="filterField clear-filter">
                    <div class="filter-spacer"></div>

                    <VBtn variant="outlined" class="clear-filter-button" @click="limparFiltros">
                        <v-icon size="18" class="clear-filter-icon"> eraser </v-icon>
                        Limpar Filtros
                    </VBtn>
                </div>
            </VCard>

            <v-data-table
                :headers="headers"
                :items="documentosFiltrados"
                :loading="loadingTabela"
                loading-text="Carregando documentos..."
                no-data-text="Nenhum documento encontrado."
                class="custom-table"
            >
                <template v-slot:[`item.criadoEm`]="{ item }">
                    {{ formatarData(item.criadoEm) }}
                </template>

                <template v-slot:[`item.nome`]="{ item }">
                    <div class="document-cell">
                        <div class="file-icon">
                            <component
                                :is="obterIconePorExtensao(item.nome)"
                                :size="22"
                                :stroke="2"
                                :style="{ color: obterCorPorExtensao(item.nome) }"
                            />
                        </div>
                        <div class="document-info">
                            <div class="file-name">
                                {{ item.nome }}
                            </div>
                            <div class="file-subtitle">Documento institucional</div>
                        </div>
                    </div>
                </template>

                <template v-slot:[`item.acoes`]="{ item }">
                    <div class="table-actions">
                        <v-btn
                            icon
                            size="small"
                            variant="outlined"
                            color="black"
                            class="action-button actionButton"
                            aria-label="Visualizar documento"
                            @click="visualizarDocumento(item)"
                        >
                            <v-icon size="18">eye</v-icon>
                        </v-btn>

                        <v-btn
                            v-if="isAdmin"
                            icon
                            size="small"
                            variant="outlined"
                            color="black"
                            class="action-button actionButton"
                            @click="deletarDocumento(item)"
                        >
                            <IconTrash :size="18" />
                        </v-btn>
                    </div>
                </template>
            </v-data-table>

            <v-dialog v-model="dialogPreview" max-width="1100px" scrollable>
                <v-card class="pa-2">
                    <v-card-title class="d-flex justify-space-between align-center">
                        <div class="text-h6 font-weight-bold">
                            {{ documentoAberto?.nome ?? "Documento" }}
                        </div>

                        <div class="d-flex align-center">
                            <v-tooltip text="Baixar documento" location="top">
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        variant="text"
                                        color="primary"
                                        :disabled="!documentoAberto || loadingPreview"
                                        @click="baixarDocumentoDoModal"
                                    >
                                        <v-icon size="20">download</v-icon>
                                    </v-btn>
                                </template>
                            </v-tooltip>

                            <v-btn variant="text" icon @click="fecharPreview">
                                <IconX :size="22" stroke="2" class="text-grey-darken-2" />
                            </v-btn>
                        </div>
                    </v-card-title>

                    <v-card-text style="max-height: 75vh">
                        <div v-if="loadingPreview" class="d-flex justify-center align-center pa-10">
                            <v-progress-circular indeterminate color="primary" />
                        </div>

                        <div v-else-if="!previewUrl" class="text-center pa-10 text-grey">
                            Não foi possível carregar a pré-visualização.
                        </div>

                        <div v-else>
                            <div v-if="isPreviewImagem" class="d-flex justify-center">
                                <v-img
                                    :src="previewUrl"
                                    contain
                                    class="bg-grey-lighten-2 rounded"
                                    style="max-height: 70vh"
                                />
                            </div>

                            <div v-else-if="isPreviewPdf" class="d-flex justify-center">
                                <iframe
                                    title="Documento PDF"
                                    :src="previewUrl"
                                    width="100%"
                                    height="650px"
                                    class="rounded border"
                                    style="border: 1px solid #ccc"
                                />
                            </div>

                            <div v-else class="text-center pa-10">
                                <p class="text-body-2 text-medium-emphasis mb-4">
                                    Este tipo de arquivo não possui pré-visualização no navegador.
                                </p>
                                <v-btn
                                    color="primary"
                                    variant="flat"
                                    :disabled="!documentoAberto"
                                    @click="baixarDocumentoDoModal"
                                >
                                    Baixar arquivo
                                </v-btn>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <v-dialog max-width="350px" v-model="dialogDeletar">
                <VCard style="margin: auto; padding: 20px; gap: 20px" class="col">
                    <div
                        class="row"
                        style="
                            justify-content: start;
                            margin-bottom: 0px;
                            align-items: center;
                            gap: 20px;
                        "
                    >
                        <VBtn
                            @click="fecharModalDeletar"
                            color="hsl(0, 50%, 50%)"
                            style="padding: 5px"
                        >
                            <IconX size="25"></IconX>
                        </VBtn>
                        <h3>Excluir Documento</h3>
                    </div>

                    <div
                        class="row"
                        style="
                            margin: 0px 0px;
                            border-radius: 10px;
                            background: hsl(0, 0%, 95%);
                            gap: 0;
                            flex-wrap: nowrap;
                            overflow: hidden;
                        "
                    >
                        <div style="background-color: hsl(0, 0%, 80%); width: 10px"></div>
                        <span style="padding: 10px; text-align: start">
                            Tem certeza que deseja excluir o documento
                            <b>{{ documentoParaDeletar?.nome }}</b
                            >?
                        </span>
                    </div>

                    <div class="row" style="justify-content: end; gap: 10px">
                        <VBtn
                            @click="fecharModalDeletar"
                            variant="outlined"
                            :disabled="loadingDeletar"
                        >
                            Cancelar
                        </VBtn>
                        <VBtn
                            color="hsl(0,50%,50%)"
                            :loading="loadingDeletar"
                            @click="confirmarDeletarDocumento"
                        >
                            Excluir
                        </VBtn>
                    </div>
                </VCard>
            </v-dialog>
        </section>

    </v-container>
</template>

<style scoped>
.documentos-page {
    background: #f5f7fb;
    min-height: 100vh;
}

.page-title {
    font-size: 42px;
    font-weight: 800;
    color: #111827;
}

.page-subtitle {
    color: #6b7280;
    margin-top: 4px;
}

.upload-card {
    min-height: 376px;
    padding: 44px 32px 40px;
    border: 2px dashed #bcd2ff;
    border-radius: 28px;
    background: #f4f8ff;
}

.upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.upload-icon {
    width: 70px;
    height: 70px;
    border-radius: 20px;
    background: #dfe8ff;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 20px;
}

.upload-title {
    font-size: 20px;
    font-weight: 700;
    color: #050b1f;
    line-height: 1.25;
}

.upload-description {
    margin-top: 14px;
    max-width: 620px;
    text-align: center;
    color: #435176;
    font-size: 14px;
    line-height: 1.45;
}

.custom-file-input {
    display: block;
    margin-top: 28px;
    width: 250px;
    max-width: 100%;
    cursor: pointer;
}

.native-file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
}

.file-input-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 58px;
    gap: 12px;
    border-radius: 14px;

    background: rgb(var(--v-theme-primary));
    color: white;
}
.file-input-label {
    display: inline-block;
    overflow: hidden;
    color: white;
    font-size: 17px;
    font-weight: 700;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.upload-info {
    margin-top: 18px;
    color: #435176;
    font-size: 13px;
}

.selected-file {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(100%, 520px);
    margin-top: 20px;
    gap: 16px;
}

.selected-file-info {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 46px;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid #bcd2ff;
    border-radius: 12px;
    background: white;
    color: #1f2a44;
}

.selected-file-name {
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.upload-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
}

.cancel-upload-button {
    height: 44px !important;
    border-radius: 14px !important;
    padding: 0 20px !important;
    font-weight: 600;
    text-transform: none;
}

.upload-button {
    background: #15803d !important;
    color: white !important;
    border-radius: 14px !important;
    height: 44px !important;
    padding: 0 24px !important;
    font-weight: 600;
}

.documents-list {
    width: 100%;
    margin: 0;
    overflow: visible;
}

.filter-card {
    align-items: flex-start !important;
    flex-wrap: wrap;
    justify-content: flex-start !important;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    flex: 1;
}

.filterField {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 6px;
    min-width: 0;
    color: #213547;
    font-size: 14px;
    text-align: start;
}

.filter-name {
    max-width: 400px;
    flex: 4;
}

.filter-date {
    max-width: 300px;
    flex: 2;
}

.clear-filter {
    min-width: fit-content;
    flex-grow: 0;
}

.filter-spacer {
    height: 20px;
}

.clear-filter-button {
    height: 40px;
    text-transform: none;
    white-space: nowrap;
}

.clear-filter-icon {
    margin-right: 5px;
}

.custom-table {
    width: 100%;
    background: white;
    color: #435176;
    border: var(--border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: none !important;
}

.custom-table :deep(.v-table__wrapper) {
    width: 100%;
    border-radius: 10px 10px 0 0;
}

.custom-table :deep(table) {
    width: 100%;
    min-width: 920px;
    border-collapse: collapse;
}

.custom-table :deep(thead th) {
    height: 56px !important;
    padding: 0 14px !important;
    font-weight: 700 !important;
    color: #4a5675 !important;
    font-size: 12px !important;
    line-height: 1.2;
    text-transform: uppercase;
}

.custom-table :deep(thead th:first-child),
.custom-table :deep(tbody td:first-child) {
    padding-left: 14px !important;
}

.custom-table :deep(thead th:last-child),
.custom-table :deep(tbody td:last-child) {
    padding-right: 16px !important;
}

.custom-table :deep(tbody td) {
    height: 72px !important;
    padding: 0 14px !important;
    color: #3f4b70;
    font-size: 15px;
}

.custom-table :deep(tbody tr) {
    transition: background-color 0.2s ease;
}

.custom-table :deep(tbody tr:hover) {
    background: #fbfcff;
}

.custom-table :deep(.v-data-table-footer) {
    background: white;
}

.document-cell {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 14px;
}

.file-icon {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    border: 1px solid #d9dee8;
    border-radius: 16px;
    background: #f4f7fb;
    display: flex;
    align-items: center;
    justify-content: center;
}

.document-info {
    min-width: 0;
}

.file-name {
    max-width: 100%;
    overflow: hidden;
    color: #050b1f;
    font-weight: 700;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-subtitle {
    margin-top: 3px;
    color: #3f4b70;
    font-size: 13px;
    line-height: 1.2;
}

.table-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    white-space: nowrap;
}

.action-button {
    width: 40px !important;
    height: 40px !important;
    border-color: hsl(0, 0%, 80%) !important;
    border-radius: 8px !important;
    background: white !important;
    color: #0f172a !important;
    box-shadow: none !important;
    padding: 8px !important;
}

@media (max-width: 960px) {
    .documents-list {
        overflow-x: auto;
    }
}
</style>
