<template>
  <div
    class="fixed inset-0 z-50 flex flex-row justify-center items-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="flex flex-col gap-4 bg-white p-4 w-full sm:w-auto max-h-[90svh] overflow-y-auto">
      <SwipeControl
        title="SWIPE TO PAY"
        left-label="PAY"
        right-label="CANCEL"
        left-class="bg-black text-white"
        right-class="bg-red-100 text-red-800"
        @left="onPay"
        @right="emit('close')"
      >
        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col p-4">
          <p class="tracking-wider text-sm font-medium">PAY RECURRING</p>
          <p class="tracking-wider text-sm mt-1 truncate">{{ item.name }}</p>
          <p class="tracking-wider text-xs text-neutral-500 mt-1 truncate">{{ accountLabel }}</p>
        </div>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">AMOUNT TO PAY</p>

          <p
            v-if="item.type === 'approximate'"
            class="tracking-wider text-xs text-neutral-500 px-4 pb-1"
          >
            ENTER THE EXACT AMOUNT. THE EXPECTED AMOUNT IS BELOW.
          </p>
          <p
            v-else
            class="tracking-wider text-xs text-neutral-500 px-4 pb-1"
          >
            EDIT IF THE ACTUAL CHARGE DIFFERS.
          </p>

          <div class="flex flex-row gap-2 px-4 pb-4">
            <p class="tracking-wider text-sm pt-[6px]">PHP</p>
            <input
              v-model="amount"
              type="text"
              inputmode="decimal"
              :placeholder="expected"
              class="w-full text-3xl text-right bg-neutral-50"
              @input="onAmountInput"
            >
          </div>
        </div>

        <p
          v-if="!canPay"
          class="tracking-wider text-xs text-red-600 px-4"
        >
          AN AMOUNT IS REQUIRED BEFORE THIS CAN BE PAID.
        </p>
      </SwipeControl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SwipeControl from './SwipeControl.vue'
import { accountLabelById } from '../accounts'
import { formatAmountInput, parseAmount } from '../format'
import type { Account, RecurringTransaction } from '../types'

const props = defineProps<{
  item: RecurringTransaction
  accounts: Account[]
}>()

const emit = defineEmits<{
  close: []
  confirm: [amount: number]
}>()

const accountLabel = computed(() => accountLabelById(props.accounts, props.item.accountId))

// The expected amount is the placeholder, never a pre-filled value: for an
// approximate item the user must state the real figure themselves.
const expected = computed(() => props.item.amount.toFixed(2))

// Empty for an approximate item so nothing is accepted by inertia. For the
// other types the expected amount is pre-filled but still editable.
const amount = ref(props.item.type === 'approximate' ? '' : formatAmountInput(String(props.item.amount)))

const canPay = computed(() => parseAmount(amount.value) > 0)

function onAmountInput(event: Event) {
  // Read from the DOM node rather than the ref: `v-model` and this handler
  // both listen to `input`, and the ref may not hold the new value yet.
  const input = event.target as HTMLInputElement
  amount.value = formatAmountInput(input.value)
  // Re-sync the node when formatting changed the text, so the caret and the
  // displayed value don't drift from the ref.
  if (input.value !== amount.value) input.value = amount.value
}

function onPay() {
  const value = parseAmount(amount.value)
  if (!value) return
  emit('confirm', value)
}
</script>