<template>
  <div
    class="fixed inset-0 z-50 flex flex-row justify-center items-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="flex flex-col gap-4 bg-white p-4 w-full sm:w-auto max-h-[90svh] overflow-y-auto">
      <SwipeControl
        title="SWIPE TO EDIT OR DELETE"
        left-label="EDIT"
        right-label="DELETE"
        left-class="bg-black text-white"
        right-class="bg-red-100 text-red-800"
        @left="onEdit"
        @right="emit('delete')"
      >
        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col p-4">
          <p class="tracking-wider text-sm font-medium">{{ transaction.isRefund ? "REFUND" : "PAYMENT" }} DETAILS</p>
          <!-- Only present for an entry produced by a recurring item. The name
               is resolved live, so a rename shows through immediately. -->
          <p
            v-if="sourceTag"
            class="tracking-wider text-xs w-fit px-1 mt-1 mb-1 bg-neutral-200 text-neutral-800"
          >
            {{ sourceTag }}{{ sourceName ? ` - ${sourceName}` : '' }}
          </p>
          <div
            class="flex flex-row gap-2"
            :class="transaction.isRefund ? 'text-red-600' : ''"
          >
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

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">TRANSACTION DATE</p>
          <input
            v-model="date"
            type="datetime-local"
            class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white"
          >
        </div>

        <MarkdownEditor v-model="notes" />
      </SwipeControl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MarkdownEditor from './MarkdownEditor.vue'
import SelectPane from './SelectPane.vue'
import SwipeControl from './SwipeControl.vue'
import { CATEGORIES } from '../categories'
import { accountOptions } from '../accounts'
import { formatAmountInput, parseAmount } from '../format'
import type { Account, RecurringTransaction, Transaction } from '../types'

const props = defineProps<{
  transaction: Transaction
  accounts: Account[]
  recurring?: RecurringTransaction[]
}>()

const emit = defineEmits<{
  close: []
  save: [value: { accountId: number; category: string; amount: number; date: string; notes: string }]
  delete: []
}>()

const options = computed(() => accountOptions(props.accounts))

// Read-only provenance line. A `recurringId` whose source has been deleted
// resolves to nothing, so the tag still shows but the name is omitted.
const source = computed(() =>
  (props.recurring ?? []).find(r => r.id === props.transaction.recurringId),
)

const sourceName = computed(() => source.value?.name ?? '')

const sourceTag = computed(() => {
  if (props.transaction.recurringId === undefined) return ''
  return source.value?.type === 'auto' ? 'AUTO-DEDUCTED' : 'RECURRING'
})

// Held as a string to match the select, converted on save. Seeded from the
// stored id, which may no longer match an account — the select then renders
// blank until the user picks again, which is the honest signal.
const accountId = ref(String(props.transaction.accountId))
const category = ref(props.transaction.category ?? CATEGORIES[0] ?? '')
const notes = ref(props.transaction.notes ?? '')

// Kept as a string so the field can be cleared while typing; formatted as the
// user types and coerced back to a number on save.
const amount = ref(formatAmountInput(String(props.transaction.amount)))

// `datetime-local` needs `YYYY-MM-DDTHH:mm`, so drop seconds and timezone.
const date = ref(props.transaction.date.slice(0, 16))

function onAmountInput(event: Event) {
  // Read from the DOM node rather than the ref: `v-model` and this handler
  // both listen to `input`, and the ref may not hold the new value yet.
  const input = event.target as HTMLInputElement
  amount.value = formatAmountInput(input.value)
  // Re-sync the node when formatting changed the text, so the caret and the
  // displayed value don't drift from the ref.
  if (input.value !== amount.value) input.value = amount.value
}

function onEdit() {
  emit('save', {
    accountId: Number(accountId.value),
    category: category.value,
    amount: parseAmount(amount.value),
    date: date.value,
    notes: notes.value,
  })
}
</script>
