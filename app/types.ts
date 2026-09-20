export type Transaction = {
  id: number
  account: string
  amount: number
  date: string
  isRefund: boolean
  category?: string
  notes?: string
}
