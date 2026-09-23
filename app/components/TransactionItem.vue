<template>
  <button
    type="button"
    class="p-4 text-sm bg-neutral-100 text-left w-full cursor-pointer"
    @click="emit('select')"
  >
    <span class="flex flex-row items-center justify-between">
      <p class="tracking-wider text-sm border border-black w-fit px-1">{{ label }}</p>
      <p>{{ formattedDate }}</p>
    </span>
    <p
      v-if="sourceTag"
      class="tracking-wider text-xs w-fit px-1 mt-1"
      :class="sourceTag === 'AUTO-DEDUCTED' ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-100 text-neutral-800 border border-neutral-300'"
    >
      {{ sourceTag }}
    </p>
    <div
      class="flex flex-row gap-1 justify-end"
      :class="isRefund ? 'text-red-600' : ''"
    >
      <p class="tracking-wider text-sm pt-[2px]">PHP</p>
      <p class="text-3xl text-right bg-transparent">{{ formattedAmount }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { accountLabelById } from '../accounts'
import type { Account, RecurringTransaction } from '../types'

const props = defineProps<{
  accountId: number
  accounts: Account[]
  amount: number
  date: string
  isRefund?: boolean
  /** Set when the entry came from a recurring item. */
  recurringId?: number
  recurring?: RecurringTransaction[]
}>()

const emit = defineEmits<{
  select: []
}>()

// Resolved through the live account list, so a rename shows up on every row.
// A deleted account leaves the id dangling; the label says so rather than
// rendering blank.
const label = computed(() => accountLabelById(props.accounts, props.accountId))

// `auto` items have no manual pay path, so a linked entry from one is always a
// deduction. Everything else reached the ledger because a user paid it.
const sourceTag = computed(() => {
  if (props.recurringId === undefined) return ''
  const source = (props.recurring ?? []).find(r => r.id === props.recurringId)
  return source?.type === 'auto' ? 'AUTO-DEDUCTED' : 'RECURRING'
})

const formattedAmount = computed(() => props.amount.toFixed(2))

const formattedDate = computed(() =>
  new Date(props.date).toLocaleString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }),
)
</script>
