import type { Cycle, Recurrence, RecurringTransaction } from './types'

/** Days in a month, 1-based month. `Date` rolls day 0 back to the last of the previous month. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * The next occurrence on or after `from`.
 *
 * For `monthly`, the day is clamped to the last day of the target month, so a
 * `dueDay` of 31 in February resolves to the 28th (or 29th). The day is read
 * back from the resolved date rather than from `dueDay`, so a short month does
 * not drag the schedule backwards permanently.
 *
 * For `yearly`, only `dueMonth`/`dueDay` matter; the year advances if the
 * occurrence has already passed this year.
 */
export function nextDueDate(item: RecurringTransaction, from: Date): Date {
  if (item.recurrence === 'yearly') {
    const month = clamp(item.dueMonth ?? 1, 1, 12)
    return resolveForward(from, month, item.dueDay, 'year')
  }

  return resolveForward(from, from.getMonth() + 1, item.dueDay, 'month')
}

/**
 * Walk forward month by month (or year by year) until a date lands on or after
 * `from`. Bounded so a nonsense input cannot spin.
 */
function resolveForward(
  from: Date,
  startMonth: number,
  dueDay: number,
  step: 'month' | 'year',
): Date {
  const maxSteps = step === 'month' ? 24 : 4

  for (let stepCount = 0; stepCount <= maxSteps; stepCount++) {
    const rawMonth = startMonth + (step === 'month' ? stepCount : 0)
    const year = from.getFullYear() + (step === 'year' ? stepCount : 0) + Math.floor((rawMonth - 1) / 12)
    const month = ((rawMonth - 1) % 12) + 1
    const day = Math.min(dueDay, daysInMonth(year, month))
    const candidate = new Date(year, month - 1, day)

    if (candidate.getTime() >= startOfDay(from).getTime()) return candidate
  }

  // Unreachable for sane input; a `dueDay` of 0 or 40 lands here.
  return startOfDay(from)
}

/** Whether an occurrence falls inside `[start, end)`. */
export function isDueInCycle(item: RecurringTransaction, start: Date, end: Date): boolean {
  const due = nextDueDate(item, start)
  return due.getTime() < end.getTime()
}

/**
 * Cycle boundaries that contain `date`, given a cycle start day. Mirrors the
 * rules in `cycle.ts` but is self-contained so the date maths here can be read
 * without following an import.
 */
export function cycleBounds(date: Date, cycle: Cycle): { start: Date; end: Date } {
  const day = clamp(cycle.startDay, 1, 28)
  const start = startOfDay(date)

  if (start.getDate() < day) {
    start.setMonth(start.getMonth() - 1)
  }
  start.setDate(day)

  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  return { start, end }
}

/** Human-readable recurrence, e.g. `MONTHLY ON THE 15TH`. */
export function recurrenceLabel(item: RecurringTransaction): string {
  const day = ordinal(item.dueDay)

  if (item.recurrence === 'yearly') {
    const month = MONTHS[(item.dueMonth ?? 1) - 1] ?? ''
    return `YEARLY ON ${month} ${day}`
  }

  return `MONTHLY ON THE ${day}`
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

const ORDINALS = ['TH', 'ST', 'ND', 'RD']

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13
    ? 'TH'
    : ORDINALS[n % 10] ?? 'TH'
  return `${n}${suffix}`
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export type { Recurrence }