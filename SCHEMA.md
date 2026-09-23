# SCHEMA.md — balance-nuxt

Data shapes, component contracts, and the invariants that connect them.

There is no database and no API. Every type below is a TypeScript type in
`app/types.ts` or a local `defineProps` block, and every value lives in a `ref`
in `app/app.vue`.

## Domain types

`app/types.ts`:

```ts
export type Transaction = {
  id: number
  account: string      // display label, e.g. "DEBIT - BDO *3000"
  amount: number       // always positive; direction comes from isRefund
  date: string         // ISO 8601, e.g. "2026-01-01T12:00:00"
  isRefund: boolean
  category?: string
  notes?: string       // markdown
}

export type AccountType = 'credit' | 'debit'

export type Account = {
  id: number
  bankName: string        // "Banco de Oro"
  bankShortName: string   // "BDO" — free text, not derived from bankName
  last4: string           // last four digits, stored as a string
  type: AccountType
  statementDay?: number     // credit only, 1-31
  paymentDueDays?: number   // credit only, days after statementDay
  creditLimit?: number      // credit only
}

export type User = {
  email: string
  createdAt: string       // ISO timestamp, set on login
}

export type Cycle = {
  startDay: number        // day of the month a cycle starts, 1-31
}

/**
 * A single spending budget for a cycle. Deliberately not per category: the
 * budget tracks the remaining balance, so one number covers the whole cycle.
 */
export type Budget = {
  amount: number          // the standing limit
  overrides?: Record<string, number>   // one-off limits, keyed by cycle start
}
```

### Invariants

1. **`amount` is never negative.** A refund is `isRefund: true` with a positive
   `amount`. Nothing in the codebase branches on a negative amount.
2. **`account` is a denormalized display string, not a foreign key.** Stored on
   the transaction. Renaming an account does not update existing transactions,
   and neither does changing the label format this repo writes. This is a known
   gap, not an oversight.
3. **Credit-only fields are `undefined` on debit accounts.** `AccountDetails`
   drops them on save rather than leaving stale values behind.
4. **`type` is immutable after creation.** The modal renders a read-only label
   when editing. Switching credit to debit would orphan the three credit fields.
5. **`id` is unique within its collection.** New ids come from
   `Math.max(0, ...items.map(i => i.id)) + 1`.
6. **A `Budget` override is keyed by the cycle start date as `YYYY-MM-DD`.**
   The key comes from `cycleKey`; once the cycle rolls over, the old key is
   never read again. Nothing prunes stale keys.
7. **`account` labels are built as `` `${TYPE} - ${bankShortName} *${last4}` ``.**
   Type first, uppercase, so a native select can carry the grouping even though
   its popup cannot be styled. There is no `<optgroup>`; see `AGENTS.md`.

## State ownership

All state is in `app/app.vue`. No component owns domain data.

| Ref | Type | Purpose |
|---|---|---|
| `tab` | `Tab` | Active tab, `'transactions' \| 'accounts' \| 'settings'` |
| `transactions` | `Transaction[]` | The ledger. Newest first. |
| `accounts` | `Account[]` | Seeded with one debit and one credit account |
| `selected` | `Transaction \| null` | Transaction modal. `null` = closed |
| `selectedAccount` | `Account \| null` | `null` = create mode |
| `accountModalOpen` | `boolean` | Separate from `selectedAccount`, because `null` means "create" |
| `user` | `User \| null` | Set by `LoginPane`, cleared by `AccountPane` |
| `cycle` | `Cycle` | Cycle start day |
| `budget` | `Budget` | Standing limit plus any per-cycle overrides |

### Derived values

There is no `BALANCE_LIMIT`. The budget and the balance are one number: the
balance starts from the cycle budget, so changing the budget moves the bar.

```ts
const currentStart = computed(() => cycleStartOnOrBefore(new Date(), cycle.value.startDay))
const nextStart = computed(() => cycleStartAfter(new Date(), cycle.value.startDay))

// The current cycle's start date as `YYYY-MM-DD`, used as the override key.
const cycleKey = computed(() => /* currentStart formatted */)

// One-off override if one was set this cycle, else the standing budget.
const cycleBudget = computed(() => budget.value.overrides?.[cycleKey.value] ?? budget.value.amount)

const balance = computed(() =>
  transactions.value.reduce(
    (sum, t) => (t.isRefund ? sum + t.amount : sum - t.amount),
    cycleBudget.value,
  ),
)
```

`ProgressBar` receives `:value="balance" :total="cycleBudget" :threshold="20"`.
All three are **derived, never stored**. Editing or deleting a transaction, or
changing the budget, updates the bar with no extra wiring. Refunds add, payments
subtract.

## Mutations

All in `app/app.vue`:

| Handler | Trigger | Effect |
|---|---|---|
| `onPay(payload)` | `SwipeToTransact` → `pay` | `unshift` a payment, `date: new Date().toISOString()` |
| `onRefund(payload)` | `SwipeToTransact` → `refund` | `unshift` a refund |
| `onSave(value)` | `TransactionDetails` → `save` | `Object.assign` onto `selected`, then close |
| `onDelete()` | `TransactionDetails` → `delete` | Filter out `selected.id`, then close |
| `onCreateAccount()` | `AccountsTab` → `create` | `selectedAccount = null`, open modal |
| `onSelectAccount(a)` | `AccountsTab` → `select` | Set `selectedAccount`, open modal |
| `onSaveAccount(value)` | `AccountDetails` → `save` | Assign if editing, else push with a new id |
| `onDeleteAccount()` | `AccountDetails` → `delete` | Filter out `selectedAccount.id` |
| `onLogin(credentials)` | `SettingsTab` → `login` | Set `user` with `createdAt: new Date().toISOString()` |
| `onSignUp(credentials)` | `SettingsTab` → `signUp` | Delegates to `onLogin`. No backend, so they are identical |
| `onLogout()` | `SettingsTab` → `logout` | `user = null` |
| `onSetBudgetPermanent(amount)` | `SettingsTab` → `setBudgetPermanent` | Sets `budget.amount`, then deletes any override for the current cycle |
| `onSetBudgetTemporary(amount)` | `SettingsTab` → `setBudgetTemporary` | `overrides[cycleKey] = amount`, one cycle only |
| `onClearBudgetTemporary()` | `SettingsTab` → `clearBudgetTemporary` | Delete `overrides[cycleKey]` |
| `onChangeCycle(startDay)` | `SettingsTab` → `changeCycle` | `cycle.value = { startDay }` |

Note the naming: the pans emit `setPermanent` / `setTemporary` / `clearTemporary`,
but `SettingsTab` re-emits them renamed with a `setBudget` prefix, and `app.vue`
listens for the **renamed** events. When tracing an event, check both hops.

`onSave` and `onSaveAccount` mutate the object in place. Because `transactions`
and `accounts` hold the same object references, the list re-renders without
replacing the array.

`onSetBudgetPermanent` deletes the current cycle's override. A standing budget
change supersedes a one-off set earlier in the same cycle.

`onChangeCycle` applies **immediately**, even though `CyclePane` renders
`TAKES EFFECT ON THE NEXT CYCLE`. See known gap 5 in `AGENTS.md`.

## Component contracts

### `SwipeControl.vue` — the core primitive

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | required | Caption above the control |
| `leftLabel` | `string` | required | Revealed by a left-to-right swipe |
| `rightLabel` | `string` | required | Revealed by a right-to-left swipe |
| `leftClass` | `string` | `bg-green-100 text-green-800` | Badge classes |
| `rightClass` | `string` | `bg-red-100 text-red-800` | Badge classes |

Emits `left` and `right`. Default slot is the resting slide.

Direction mapping, which is the part that has been wrong before:

| User gesture | `swipeDirection` | Emitted |
|---|---|---|
| Left to right | `'prev'` | `left` |
| Right to left | `'next'` | `right` |

### `SwipeToTransact.vue`

Props: `accounts: Account[]`. Emits `pay` and `refund`, each with
`{ amount: number; account: string; category: string }`. Ignores a swipe when
the parsed amount is `0` or no account is selected. Clears the amount on success.

Builds `accountOptions` as `` `${type.toUpperCase()} - ${bankShortName} *${last4}` ``
via a `computed`. There is no `optgroup`; see `SelectPane.vue` above.

### `TransactionsTab.vue`

Props: `accounts`, `transactions`. Emits `pay`, `refund`, `select`.
Exports `TransactPayload` — the one type that lives in a component file, because
it is only consumed by `app.vue`'s handlers.

### `TransactionDetails.vue`

Props: `transaction` (a structural subset of `Transaction`), `accounts`.
Emits `close`, `save`, `delete`. `save` carries
`{ account, category, amount, date, notes }` — no `id`, no `isRefund`. A refund
stays a refund; the modal cannot flip direction.

### `AccountDetails.vue`

Props: `account?: Account` — omitted means create. Emits `close`, `save`,
`delete`. `save` carries `Omit<Account, 'id'>`.

### `ProgressBar.vue`

Props: `percent?`, `value?`, `total?`, `threshold` (default `20`), `label?`,
`fullWidth` (default `false`). `percent` wins over `value`/`total`. Label
precedence: explicit `label` → `"60%"` in percent mode → `"40/80"` in
value/total mode. Below `threshold` the track turns `bg-red-200` and the fill
`bg-red-600`.

### `SelectPane.vue`

Props: `label`, `options: string[]`, `selected: string`. Emits `select` with the
chosen string. A native `<select>` with `appearance-none`.

Only flat options. There is no `groups` prop and no `<optgroup>` — the popup is
OS-drawn and cannot be styled, so grouping is folded into the option text
instead. Values are the full display label, e.g. `DEBIT - BDO *3000`.

### Settings components

All three are rendered by `SettingsTab.vue` inside `AccordionSection`s and are
otherwise independent.

| Component | Props | Emits |
|---|---|---|
| `AccordionSection.vue` | `title`, `defaultOpen` (default `false`) | none — slot for content |
| `LoginPane.vue` | none | `login`, `signUp`, each `{ email, password }` |
| `AccountPane.vue` | `user: { email, createdAt }` | `logout` |
| `BudgetsPane.vue` | `budget`, `cycleKey: string`, `cycleLabel: string` | `setPermanent`, `setTemporary`, `clearTemporary` |
| `CyclePane.vue` | `cycle: Cycle`, `currentStart: string`, `nextStart: string` | `change` with the new start day |

`AccordionSection` owns its own open/closed state. `LoginPane` holds email and
password as local refs and does not validate — there is no backend.

`CyclePane` takes the cycle boundaries as **ISO strings**, not `Date` objects,
and formats them for display. `BudgetsPane` takes `cycleKey` separately from
`cycleLabel`: the key indexes `overrides`, the label is what renders.

### `MarkdownEditor.vue`

`v-model` on a string. Prop `label` (default `'NOTES'`). Defaults to the
PREVIEW tab. Supports headings, bold, italic, inline code, links, and lists.
Input is HTML-escaped before rendering.

## Formatting

`app/format.ts`:

- `formatAmountInput(raw)` — strips non-numeric characters, keeps the first
  decimal point, groups thousands, truncates to two decimals. Returns `''` for
  input with no digits, so a cleared field stays cleared.
- `parseAmount(formatted)` — strips commas, returns a number, `0` on failure.

Amount fields hold **strings**, not numbers, so they can be cleared mid-type.
They are parsed on save or on swipe.

## Seed data

`app.vue` ships two transactions (one payment, one refund, both `100.00`), two
accounts (BDO debit, BPI credit with a `50000` limit), a budget of `10000`, a
cycle start day of `15`, and no logged-in user. Starting balance is therefore
`10000 - 100 + 100 = 10000`.

Seeded transactions store the pre-grouping label format (`BDO *3000`, no type
prefix). Opening one in `TransactionDetails` therefore shows a blank account
select until a new option is chosen. This is known gap 7 in `AGENTS.md`, not a
regression.
