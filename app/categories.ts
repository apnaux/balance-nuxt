/**
 * Transaction categories.
 *
 * Shared by `SwipeToTransact` and `TransactionDetails` so the two pickers can
 * never drift apart. Lives in a plain module because `<script setup>` cannot
 * contain `export`.
 */
export const CATEGORIES = [
  'GROCERIES',
  'TRANSPORT',
  'UTILITIES',
  'DINING',
  'SUBSCRIPTION',
  'SHOPPING',
  'GAMES',
  'FEES',
  'OTHERS',
]
