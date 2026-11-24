<script setup lang="ts">
import { IconBuilding, IconChevronDown, IconX } from "@tabler/icons-vue"
import {
    ref,
    type StyleValue,
    watch,
    type Ref,
    h,
    render,
    onBeforeUnmount,
    type CSSProperties,
    computed,
    nextTick,
    onMounted,
} from "vue"
import type { TreeNode } from "../core/unidades"
import { VCard, VInput, VTextField, VMenu, VProgressCircular, VTooltip } from "vuetify/components"

const filterText = ref<string>("")

const selected = defineModel<Partial<TreeNode> | null>()

const show = ref(false)

const treeElem: Ref<HTMLElement | null> = ref(null)

const props = withDefaults(
    defineProps<{
        placeholder: string
        style?: CSSProperties
        class?: string
        rules?: ((value: string) => string | boolean)[]
        hideDetails?: boolean
        bgColor?: string
        color?: string
        border?: string
        startExpanded?: boolean
        items: TreeNode[]
        density?: "default" | "comfortable" | "compact"
        emptyText?: string
        maxChars?: number
    }>(),
    { variant: "outlined", color: "black", startExpanded: false, density: "default", maxChars: 30 }
)

const className = props.class

const resize = (el: HTMLElement) => {
    el.style.maxHeight = `${el.scrollHeight}px`
}

const hide = (childrenContainer: HTMLElement, button: HTMLElement) => {
    childrenContainer.style.maxHeight = `${childrenContainer.scrollHeight}px`
    setTimeout(() => {
        childrenContainer.dataset.hidden = "1"
        childrenContainer.style.opacity = "0"
        childrenContainer.style.maxHeight = "0"
        childrenContainer.style.translate = "0 -10px"
        button.style.rotate = "270deg"
    }, 50)
}

const expandMethod = (e: MouseEvent) => {
    const childrenContainer = (e.currentTarget as HTMLElement).parentElement
        ?.nextElementSibling as HTMLElement
    const button = (e.currentTarget as HTMLElement).firstElementChild as HTMLElement

    if (childrenContainer.dataset.hidden === "1") {
        childrenContainer.dataset.hidden = "0"
        childrenContainer.style.opacity = "1"
        childrenContainer.style.maxHeight = `${childrenContainer.scrollHeight}px`
        childrenContainer.style.translate = "0 0px"
        button.style.rotate = "0deg"
    } else {
        hide(childrenContainer, button)
    }
}
let observers: ResizeObserver[] = []

const wait = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const buildChild = (
    parent: {
        children: TreeNode[]
        elem: HTMLElement
    },
    observer: ResizeObserver,
    first: boolean,
    i: number
) => {
    const child = parent.children[i]!
    const node = document.createElement("div")
    const title = document.createElement("div")
    const childrenContainer = document.createElement("div")

    if (!first) {
        observer.observe(childrenContainer)
        if (i === parent.children.length - 1) {
            title.classList.add("left")
            title.classList.add("leftLast")
        } else {
            node.classList.add("left")
            title.classList.add("connectLine")
        }
        if (i === 0) {
            title.classList.add("fillLeft")
        }
    } else {
        title.style.position = "relative"
    }
    node.classList.add("treeNode")
    node.appendChild(title)
    const titleButton = document.createElement("button")
    if (child.children.length > 0) {
        const icon = h(IconChevronDown, { style: "vertical-align: middle" as StyleValue })
        const expandButton = document.createElement("button")
        expandButton.classList.add("treeNodeButton", "expandButton")
        render(icon, expandButton)
        title.appendChild(expandButton)
        expandButton.onclick = expandMethod

        const abrirPorFiltro = filterText.value && child.children.length > 0

        if (props.startExpanded || abrirPorFiltro) {
            childrenContainer.dataset.hidden = "0"
            childrenContainer.style.opacity = "1"
            childrenContainer.style.maxHeight = ""
            childrenContainer.style.translate = "0 0px"
            ;(expandButton.firstElementChild as HTMLElement).style.rotate = "0deg"
        } else {
            childrenContainer.dataset.hidden = "1"
            childrenContainer.style.opacity = "0"
            childrenContainer.style.maxHeight = "0"
            childrenContainer.style.translate = "0 -10px"
            ;(expandButton.firstElementChild as HTMLElement).style.rotate = "270deg"
        }
    }

    if (child.children.length > 0 || first) {
        titleButton.classList.add("buttonInset")
    }

    parent.elem.appendChild(node)
    node.appendChild(childrenContainer)
    childrenContainer.classList.add("children")

    titleButton.classList.add("treeNodeButton")
    titleButton.classList.add("titleButton")
    titleButton.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        selected.value = { id: child.id, value: child.value }
        filterText.value = ""
        close()
    }

    const icon = h(IconBuilding, {
        color: "rgb(var(--v-theme-primary))",
        style: "vertical-align: middle",
    })
    render(icon, titleButton)
    const text = document.createElement("div")
    text.classList.add("treeNodeText")
    titleButton.classList.add("row")

    text.innerText = child.value
    titleButton.appendChild(text)
    title.appendChild(titleButton)
    return childrenContainer
}

const filterTree = (items: TreeNode[], q: string): TreeNode[] => {
    if (!q) {
        return items
    }

    const normalize = (s: string) =>
        s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\p{L}\p{N}]+/gu, "")
            .toLowerCase()

    const query = normalize(q.trim())

    const matches = (node: TreeNode) => 
        normalize(String(node.value ?? "")).includes(query)

    const recurse = (nodes: TreeNode[]): TreeNode[] => {
        const out: TreeNode[] = []
        for (const n of nodes) {
            if (matches(n)) {
                out.push({
                    ...n,
                    children: n.children || [],
                })
                continue
            }

            const children = recurse(n.children || [])
            if (children.length > 0) {
                out.push({
                    ...n,
                    children,
                })
            }
        }
        return out
    }
    return recurse(items)
}

const filteredItems = computed(() => filterTree(props.items, filterText.value))

watch([filteredItems], () => {
    renderTree(true)
    reload(false)
})

const renderTree = (rerender = false) => {
    if (!rerender && treeElem.value) {
        return
    }

    for (let ob of observers) {
        ob.disconnect()
    }
    observers = []

    const topContainer = document.createElement("div")
    const p = document.createElement("div")
    let parents = [{ children: filteredItems.value, elem: topContainer as HTMLElement }]
    let children: { children: TreeNode[]; elem: HTMLElement }[] = []
    let first = true
    p.classList.add("topContainer")
    while (parents.length > 0) {
        for (let parent of parents) {
            const observer = new ResizeObserver(() => {
                resize(parent.elem)
            })
            observers.push(observer)

            for (let i = 0; i < parent.children.length; i++) {
                const childrenContainer = buildChild(parent, observer, first, i)
                children.push({ children: parent.children[i]!.children, elem: childrenContainer })
            }
            first = false
        }
        parents = children
        children = []
    }
    topContainer.style.overflow = "hidden"
    p.appendChild(topContainer)
    treeElem.value = p
}

const close = () => {
    show.value = false
}
const treeLoaded = ref(false)
const open = () => {
    show.value = true
}

onBeforeUnmount(() => {
    for (let ob of observers) {
        ob.disconnect()
    }
    observers = []
})

const container: Ref<HTMLElement | undefined> = ref()

const reload = async (showLoading = true) => {
    if (container.value && treeElem.value) {
        if (showLoading) {
            treeLoaded.value = false
        }
        container.value.firstElementChild?.remove()
        container.value.appendChild(treeElem.value)
        await wait(60)
        if (showLoading) {
            treeLoaded.value = true
        }
    }
}

watch(
    () => props.items,
    () => {
        renderTree(true)
        reload(true)
    }
)
watch(container, async () => {
    if (container.value) {
        if (!treeElem.value) {
            renderTree()
        }
        await reload()
    }
})
const anchor: Ref<HTMLElement | null> = ref(null)

const inputWrapper: Ref<InstanceType<typeof VInput> | null> = ref(null)

const handleBackspace = () => {
    if (!filterText.value && selected.value?.id) {
        selected.value = { id: null }
    }
}

watch(inputWrapper, async () => {
    await nextTick()
    try {
        const el = inputWrapper.value?.$el?.querySelector?.("input") || inputWrapper.value?.$el
        anchor.value = el ?? null
    } catch {
        anchor.value = null
    }
})

onMounted(async () => {
    await nextTick()
    try {
        const el = inputWrapper.value?.$el?.querySelector?.("input") || inputWrapper.value?.$el
        anchor.value = el ?? null
    } catch {
        anchor.value = null
    }
})

watch(show, async (val) => {
    if (!val) {
        inputWrapper.value?.validate()
        return
    }
    renderTree(true)
    await nextTick()
    await reload()
    try {
        const el = anchor.value as HTMLInputElement | null
        el?.focus()
    } catch (error_){
        console.debug(error_)
    }
})

watch(selected, (val) => {
    if ((val == null || val.id == null) && filterText.value === val?.value) {
        filterText.value = ""
    }

    if ((val == null || val.id == null) && !val?.value) {
        filterText.value = ""
    }
})

watch(filterText, (newText) => {
    if (newText.trim()) {
        show.value = true
    }
})
</script>

<template>
    <VMenu
        v-model="show"
        attach="body"
        :close-on-content-click="false"
        transition="slide-y-transition"
        width="target"
    >
        <template #activator="{ props: menuProps }">
            <VInput
              ref="inputWrapper"
              class="treeViewField"
              v-model="selected"
              :rules="rules"
              :hide-details="props.hideDetails"
            >
                <template #message="{ message }">
                    <div>{{ message }}</div>
                </template>
                <template #default>
                    <VTextField
                        v-bind="{ ...menuProps, onClick: (e: any) => { e?.stopPropagation?.(); open() } }"
                        v-model="filterText"
                        class="anchor"
                        :class="className"
                        :color="color"
                        :style="Object.assign(
                            {
                                background: props.bgColor,
                            },
                            props.style
                        )"
                        @focus="open"
                        :placeholder="selected?.value ? '' : placeholder"
                        :density="props.density"
                        single-line
                        @keydown.backspace="handleBackspace"
                    >
                        <template #prepend-inner>
                            <VChip
                                v-if="selected?.value"
                                size="small"
                                color="primary"
                                variant="flat"
                                class="flex-shrink-0"
                                style="cursor: default;"
                            >
                                <span class="text-truncate chip-texto-responsivo">
                                    {{ selected.value }}
                                </span>
                                <VTooltip
                                  activator="parent"
                                  location="top"
                                  close-delay="100"
                                  attach="body"
                                  content-class="text-caption"
                                >
                                  {{ selected.value }}
                                </VTooltip>
                            </VChip>
                        </template>
                        <template #append-inner>
                            <IconX
                                v-if="filterText || selected?.value"
                                size="18"
                                style="cursor: pointer"
                                @mousedown.stop.prevent ="filterText = ''; selected = { id: null }"
                            />
                        </template>
                    </VTextField>
                </template>
            </VInput>
        </template>

        <template v-if="!treeLoaded">
            <VCard>
                <VProgressCircular :indeterminate="true" />
            </VCard>
        </template>

        <template v-else-if="filterText.trim() && filteredItems.length === 0">
            <VCard class="emptyState">
                {{ props.emptyText ?? "Nenhuma unidade encontrada" }}
            </VCard>
        </template>

          <div
            ref="container"
            v-show="!filterText.trim() || filteredItems.length > 0"
            :style="{
              '--transition': treeLoaded ? 'all 0.3s' : 'none',
            }"
          ></div>
      </VMenu>
    </template>
    
<style>
.anchor {
  transition: all 0.3s;
  text-transform: none;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  border-radius: 8px;
}
.anchor .v-field__outline {
  display: none !important;
  border-radius: inherit;
}
.anchor .v-field {
  border-radius: inherit;
  overflow: hidden;
}
.anchor:hover {
    background: hsl(0, 0%, 90%) !important;
}
.anchor:active {
    background: hsl(0, 0%, 85%) !important;
}

.anchor .v-field__prepend-inner {
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
}

.anchor .v-field__field {
    align-items: center;
}

.anchor .v-field__input input {
    min-width: 2rem;
}

.treeNode {
    margin-left: 20px;
    --margin: 8px;
    --line-color: hsl(0, 0%, 60%);
    --transition: inherit;
}
.treeNode > :first-child {
    padding: var(--margin) 0;
}
.topContainer {
    position: relative;
    background: white;
    color: black;
    border-radius: 10px;
    box-shadow: 0 0 5px 0 hsl(0, 0%, 0%, 40%);
    padding: 10px;
    max-height: 300px;
    width: 100%;
    box-sizing: border-box;
    overflow: auto;
}
.left {
    position: relative;
}
.left::before {
    content: "";
    position: absolute;
    border-left: 1px solid var(--line-color);
    top: 0;
    left: -20px;
    width: 10px;
    height: calc(100% + var(--margin));
}
.leftLast::before {
    height: 60%;
    border-radius: 0 0 0 20px;
    border-bottom: 1px solid var(--line-color);
}
.connectLine {
    position: relative;
}
.connectLine::before {
    content: "";
    position: absolute;
    top: 0;
    left: -20px;
    width: 10px;
    height: 50%;
    border-bottom: 1px solid var(--line-color);
}
.children {
    transition: var(--transition);
}
.children[data-hidden="1"] {
    max-height: 0 !important;
}
.treeNodeButton {
    padding: 0;
    text-align: left;
    color: rgb(var(--v-theme-primary));
}
.expandButton {
    left: -10px;
    position: absolute;
    z-index: 1;
    top: var(--margin);
    bottom: var(--margin);
    color: hsl(0, 0%, 40%);
}
.expandButton > * {
    transition: all 0.3s;
}
.buttonInset {
    position: relative;
    left: 20px;
}
.fillLeft::after {
    content: "";
    position: absolute;
    top: calc(-10% + calc(-1 * var(--margin)));
    left: -20px;
    height: 50%;
    border-left: 1px solid var(--line-color);
}
.titleButton {
    background: hsl(200, 50%, 95%);
    padding: 5px 10px;
    transition: all 0.3s;
    max-width: 99%;
    min-width: 0;
    box-sizing: border-box;
    display: inline-flex;
}
.titleButton:hover {
    background: hsl(200, 50%, 90%);
}

.treeNodeText {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}
.treeViewField .v-input__details {
  display: none;
}
.emptyState {
    padding: 12px 16px;
    text-align: center;
    color: hsl(0, 0%, 35%);
}

.treeViewField .anchor .chip-texto-responsivo {
    display: inline-block;
    max-width: min(25vw, calc(v-bind('props.maxChars') * 1ch));
}

</style>
