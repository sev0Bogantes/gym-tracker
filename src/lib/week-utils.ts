/**
 * Calculates the current week number of a routine
 * Week 1 = days 0-6, Week 2 = days 7-13, etc.
 */
export function calculateCurrentWeek(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  // Normalize both to UTC midnight to avoid timezone drift
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.floor((todayUTC - startUTC) / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

/**
 * Returns "Week X of Y" progress string
 */
export function getWeekLabel(startDate: string, totalWeeks: number): string {
  const week = calculateCurrentWeek(startDate)
  return `Week ${week} of ${totalWeeks}`
}

/**
 * Returns a decimal progress value 0-1 for a progress bar
 */
export function getProgressPercent(startDate: string, totalWeeks: number): number {
  const week = calculateCurrentWeek(startDate)
  return Math.min(week / totalWeeks, 1)
}

/**
 * Format a date to a readable string e.g. "Mon, May 13"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
