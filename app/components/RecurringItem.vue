<template>
  <div class="p-4 text-sm bg-neutral-100" :class="item.active ? '' : 'opacity-50'">
    <span class="flex flex-row items-center justify-between gap-2">
      <p class="tracking-wider text-sm border border-black w-fit px-1 truncate">{{ item.name }}</p>
      <span class="flex flex-row gap-1 shrink-0">
        <p
          v-if="paidThisCycle"
          class="tracking-wider text-xs px-1 bg-green-100 text-green-800"
        >
          PAID
        </p>
        <p
          class="tracking-wider text-xs px-1"
          :class="TYPE_CLASS[item.type]"
        >
          {{ TYPE_LABEL[item.type] }}
        </p>
      </span>
    </span>

    <p class="tracking-wider text-sm mt-1 truncate">{{ label }}</p>
    <p class="tracking-wider text-xs text-neutral-500 mt-1">{{ recurrenceLabel(item) }}</p>

    <div class="flex flex-row items-center justify-between gap-2 mt-1">
      <!-- An `auto` item has no manual pay path (see `onPayRecurring`), so it
           reports its state instead of offering a button. -->
      <span
        v-if="item.type === 'auto'"
        class="tracking-wider text-xs"
        :class="paidThisCycle ? 'text-green-800' : 'text-neutral-500'"
      >
        {{ paidThisCycle ? 'AUTO-DEDUCTED THIS CYCLE' : 'DEDUCTS AT CYCLE START' }}
      </span>
      <button
        v-else-if="paidThisCycle"
        type="button"
        class="tracking-wider text-sm px-2 py-1 border border-green-800 text-green-800 cursor-pointer"
        @click="emit('pay')"
      >
        PAID - PAY AGAIN
      </button>
      <button
        v-else
        type="button"
        class="tracking-wider text-sm font-medium bg-black text-white px-2 py-1 cursor-pointer"
        @click="emit('pay')"
      >
        PAY
      </button>

      <span class="flex flex-row gap-2 ml-auto">
        <button
          type="button"
          class="tracking-wider text-sm px-2 py-1 border border-black cursor-pointer"
          @click="emit('edit')"
        >
          EDIT
        </button>
      </span>
    </div>

    <div class="flex flex-row gap-1 justify-end mt-1">
      <p class="tracking-wider text-sm pt-[2px]">PHP</p>
      <p class="text-3xl text-right">{{ formattedAmount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { accountLabelById } from '../accounts'
import { recurrenceLabel } from '../recurring'
import type { Account, RecurrenceType, RecurringTransaction, Transaction } from '../types'

const props = defineProps<{
  item: RecurringTransaction
  accounts: Account[]
  transactions: Transaction[]
  /** Start of the cycle in progress, so "paid" is scoped to this cycle. */
  cycleStart: string
}>()

const emit = defineEmits<{
  edit: []
  pay: []
}>()

const TYPE_LABEL: Record<RecurrenceType, string> = {
  default: 'DUE',
  auto: 'AUTO',
  approximate: 'APPROX',
}

const TYPE_CLASS: Record<RecurrenceType, string> = {
  default: 'bg-neutral-200 text-neutral-800',
  auto: 'bg-black text-white',
  approximate: 'bg-neutral-200 text-neutral-800',
}

const label = computed(() => accountLabelById(props.accounts, props.item.accountId))

// Scoped to the cycle in progress: last cycle's payment must not mark this
// cycle as settled. Mirrors the guard `runAutoDeduct` uses, so the tag and the
// deduction always agree.
const paidThisCycle = computed(() => {
  const start = new Date(props.cycleStart).getTime()
  return props.transactions.some(t =>
    t.recurringId === props.item.id && new Date(t.date).getTime() >= start,
  )
})

const formattedAmount = computed(() => props.item.amount.toFixed(2))
</script>