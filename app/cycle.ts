/**
 * Cycle date helpers.
 *
 * A cycle starts on a fixed day of the month and runs until the same day of the
 * following month. Days past the end of a short month clamp to its last day, so
 * a start day of 31 still produces a valid February boundary.
 */

/** Number of days in the given month. `month` is 0-based. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * The cycle boundary on or before `date`, as a local-time Date.
 *
 * If `date` is on or after the start day this month, the boundary is this
 * month; otherwise it is last month.
 */
export function cycleStartOnOrBefore(date: Date, startDay: number): Date {
  const year = date.getFullYear()
  const month = date.getMonth()

  const thisMonth = Math.min(startDay, daysInMonth(year, month))
  if (date.getDate() >= thisMonth) {
    return new Date(year, month, thisMonth)
  }

  const prevMonth = month - 1
  const prevYear = prevMonth < 0 ? year - 1 : year
  const normalizedPrev = (prevMonth + 12) % 12
  return new Date(prevYear, normalizedPrev, Math.min(startDay, daysInMonth(prevYear, normalizedPrev)))
}

/** The cycle boundary strictly after `date`. */
export function cycleStartAfter(date: Date, startDay: number): Date {
  const start = cycleStartOnOrBefore(date, startDay)
  const year = start.getFullYear()
  const month = start.getMonth() + 1

  const nextYear = month > 11 ? year + 1 : year
  const nextMonth = month % 12
  return new Date(nextYear, nextMonth, Math.min(startDay, daysInMonth(nextYear, nextMonth)))
}

/** Formats a Date as `MM-DD-YYYY`, the format used throughout the settings tab. */
export function formatCycleDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}-${date.getFullYear()}`
}
