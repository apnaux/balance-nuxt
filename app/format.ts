/**
 * Formats a numeric string for display in a currency input: thousands
 * separators, at most two decimals, and no trailing separator while the user
 * is mid-type.
 *
 * Returns an empty string for input that has no digits, so a cleared field
 * stays cleared instead of collapsing to "0".
 */
export function formatAmountInput(raw: string): string {
  // Drop everything that isn't a digit or a decimal point. This also strips
  // the separators we added on the previous keystroke.
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (cleaned === '') return ''

  // Keep only the first decimal point; later ones are typos.
  const [whole = '', ...rest] = cleaned.split('.')
  const decimals = rest.join('')

  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // No decimal point typed yet, or the user just typed one.
  if (rest.length === 0) return grouped

  return `${grouped}.${decimals.slice(0, 2)}`
}

/** Parses a formatted amount string back into a number. */
export function parseAmount(formatted: string): number {
  return Number(formatted.replace(/,/g, '')) || 0
}
