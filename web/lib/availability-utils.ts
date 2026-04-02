export interface MonthCol {
  month: number
  year: number
  label: string
}

export function getSeasonMonths(startDate: string, endDate: string): MonthCol[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months: MonthCol[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    months.push({
      month: cur.getMonth() + 1,
      year: cur.getFullYear(),
      label: cur.toLocaleString('default', { month: 'short' }),
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}
