import { ref, type Ref } from "vue"
import type { UnidadeOrganizacional } from "../types/unidadeOrganizacional"
import unidadeService from "../services/unidadeService"

const sortTree = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => a.value.localeCompare(b.value, "pt-BR", { sensitivity: "base" }))

    nodes.forEach((node) => {
        if (node.children?.length) {
            sortTree(node.children)
        }
    })

    return nodes
}

const buildTree = (unidades: UnidadeOrganizacional[]) => {
    const nodeMap = new Map()
    const nodes = unidades.map((x) => {
        const node = {
            value: x.nome,
            children: [],
            id: x.id,
            parentRef: x.unidadeOrganizacionalPai?.id,
        }
        nodeMap.set(x.id, node)
        return node
    })

    nodes.forEach((node) => {
        if (node.parentRef) {
            const parentNode = nodeMap.get(node.parentRef)
            if (parentNode) {
                parentNode.children.push(node)
            }
        }
    })

    return sortTree(nodes.filter((x) => x.parentRef === undefined))
}

export const getParentUnidade = (id?: number) => {
    let unidade = unidades.value.find((x) => x.id === id)
    while (unidade) {
        const temp = unidades.value.find((x) => x.id === unidade?.unidadeOrganizacionalPai?.id)
        if (!temp) return unidade
        unidade = temp
    }
}

export const getSetor = (id?: number) => {
    return unidades.value.find((x) => x.unidadeOrganizacionalPai === id)
}

export type TreeNode = {
    value: string
    id: number | null
    children: TreeNode[]
}

export const unidades: Ref<UnidadeOrganizacional[]> = ref([])
export const unidadesTree: Ref<TreeNode[]> = ref([])

export const getUnidadeTree = (id?: number) => {
    let unidade = unidades.value.find((x) => x.id === id)
    const path = [unidade?.id]
    while (unidade) {
        const temp = unidades.value.find((x) => x.id === unidade?.unidadeOrganizacionalPai?.id)
        if (!temp) break
        unidade = temp
        path.push(unidade.id)
    }
    let tree = unidadesTree.value.find((x) => x.id === path[path.length - 1])
    for (let i = path.length - 2; i > -1; i--) {
        tree = tree?.children.find((x: TreeNode) => x.id === path[i])
    }
    return tree
}
export const refreshUnidades = async () => {
    const res = await unidadeService.getAllWithChildren()
    unidades.value = res
    unidadesTree.value = buildTree(res)
}

refreshUnidades()

if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("gestao-riscos-mvp:data-changed", (event) => {
        const customEvent = event as CustomEvent<{ collection?: string }>
        if (customEvent.detail?.collection === "unidades") {
            void refreshUnidades()
        }
    })
}
