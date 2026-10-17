import { describe, expect, it } from 'vitest'
import { isAlertExpired, localDateToTimestamp, timestampToLocalDate } from './alertLifecycle'

describe('alert lifecycle dates', () => {
  it('uses local day boundaries for expiry and review dates', () => {
    const start = localDateToTimestamp('2030-04-05')
    const end = localDateToTimestamp('2030-04-05', true)

    expect(start).not.toBeNull()
    expect(end).not.toBeNull()
    expect(new Date(start!).getHours()).toBe(0)
    expect(new Date(end!).getHours()).toBe(23)
    expect(timestampToLocalDate(start)).toBe('2030-04-05')
    expect(timestampToLocalDate(end)).toBe('2030-04-05')
  })

  it('rejects malformed and impossible dates', () => {
    expect(localDateToTimestamp('')).toBeNull()
    expect(localDateToTimestamp('2030-02-30')).toBeNull()
    expect(localDateToTimestamp('invalid')).toBeNull()
  })

  it('treats expiry as inclusive and leaves an unset date unexpired', () => {
    expect(isAlertExpired(null, 100)).toBe(false)
    expect(isAlertExpired(100, 99)).toBe(false)
    expect(isAlertExpired(100, 100)).toBe(true)
  })
})
