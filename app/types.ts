export type Transaction = {
  id: number
  account: string
  amount: number
  date: string
  isRefund: boolean
  category?: string
  notes?: string
}

export type AccountType = 'credit' | 'debit'

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
