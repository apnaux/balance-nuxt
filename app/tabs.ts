export const TABS = [
  { value: 'transactions', icon: 'lucide:list' },
  { value: 'accounts', icon: 'lucide:wallet' },
  { value: 'settings', icon: 'lucide:settings' },
] as const

export type Tab = (typeof TABS)[number]['value']

/** Tab values in display order, so swipe navigation knows the neighbours. */
export const TAB_ORDER: Tab[] = TABS.map(tab => tab.value)
