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
  account: string      // display label, e.g. "BDO *3000"
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
```

### Invariants

1. **`amount` is never negative.** A refund is `isRefund: true` with a positive
   `amount`. Nothing in the codebase branches on a negative amount.
2. **`account` is a denormalized display string, not a foreign key.** It is
   built as `` `${bankShortName} *${last4}` `` and stored on the transaction.
   Renaming an account does not update existing transactions. This is a known
   gap, not an oversight.
3. **Credit-only fields are `undefined` on debit accounts.** `AccountDetails`
   drops them on save rather than leaving stale values behind.
4. **`type` is immutable after creation.** The modal renders a read-only label
   when editing. Switching credit to debit would orphan the three credit fields.
5. **`id` is unique within its collection.** New ids come from
   `Math.max(0, ...items.map(i => i.id)) + 1`.

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

`BALANCE_LIMIT` is a module constant of `10000`.

### Derived values

```ts
const balance = computed(() =>
  transactions.value.reduce(
    (sum, t) => (t.isRefund ? sum + t.amount : sum - t.amount),
    BALANCE_LIMIT,
  ),
)
```

Balance is **derived, never stored**. Editing or deleting a transaction updates
the bar with no extra wiring. Refunds add, payments subtract.

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

`onSave` and `onSaveAccount` mutate the object in place. Because `transactions`
and `accounts` hold the same object references, the list re-renders without
replacing the array.

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

`app.vue` ships two transactions (one payment, one refund, both `100.00` on
`BDO *3000`) and two accounts (BDO debit, BPI credit with a `50000` limit).
Starting balance is therefore `10000 - 100 + 100 = 10000`.
