import type { Account } from './types'

/**
 * Display label for an account. The type is folded into the text rather than
 * rendered as an `<optgroup>`: a native select's popup is drawn by the OS, so
 * headings there can't be styled to match the rest of the app.
 */
export function accountLabel(account: Account): string {
  const type = account.type === 'credit' ? 'CREDIT' : 'DEBIT'
  return `${type} - ${account.bankShortName} *${account.last4}`
}

/**
 * Label for an account id, or a placeholder when the id matches no account.
 * A transaction keeps its `accountId` even after the account is deleted, so
 * every read path has to tolerate a dangling reference.
 */
export function accountLabelById(accounts: Account[], id: number): string {
  const account = accounts.find(a => a.id === id)
  return account ? accountLabel(account) : 'UNKNOWN ACCOUNT'
}

/** Option labels and ids, positionally matched for `SelectPane`. */
export function accountOptions(accounts: Account[]): { labels: string[]; values: string[] } {
  return {
    labels: accounts.map(accountLabel),
    values: accounts.map(a => String(a.id)),
  }
}