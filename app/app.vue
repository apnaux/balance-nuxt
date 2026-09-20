<template>
  <div class="h-svh w-svw flex flex-row justify-center mt-12">
    <div class="flex flex-col gap-4">
      <TabSwitcher v-model="tab" />

      <TransactionsTab
        v-if="tab === 'transactions'"
        :balance="balance"
        :transactions="transactions"
        @pay="onPay"
        @refund="onRefund"
        @select="selected = $event"
      />

      <AccountsTab v-else-if="tab === 'accounts'" />

      <SettingsTab v-else />
    </div>

    <TransactionDetails
      v-if="selected"
      :transaction="selected"
      @close="selected = null"
      @save="onSave"
      @delete="onDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tab } from './components/TabSwitcher.vue'
import type { Transaction } from './types'

const balance = ref(4000)

const tab = ref<Tab>('transactions')

const transactions = ref<Transaction[]>([
  {
    id: 1,
    account: 'BDO *3000',
    amount: 100,
    date: '2026-01-01T12:00:00',
    isRefund: false,
  },
  {
    id: 2,
    account: 'BDO *3000',
    amount: 100,
    date: '2026-01-01T12:00:00',
    isRefund: true,
  },
])

const selected = ref<Transaction | null>(null)

function onPay(amount: string) {
  console.log('Pay', amount)
}

function onRefund(amount: string) {
  console.log('Refund', amount)
}

function onSave(value: { account: string; category: string; amount: number; date: string; notes: string }) {
  if (!selected.value) return
  Object.assign(selected.value, value)
  selected.value = null
}

function onDelete() {
  if (!selected.value) return
  transactions.value = transactions.value.filter((t) => t.id !== selected.value?.id)
  selected.value = null
}
</script>
