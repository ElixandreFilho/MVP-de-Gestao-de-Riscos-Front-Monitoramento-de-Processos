<script setup lang="ts">
import { IconChevronUp } from "@tabler/icons-vue"
import { gotToTop, scrollY } from "./backTopTopButton"
</script>

<template>
    <Transition name="slide-y-transition">
        <button
            :onclick="
                () => {
                    gotToTop()
                }
            "
            class="backToTop"
            style="border: 1px solid hsl(0, 0%, 80%)"
            v-if="scrollY > 300"
        >
            <IconChevronUp></IconChevronUp>
        </button>
    </Transition>
</template>
