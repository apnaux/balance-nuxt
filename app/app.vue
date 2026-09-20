<template>
  <div class="h-svh w-svw flex flex-row justify-center p-4 sm:py-8 overflow-hidden">
    <div class="flex flex-col gap-4 min-h-0 h-full w-full sm:w-[30rem]">
      <TabSwitcher v-model="tab" />

      <div class="flex flex-col gap-[2px]">
        <p class="tracking-wider text-sm">REMAINING BALANCE</p>
        <ProgressBar :value="balance" :total="BALANCE_LIMIT" :threshold="20" />
      </div>

      <TabSwiper v-model="tab">
        <template #transactions>
          <TransactionsTab
            :accounts="accounts"
            :transactions="transactions"
            @pay="onPay"
            @refund="onRefund"
            @select="selected = $event"
          />
        </template>

        <template #accounts>
          <AccountsTab
            :accounts="accounts"
            @create="onCreateAccount"
            @select="onSelectAccount"
          />
        </template>

        <template #settings>
          <SettingsTab />
        </template>
      </TabSwiper>
    </div>

    <TransactionDetails
      v-if="selected"
      :transaction="selected"
      :accounts="accounts"
      @close="selected = null"
      @save="onSave"
      @delete="onDelete"
    />

    <AccountDetails
      v-if="accountModalOpen"
      :account="selectedAccount ?? undefined"
      @close="closeAccountModal"
      @save="onSaveAccount"
      @delete="onDeleteAccount"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Tab } from './tabs'
import type { Account, Transaction } from './types'
import type { TransactPayload } from './components/TransactionsTab.vue'

const BALANCE_LIMIT = 10000

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

// Balance is derived from the ledger rather than stored, so editing or deleting
// a transaction can never leave it out of sync. Refunds add, payments subtract.
const balance = computed(() =>
  transactions.value.reduce(
    (sum, t) => (t.isRefund ? sum + t.amount : sum - t.amount),
    BALANCE_LIMIT,
  ),
)

const accounts = ref<Account[]>([
  {
    id: 1,
    bankName: 'Banco de Oro',
    bankShortName: 'BDO',
    last4: '3000',
    type: 'debit',
  },
  {
    id: 2,
    bankName: 'Bank of the Philippine Islands',
    bankShortName: 'BPI',
    last4: '1234',
    type: 'credit',
    statementDay: 15,
    paymentDueDays: 20,
    creditLimit: 50000,
  },
])

// `null` means the modal is closed. An account means edit; `undefined` means
// create, which is why the open state is tracked separately.
const accountModalOpen = ref(false)
const selectedAccount = ref<Account | null>(null)

function onCreateAccount() {
  selectedAccount.value = null
  accountModalOpen.value = true
}

function onSelectAccount(account: Account) {
  selectedAccount.value = account
  accountModalOpen.value = true
}

function closeAccountModal() {
  accountModalOpen.value = false
  selectedAccount.value = null
}

function onSaveAccount(value: Omit<Account, 'id'>) {
  if (selectedAccount.value) {
    Object.assign(selectedAccount.value, value)
  } else {
    const nextId = Math.max(0, ...accounts.value.map(a => a.id)) + 1
    accounts.value.push({ id: nextId, ...value })
  }
  closeAccountModal()
}

function onDeleteAccount() {
  if (!selectedAccount.value) return
  accounts.value = accounts.value.filter(a => a.id !== selectedAccount.value?.id)
  closeAccountModal()
}

function onPay(payload: TransactPayload) {
  transactions.value.unshift({
    id: nextTransactionId(),
    account: payload.account,
    category: payload.category,
    amount: payload.amount,
    date: new Date().toISOString(),
    isRefund: false,
  })
}

function onRefund(payload: TransactPayload) {
  transactions.value.unshift({
    id: nextTransactionId(),
    account: payload.account,
    category: payload.category,
    amount: payload.amount,
    date: new Date().toISOString(),
    isRefund: true,
  })
}

function nextTransactionId() {
  return Math.max(0, ...transactions.value.map(t => t.id)) + 1
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
