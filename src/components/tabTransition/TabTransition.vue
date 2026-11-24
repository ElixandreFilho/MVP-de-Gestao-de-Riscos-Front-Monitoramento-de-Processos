<script setup lang="ts">
import { onUnmounted, ref, type Ref } from "vue"

defineProps<{
    tabSlots: number
    persistent?: boolean
    transitionName?: string
}>()

const tab = defineModel<number>()

const tabHeight: Ref<number | null> = ref(null)

const observer = new ResizeObserver((el: ResizeObserverEntry[]) => {
    tabHeight.value = el[0]?.target.scrollHeight ?? 0
})

const setHeight = (el: Element) => {
    tabHeight.value = el.scrollHeight
    observer.observe(el)
}

const leave = (el: Element) => {
    observer.unobserve(el)
    tabHeight.value = el.scrollHeight
}

onUnmounted(() => {
    observer.disconnect()
})
</script>

<template>
    <div class="tab" :style="{ maxHeight: tabHeight + 'px' }">
        <Transition
            :name="transitionName ?? 'slide-y-transition'"
            @enter="setHeight"
            @leave="leave"
            v-for="(slot, index) in tabSlots"
            :key="slot"
        >
            <template v-if="persistent">
                <div v-show="tab === index" class="tabItem">
                    <slot :name="index"></slot>
                </div>
            </template>
            <template v-else>
                <div v-if="tab === index" class="tabItem">
                    <slot :name="index"></slot>
                </div>
            </template>
        </Transition>
    </div>
</template>

<style>
.tab {
    display: grid;
    grid-template-areas: "unit";
    transition: all 0.1s;
}
.tabItem {
    position: relative;
    grid-area: unit;
    height: fit-content;
    overflow: hidden;
}
</style>
