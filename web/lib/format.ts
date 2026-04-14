/**
 * Consistent date formatting across the app.
 * Always use these instead of calling toLocaleDateString() directly.
 */

/** Jan 5, 2026 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Jan 5 (no year) */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Jan 5 – Feb 10, 2026 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  return `${formatDateShort(start)} \u2013 ${formatDate(end)}`
}
