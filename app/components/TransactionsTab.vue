<template>
  <div class="flex flex-col gap-4 w-96">
    <div class="flex flex-col gap-[2px]">
      <p class="tracking-wider text-sm">REMAINING BALANCE</p>
      <ProgressBar :value="balance" :total="BALANCE_LIMIT" :threshold="20" />
    </div>

    <SwipeToTransact @pay="emit('pay', $event)" @refund="emit('refund', $event)" />

    <div class="w-96 h-[30rem] bg-neutral-50 flex flex-col">
      <p class="tracking-wider text-sm font-medium p-4">TRANSACTIONS</p>
      <div class="flex flex-col h-full overflow-y-scroll">
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
import ProgressBar from './ProgressBar.vue'
import SwipeToTransact from './SwipeToTransact.vue'
import TransactionItem from './TransactionItem.vue'
import type { Transaction } from '../types'

const BALANCE_LIMIT = 10000

defineProps<{
  balance: number
  transactions: Transaction[]
}>()

const emit = defineEmits<{
  pay: [amount: string]
  refund: [amount: string]
  select: [transaction: Transaction]
}>()
</script>
