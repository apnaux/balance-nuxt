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
            :recurring="recurring"
            @pay="onPay"
            @refund="onRefund"
            @select="selected = $event"
          />
        </template>

        <template #recurring>
          <RecurringTab
            :items="recurring"
            :accounts="accounts"
            :transactions="transactions"
            :cycle-start="currentStart.toISOString()"
            @create="onCreateRecurring"
            @edit="onEditRecurring"
            @pay="onPayRecurring"
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
      :recurring="recurring"
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

    <RecurringDetails
      v-if="recurringModalOpen"
      :item="selectedRecurring ?? undefined"
      :accounts="accounts"
      @close="closeRecurringModal"
      @save="onSaveRecurring"
      @delete="onDeleteRecurring"
    />

    <PayRecurringDialog
      v-if="payingRecurring"
      :item="payingRecurring"
      :accounts="accounts"
      @close="payingRecurring = null"
      @confirm="onConfirmRecurringPay"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Tab } from './tabs'
import type { Account, Budget, Cycle, RecurringTransaction, Transaction, TransactPayload, User } from './types'
import { cycleStartAfter, cycleStartOnOrBefore, formatCycleDate } from './cycle'

const tab = ref<Tab>('transactions')

const transactions = ref<Transaction[]>([
  {
    id: 1,
    accountId: 1,
    amount: 100,
    date: '2026-01-01T12:00:00',
    isRefund: false,
  },
  {
    id: 2,
    accountId: 1,
    amount: 100,
    date: '2026-01-01T12:00:00',
    isRefund: true,
  },
])

const selected = ref<Transaction | null>(null)

// --- Recurring ------------------------------------------------------------

const recurring = ref<RecurringTransaction[]>([
  {
    id: 1,
    name: 'Car Loan',
    accountId: 1,
    category: 'OTHERS',
    amount: 5000,
    type: 'auto',
    recurrence: 'monthly',
    dueDay: 15,
    active: true,
  },
  {
    id: 2,
    name: 'Netflix',
    accountId: 2,
    category: 'SUBSCRIPTION',
    amount: 549,
    type: 'default',
    recurrence: 'monthly',
    dueDay: 20,
    active: true,
  },
  {
    id: 3,
    name: 'Meralco',
    accountId: 1,
    category: 'UTILITIES',
    amount: 3500,
    type: 'approximate',
    recurrence: 'monthly',
    dueDay: 25,
    active: true,
  },
])

// `null` means the modal is closed, matching the accounts pattern. The open
// state is tracked separately because `null` also means "create".
const recurringModalOpen = ref(false)
const selectedRecurring = ref<RecurringTransaction | null>(null)

// The item awaiting payment confirmation. Only ever a `default` or
// `approximate` item: an `auto` item has no manual pay path.
const payingRecurring = ref<RecurringTransaction | null>(null)

function onCreateRecurring() {
  selectedRecurring.value = null
  recurringModalOpen.value = true
}

function onEditRecurring(item: RecurringTransaction) {
  selectedRecurring.value = item
  recurringModalOpen.value = true
}

function closeRecurringModal() {
  recurringModalOpen.value = false
  selectedRecurring.value = null
}

function onSaveRecurring(value: Omit<RecurringTransaction, 'id'>) {
  if (selectedRecurring.value) {
    Object.assign(selectedRecurring.value, value)
  } else {
    const nextId = Math.max(0, ...recurring.value.map(r => r.id)) + 1
    recurring.value.push({ id: nextId, ...value })
  }
  closeRecurringModal()
}

function onDeleteRecurring() {
  if (!selectedRecurring.value) return
  recurring.value = recurring.value.filter(r => r.id !== selectedRecurring.value?.id)
  closeRecurringModal()
}

function onPayRecurring(item: RecurringTransaction) {
  // Belt and braces: the PAY button is not rendered for `auto` items, but the
  // guard stays so a future caller cannot bypass the auto-deduct rule.
  if (item.type === 'auto') return
  payingRecurring.value = item
}

function onConfirmRecurringPay(amount: number) {
  const item = payingRecurring.value
  if (!item) return

  transactions.value.unshift({
    id: nextTransactionId(),
    accountId: item.accountId,
    category: item.category,
    amount,
    date: new Date().toISOString(),
    isRefund: false,
    recurringId: item.id,
  })

  payingRecurring.value = null
}

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

// --- Auto-deduct ----------------------------------------------------------

// Items already handled in this session, so a `cycleKey` change in the same
// tick cannot race the mount pass. The durable guard is the ledger scan in
// `alreadyDeductedThisCycle`, which also survives a reload.
const autoDeductedThisSession = new Set<number>()

/** True when the ledger already holds an entry for this item this cycle. */
function alreadyDeductedThisCycle(item: RecurringTransaction) {
  const start = currentStart.value.getTime()
  return transactions.value.some(t =>
    t.recurringId === item.id && new Date(t.date).getTime() >= start,
  )
}

/**
 * Deduct every active `auto` item that applies to the cycle in progress.
 *
 * Fires at cycle start, not on the due date: an `auto` item is an expected
 * expense, so there is nothing to wait for. The entry is dated at the cycle
 * start, so it reads correctly whenever the app is opened.
 */
function runAutoDeduct() {
  const start = currentStart.value

  for (const item of recurring.value) {
    if (item.type !== 'auto' || !item.active) continue
    if (autoDeductedThisSession.has(item.id)) continue
    if (alreadyDeductedThisCycle(item)) continue

    transactions.value.unshift({
      id: nextTransactionId(),
      accountId: item.accountId,
      category: item.category,
      amount: item.amount,
      date: start.toISOString(),
      isRefund: false,
      recurringId: item.id,
    })

    autoDeductedThisSession.add(item.id)
  }
}

// Gated to the client: the first render is server-side, and a deduction made
// there would write to a ledger that is about to be discarded. Runs on mount
// because entries are back-filled for the cycle in progress rather than created
// at the moment the cycle rolls over.
if (import.meta.client) {
  nextTick(runAutoDeduct)
  watch(cycleKey, runAutoDeduct)
}

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
    accountId: payload.accountId,
    category: payload.category,
    amount: payload.amount,
    date: new Date().toISOString(),
    isRefund: false,
  })
}

function onRefund(payload: TransactPayload) {
  transactions.value.unshift({
    id: nextTransactionId(),
    accountId: payload.accountId,
    category: payload.category,
    amount: payload.amount,
    date: new Date().toISOString(),
    isRefund: true,
  })
}

function nextTransactionId() {
  return Math.max(0, ...transactions.value.map(t => t.id)) + 1
}

function onSave(value: { accountId: number; category: string; amount: number; date: string; notes: string }) {
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
