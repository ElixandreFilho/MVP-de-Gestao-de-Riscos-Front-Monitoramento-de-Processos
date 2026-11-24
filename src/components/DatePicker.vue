<script setup lang="ts">
import { IconCalendar } from "@tabler/icons-vue"
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.css"
import { onMounted, ref, watch, type Ref, type VNodeRef } from "vue"
import type { VInput } from "vuetify/components"

let fpInstance: flatpickr.Instance | null = null
const date = defineModel<string | null>()
const elem: Ref<HTMLInputElement | undefined> = ref()
const input: Ref<InstanceType<typeof VInput> | undefined> = ref()

const props = defineProps<{
    rules?: ((value: string | null | undefined) => boolean | string)[]
    hideDetails?: boolean
    min?: string
    max?: string
    errorMessages?: string | string[]
}>()

const setElem = (el: Element) => {
    if (fpInstance) {
        fpInstance.destroy()
    }
    if (!el) return
    elem.value = el as HTMLInputElement
    fpInstance = flatpickr(el as HTMLInputElement, {
        dateFormat: "Y-m-d",
        altFormat: "d/m/Y",
        altInput: true,
        minDate: props?.min,
        maxDate: props?.max,
        onClose: () => {
            input.value?.validate()
            if (fpInstance?.selectedDates && fpInstance.selectedDates.length > 0)
                date.value = fpInstance.formatDate(fpInstance.selectedDates[0]!, "Y-m-d")
        },
        allowInput: true,
    })
}

watch(date, () => {
    if (elem.value) elem.value.value = date.value ?? ""
})

onMounted(() => {
    if (elem.value && date.value) {
        elem.value.value = date.value
        fpInstance?.setDate(date.value, false, "Y-m-d")
    }
})
</script>

<template>
    <VInput
        ref="input"
        v-model="date"
        :error-messages="errorMessages"
        :rules="rules"
        :hide-details="hideDetails"
    >
        <template #message="{ message }">
            <div style="margin-left: 16px">{{ message }}</div>
        </template>
        <template #default="{ isValid }">
            <div
                class="row"
                style="
                    padding: 8px 16px;
                    background: hsl(0, 0%, 95%);
                    border-radius: 8px;
                    align-items: center;
                    cursor: pointer;
                    font-size: 15px;
                    width: 100%;
                    flex-wrap: nowrap;
                "
                :style="{ color: isValid.value === false ? 'hsl(350,80%,40%)' : '' }"
                :onclick="(e: Event) => {
                        e.preventDefault()
                        elem?.click()
                    }"
            >
                <IconCalendar size="17" stroke-width="1.5" class="icon-calendar"></IconCalendar>
                <input
                    :style="{
                        '--placeholder-color': isValid.value === false ? 'hsl(350,80%,40%)' : '',
                        flex: '1',
                    }"
                    type="text"
                    class="dateInput"
                    placeholder="dd/mm/yyyy"
                    :ref="setElem as VNodeRef"
                />
            </div>
        </template>
    </VInput>
</template>

<style>
.dateInput::placeholder {
    color: var(--placeholder-color);
}

.icon-calendar {
    flex-shrink: 0 !important;

}
</style>
