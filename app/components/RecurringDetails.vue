<template>
  <div
    class="fixed inset-0 z-50 flex flex-row justify-center items-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="flex flex-col gap-4 bg-white p-4 w-full sm:w-auto max-h-[90svh] overflow-y-auto">
      <SwipeControl
        title="SWIPE TO SAVE OR DELETE"
        left-label="SAVE"
        right-label="DELETE"
        left-class="bg-black text-white"
        right-class="bg-red-100 text-red-800"
        @left="onSave"
        @right="emit('delete')"
      >
        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col p-4">
          <p class="tracking-wider text-sm font-medium">RECURRING DETAILS</p>
          <p class="tracking-wider text-sm mt-1">{{ item ? item.name : 'NEW RECURRING TRANSACTION' }}</p>
        </div>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">NAME</p>
          <input
            v-model="name"
            type="text"
            placeholder="NETFLIX"
            class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
          >
        </div>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">AMOUNT</p>
          <p class="tracking-wider text-xs text-neutral-500 px-4 pb-1">
            {{ type === 'approximate' ? 'THE EXPECTED AMOUNT. THE EXACT VALUE IS ASKED WHEN PAYING.' : 'DEDUCTED AS ENTERED.' }}
          </p>
          <div class="flex flex-row gap-2 px-4 pb-4">
            <p class="tracking-wider text-sm pt-[6px]">PHP</p>
            <input
              v-model="amount"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              class="w-full text-3xl text-right bg-neutral-50"
              @input="onAmountInput"
            >
          </div>
        </div>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">TYPE</p>
          <div class="flex flex-row gap-2 mx-4 mb-4">
            <button
              v-for="option in TYPES"
              :key="option.value"
              type="button"
              class="flex-1 tracking-wider text-sm px-2 py-1 cursor-pointer"
              :class="type === option.value ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'"
              @click="type = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <p class="tracking-wider text-xs text-neutral-500 px-4 pb-4">{{ typeHint }}</p>
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
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">RECURRENCE</p>
          <div class="flex flex-row gap-2 mx-4 mb-4">
            <button
              v-for="option in RECURRENCES"
              :key="option"
              type="button"
              class="flex-1 tracking-wider text-sm px-2 py-1 cursor-pointer"
              :class="recurrence === option ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'"
              @click="recurrence = option"
            >
              {{ option.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="flex flex-row w-full sm:w-[30rem]">
          <div v-if="recurrence === 'yearly'" class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
            <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">MONTH</p>
            <input
              v-model="dueMonth"
              type="text"
              inputmode="numeric"
              placeholder="1-12"
              class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
            >
          </div>

          <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
            <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">DUE DAY</p>
            <input
              v-model="dueDay"
              type="text"
              inputmode="numeric"
              placeholder="1-31"
              class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
            >
          </div>
        </div>

        <p class="tracking-wider text-xs text-neutral-500 px-4">
          THE DUE DAY IS SHOWN FOR REFERENCE. {{ dueDayHint }}
        </p>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">STATUS</p>
          <div class="flex flex-row gap-2 mx-4 mb-4">
            <button
              type="button"
              class="flex-1 tracking-wider text-sm px-2 py-1 cursor-pointer"
              :class="active ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'"
              @click="active = true"
            >
              ACTIVE
            </button>
            <button
              type="button"
              class="flex-1 tracking-wider text-sm px-2 py-1 cursor-pointer"
              :class="active ? 'bg-neutral-200 text-neutral-600' : 'bg-black text-white'"
              @click="active = false"
            >
              INACTIVE
            </button>
          </div>
        </div>
      </SwipeControl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SelectPane from './SelectPane.vue'
import SwipeControl from './SwipeControl.vue'
import { CATEGORIES } from '../categories'
import { accountOptions } from '../accounts'
import { clamp } from '../recurring'
import { formatAmountInput, parseAmount } from '../format'
import type { Account, Recurrence, RecurrenceType, RecurringTransaction } from '../types'

const props = defineProps<{
  /** Omitted when creating. */
  item?: RecurringTransaction
  accounts: Account[]
}>()

const emit = defineEmits<{
  close: []
  save: [value: Omit<RecurringTransaction, 'id'>]
  delete: []
}>()

const TYPES: { value: RecurrenceType; label: string }[] = [
  { value: 'default', label: 'DUE' },
  { value: 'auto', label: 'AUTO' },
  { value: 'approximate', label: 'APPROX' },
]

const RECURRENCES: Recurrence[] = ['monthly', 'yearly']

const TYPE_HINTS: Record<RecurrenceType, string> = {
  default: 'PAY IT BY HAND WHEN IT COMES DUE.',
  auto: 'DEDUCTED AT THE START OF EVERY CYCLE. NO MANUAL PAY.',
  approximate: 'PAY IT BY HAND. THE EXACT AMOUNT IS ASKED EACH TIME.',
}

const options = computed(() => accountOptions(props.accounts))

const name = ref(props.item?.name ?? '')
const accountId = ref(String(props.item?.accountId ?? props.accounts[0]?.id ?? ''))
const category = ref(props.item?.category ?? CATEGORIES[0] ?? '')
const type = ref<RecurrenceType>(props.item?.type ?? 'default')
const recurrence = ref<Recurrence>(props.item?.recurrence ?? 'monthly')
const active = ref(props.item?.active ?? true)

// Kept as strings so the fields can be cleared while typing; coerced on save.
const amount = ref(formatAmountInput(String(props.item?.amount ?? '')))
const dueDay = ref(String(props.item?.dueDay ?? 1))
const dueMonth = ref(String(props.item?.dueMonth ?? 1))

const typeHint = computed(() => TYPE_HINTS[type.value])

const dueDayHint = computed(() =>
  recurrence.value === 'yearly'
    ? 'A YEARLY ITEM IS DEDUCTED AT THE CYCLE START THAT CONTAINS THIS DATE.'
    : 'A DUE DAY PAST THE END OF A SHORT MONTH CLAMPS TO ITS LAST DAY.',
)

function onAmountInput(event: Event) {
  // Read from the DOM node rather than the ref: `v-model` and this handler
  // both listen to `input`, and the ref may not hold the new value yet.
  const input = event.target as HTMLInputElement
  amount.value = formatAmountInput(input.value)
  // Re-sync the node when formatting changed the text, so the caret and the
  // displayed value don't drift from the ref.
  if (input.value !== amount.value) input.value = amount.value
}

function onSave() {
  const isYearly = recurrence.value === 'yearly'

  emit('save', {
    name: name.value.trim(),
    accountId: Number(accountId.value),
    category: category.value,
    amount: parseAmount(amount.value),
    type: type.value,
    recurrence: recurrence.value,
    dueDay: clamp(Number(dueDay.value), 1, 31),
    dueMonth: isYearly ? clamp(Number(dueMonth.value), 1, 12) : undefined,
    active: active.value,
  })
}
</script>