<template>
  <div class="w-full bg-neutral-50 flex flex-col">
    <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">{{ label }}</p>

    <div class="flex flex-row gap-2 mx-4 mb-4">
      <p class="tracking-wider text-sm pt-[6px]">PHP</p>
      <input
        v-model="text"
        type="text"
        inputmode="decimal"
        :placeholder="placeholder"
        class="w-full px-2 py-1 text-3xl text-right tracking-wider font-medium bg-black text-white placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        @input="onInput"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatAmountInput, parseAmount } from '../format'

const props = withDefaults(
  defineProps<{
    label: string
    /** Current value as a number. `undefined` renders an empty field. */
    modelValue?: number
    placeholder?: string
  }>(),
  {
    placeholder: '0.00',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

// Held as a formatted string so the field can be cleared while typing.
const text = ref(props.modelValue === undefined ? '' : formatAmountInput(String(props.modelValue)))

// Re-sync when the parent changes the value from outside (e.g. a reset button).
watch(() => props.modelValue, (value) => {
  const next = value === undefined ? '' : formatAmountInput(String(value))
  if (parseAmount(text.value) !== value) text.value = next
})

function onInput(event: Event) {
  // Read from the DOM node rather than the ref: `v-model` and this handler
  // both listen to `input`, and the ref may not hold the new value yet.
  const input = event.target as HTMLInputElement
  text.value = formatAmountInput(input.value)
  if (input.value !== text.value) input.value = text.value

  // An empty field means "no value", not zero, so a cleared budget stays clear.
  emit('update:modelValue', text.value === '' ? undefined : parseAmount(text.value))
}
</script>
