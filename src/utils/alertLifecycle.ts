/** Converts a local calendar date into an epoch timestamp at the requested day boundary. */
export function localDateToTimestamp(value: string, endOfDay = false): number | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date.getTime()
}

/** Formats an epoch timestamp as a local calendar date suitable for `<input type="date">`. */
export function timestampToLocalDate(timestamp: number | null | undefined): string {
  if (timestamp === null || timestamp === undefined || !Number.isFinite(timestamp)) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isAlertExpired(expiresAt: number | null | undefined, now: number): boolean {
  return expiresAt !== null && expiresAt !== undefined && expiresAt <= now
}
