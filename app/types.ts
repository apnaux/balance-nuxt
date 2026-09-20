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
