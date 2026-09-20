<template>
  <div class="flex flex-col gap-4 w-full sm:w-[30rem] h-full min-h-0">
    <SwipeToTransact
      :accounts="accounts"
      @pay="emit('pay', $event)"
      @refund="emit('refund', $event)"
    />

    <div class="w-full sm:w-[30rem] flex-1 min-h-0 bg-neutral-50 flex flex-col">
      <p class="tracking-wider text-sm font-medium p-4">TRANSACTIONS</p>
      <div class="flex flex-col flex-1 min-h-0 overflow-y-scroll">
        <TransactionItem
          v-for="transaction in transactions"
          :key="transaction.id"
          :account="transaction.account"
          :amount="transaction.amount"
          :date="transaction.date"
          :is-refund="transaction.isRefund"
          @select="emit('select', transaction)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SwipeToTransact from './SwipeToTransact.vue'
import TransactionItem from './TransactionItem.vue'
import type { Account, Transaction } from '../types'

/** Payload emitted by `SwipeToTransact` when a swipe completes. */
export type TransactPayload = {
  amount: number
  account: string
  category: string
}

defineProps<{
  accounts: Account[]
  transactions: Transaction[]
}>()

const emit = defineEmits<{
  pay: [payload: TransactPayload]
  refund: [payload: TransactPayload]
  select: [transaction: Transaction]
}>()
</script>
