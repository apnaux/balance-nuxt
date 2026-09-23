<template>
  <SwipeControl
    title="SWIPE TO TRANSACT"
    left-label="PAY"
    right-label="REFUND"
    @left="onPay"
    @right="onRefund"
  >
    <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col p-4">
      <p class="tracking-wider text-sm font-medium">TRANSACT</p>
      <div class="flex flex-row gap-2">
        <p class="tracking-wider text-sm">PHP</p>
        <input
          v-model="amount"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          class="w-full text-6xl text-right bg-neutral-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          @input="onAmountInput"
        >
      </div>
    </div>

    <div class="flex flex-row w-full sm:w-[30rem]">
      <SelectPane
        label="ACCOUNT"
        :options="options.labels"
        :option-values="options.values"
        :selected="accountId"
        @select="accountId = $event"
      />

      <SelectPane
        label="CATEGORY"
        :options="CATEGORIES"
        :selected="category"
        @select="category = $event"
      />
    </div>
  </SwipeControl>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SelectPane from './SelectPane.vue'
import SwipeControl from './SwipeControl.vue'
import { CATEGORIES } from '../categories'
import { accountOptions } from '../accounts'
import { formatAmountInput, parseAmount } from '../format'
import type { Account, TransactPayload } from '../types'

const props = defineProps<{
  accounts: Account[]
}>()

const options = computed(() => accountOptions(props.accounts))

const amount = ref('')
// Held as a string to match the select, converted to a number on emit.
const accountId = ref(options.value.values[0] ?? '')
const category = ref(CATEGORIES[0] ?? '')

const emit = defineEmits<{
  pay: [payload: TransactPayload]
  refund: [payload: TransactPayload]
}>()

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
  if (!value || !accountId.value) return
  emit('pay', { amount: value, accountId: Number(accountId.value), category: category.value })
  amount.value = ''
}

function onRefund() {
  const value = parseAmount(amount.value)
  if (!value || !accountId.value) return
  emit('refund', { amount: value, accountId: Number(accountId.value), category: category.value })
  amount.value = ''
}
</script>
