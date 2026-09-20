<template>
  <div class="w-full bg-neutral-50 flex flex-col">
    <div class="flex flex-row items-center justify-between p-4 pb-[2px]">
      <p class="tracking-wider text-sm font-medium">CYCLE BUDGET</p>
      <p
        v-if="hasOverride"
        class="tracking-wider text-sm bg-black text-white px-1"
      >
        TEMPORARY
      </p>
    </div>

    <div class="flex flex-row items-center justify-between px-4 pb-[2px]">
      <p class="tracking-wider text-sm text-neutral-500">{{ cycleLabel }}</p>
    </div>

    <div class="flex flex-row gap-2 mx-4 mt-2">
      <p class="tracking-wider text-sm pt-[6px]">PHP</p>
      <input
        :value="displayAmount"
        type="text"
        inputmode="decimal"
        placeholder="0.00"
        class="w-full px-2 py-1 text-3xl text-right tracking-wider font-medium bg-black text-white placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        @input="onAmountInput"
      >
    </div>

    <div class="flex flex-row gap-2 mx-4 mt-2">
      <button
        type="button"
        class="flex-1 tracking-wider text-sm font-medium bg-black text-white px-2 py-1 cursor-pointer"
        @click="emit('setPermanent', draft)"
      >
        SET PERMANENT
      </button>
      <button
        type="button"
        class="flex-1 tracking-wider text-sm font-medium bg-neutral-100 text-neutral-500 px-2 py-1 cursor-pointer"
        @click="emit('setTemporary', draft)"
      >
        SET TEMPORARY
      </button>
    </div>

    <button
      v-if="hasOverride"
      type="button"
      class="mx-4 mt-2 mb-4 tracking-wider text-sm font-medium bg-neutral-100 text-neutral-500 px-2 py-1 cursor-pointer"
      @click="emit('clearTemporary')"
    >
      CLEAR TEMPORARY
    </button>

    <p v-else class="tracking-wider text-sm text-neutral-500 px-4 pb-4 pt-2">
      TEMPORARY APPLIES TO THIS CYCLE ONLY
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatAmountInput, parseAmount } from '../format'

const props = defineProps<{
  budget: { amount: number; overrides?: Record<string, number> }
  /** Start of the cycle in progress, `YYYY-MM-DD`. Keys the temporary override. */
  cycleKey: string
  /** Display form of the cycle, e.g. `01-15-2026 - 02-15-2026`. */
  cycleLabel: string
}>()

const emit = defineEmits<{
  setPermanent: [amount: number]
  setTemporary: [amount: number]
  clearTemporary: []
}>()

// Edit buffer, kept as a formatted string so the field can be cleared while
// typing without collapsing to zero.
const draftText = ref<string | null>(null)

const hasOverride = computed(() => props.budget.overrides?.[props.cycleKey] !== undefined)

/** The limit in force this cycle: the override if there is one, else the standing amount. */
const effective = computed(() => props.budget.overrides?.[props.cycleKey] ?? props.budget.amount)

const displayAmount = computed(() =>
  draftText.value ?? formatAmountInput(String(effective.value)),
)

const draft = computed(() => parseAmount(displayAmount.value))

function onAmountInput(event: Event) {
  // Read from the DOM node rather than the ref: `v-model` and this handler
  // both listen to `input`, and the ref may not hold the new value yet.
  const input = event.target as HTMLInputElement
  const formatted = formatAmountInput(input.value)
  draftText.value = formatted
  if (input.value !== formatted) input.value = formatted
}
</script>
