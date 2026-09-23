export type Transaction = {
  id: number
  /** Foreign key to `Account.id`. A stored id may point at a deleted account. */
  accountId: number
  amount: number
  date: string
  isRefund: boolean
  category?: string
  notes?: string
  /**
   * Foreign key to `RecurringTransaction.id` when this entry was produced by a
   * recurring item. Absent for a transaction the user entered directly.
   */
  recurringId?: number
}

export type AccountType = 'credit' | 'debit'

/** Payload emitted by `SwipeToTransact` when a swipe completes. */
export type TransactPayload = {
  amount: number
  accountId: number
  category: string
}

export type User = {
  email: string
  /** ISO timestamp of when the account was created. */
  createdAt: string
}

export type Cycle = {
  /** Day of the month a cycle starts on, 1-31. */
  startDay: number
}

/**
 * A single spending budget for a cycle. Deliberately not per category: the
 * budget tracks the remaining balance, so one number covers the whole cycle.
 */
export type Budget = {
  /** The standing limit, used by every cycle that has no override. */
  amount: number
  /**
   * One-off limit for a single cycle, keyed by that cycle's start date as
   * `YYYY-MM-DD`. Cleared once the cycle ends.
   */
  overrides?: Record<string, number>
}

export type Account = {
  id: number
  /** Bank or provider name, e.g. "Banco de Oro". */
  bankName: string
  /** Short label used in lists, e.g. "BDO". */
  bankShortName: string
  /** Last four digits of the account number. */
  last4: string
  type: AccountType
  /** Credit only: day of month the statement is cut. */
  statementDay?: number
  /** Credit only: days after the statement date that payment is due. */
  paymentDueDays?: number
  /** Credit only: total credit line. */
  creditLimit?: number
}

export type Recurrence = 'monthly' | 'yearly'

/**
 * How a recurring item is settled.
 *
 * - `default`     pay it by hand when it comes due.
 * - `auto`        deducted at the start of every cycle, with no manual option.
 * - `approximate` pay it by hand, but the exact amount is asked for each time.
 *
 * `auto` and `approximate` are mutually exclusive by construction. An item
 * cannot both deduct itself and need an amount typed before it can deduct.
 */
export type RecurrenceType = 'default' | 'auto' | 'approximate'

export type RecurringTransaction = {
  id: number
  /** What the charge is for, e.g. "Netflix", "Meralco", "Car Loan". */
  name: string
  /** Foreign key to `Account.id`. */
  accountId: number
  category: string
  /** The exact amount, or the approximation for an `approximate` item. */
  amount: number
  type: RecurrenceType
  recurrence: Recurrence
  /**
   * Expected day of the month, 1-31. Display metadata only: it does not gate
   * `auto` deductions, which fire at cycle start. Clamped to the last day of
   * shorter months when rendered.
   */
  dueDay: number
  /** Yearly only: expected month, 1-12. */
  dueMonth?: number
  /** Paused items stay in the list but are skipped by every lookup. */
  active: boolean
}
