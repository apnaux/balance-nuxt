<template>
  <div class="h-svh w-svw flex flex-row justify-center p-4 sm:py-8 overflow-hidden">
    <div class="flex flex-col gap-4 min-h-0 h-full w-full sm:w-[30rem]">
      <TabSwitcher v-model="tab" />

      <div class="flex flex-col gap-[2px]">
        <p class="tracking-wider text-sm">REMAINING BALANCE</p>
        <ProgressBar :value="balance" :total="cycleBudget" :threshold="20" />
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
          <SettingsTab
            :user="user"
            :budget="budget"
            :cycle="cycle"
            :cycle-key="cycleKey"
            :cycle-label="cycleLabel"
            :current-start="currentStart.toISOString()"
            :next-start="nextStart.toISOString()"
            @login="onLogin"
            @sign-up="onSignUp"
            @logout="onLogout"
            @set-budget-permanent="onSetBudgetPermanent"
            @set-budget-temporary="onSetBudgetTemporary"
            @clear-budget-temporary="onClearBudgetTemporary"
            @change-cycle="onChangeCycle"
          />
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
import type { Account, Budget, Cycle, Transaction, User } from './types'
import type { TransactPayload } from './components/TransactionsTab.vue'
import { cycleStartAfter, cycleStartOnOrBefore, formatCycleDate } from './cycle'

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

// --- Settings -------------------------------------------------------------

// No auth backend. Logging in just records an email locally so the Account
// Details section has something to show.
const user = ref<User | null>(null)

const cycle = ref<Cycle>({ startDay: 15 })

// One budget for the whole cycle, not one per category. The budget tracks the
// remaining balance, so a single number is the whole model.
const budget = ref<Budget>({ amount: 10000 })

// Cycle boundaries are derived from `startDay` and today's date, so changing
// the start day moves them without any stored dates to keep in sync.
const currentStart = computed(() => cycleStartOnOrBefore(new Date(), cycle.value.startDay))
const nextStart = computed(() => cycleStartAfter(new Date(), cycle.value.startDay))

/** Keys the per-cycle budget overrides. */
const cycleKey = computed(() => {
  const d = currentStart.value
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
})

const cycleLabel = computed(
  () => `${formatCycleDate(currentStart.value)} - ${formatCycleDate(nextStart.value)}`,
)

// The limit in force this cycle: a one-off override if one was set, else the
// standing budget. This is the number the progress bar measures against.
const cycleBudget = computed(() => budget.value.overrides?.[cycleKey.value] ?? budget.value.amount)

// Balance is derived from the ledger rather than stored, so editing or deleting
// a transaction can never leave it out of sync. Refunds add, payments subtract.
// It starts from the cycle budget, so changing the budget moves the bar.
const balance = computed(() =>
  transactions.value.reduce(
    (sum, t) => (t.isRefund ? sum + t.amount : sum - t.amount),
    cycleBudget.value,
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

// --- Settings -------------------------------------------------------------

function onLogin(credentials: { email: string; password: string }) {
  user.value = { email: credentials.email, createdAt: new Date().toISOString() }
}

function onSignUp(credentials: { email: string; password: string }) {
  onLogin(credentials)
}

function onLogout() {
  user.value = null
}

function onSetBudgetPermanent(amount: number) {
  budget.value.amount = amount
  // A standing change supersedes any one-off set for the cycle in progress.
  if (budget.value.overrides) delete budget.value.overrides[cycleKey.value]
}

function onSetBudgetTemporary(amount: number) {
  budget.value.overrides = { ...budget.value.overrides, [cycleKey.value]: amount }
}

function onClearBudgetTemporary() {
  if (!budget.value.overrides) return
  delete budget.value.overrides[cycleKey.value]
}

// Deferred by design: the cycle in progress keeps its boundaries, and the new
// start day applies from the next cycle onward.
function onChangeCycle(startDay: number) {
  cycle.value = { startDay }
}
</script>
