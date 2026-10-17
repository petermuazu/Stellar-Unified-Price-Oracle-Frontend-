import { describe, expect, it } from 'vitest'
import { getEffectiveLocale, getLocaleFromLanguage, SUPPORTED_LOCALES } from './localeMapping'
import { SUPPORTED_LANGUAGES } from './index'

describe('Intl locale mapping', () => {
  it.each(SUPPORTED_LANGUAGES)('maps %s to an Intl-supported locale', (language) => {
    const locale = getLocaleFromLanguage(language)
    expect(Intl.NumberFormat.supportedLocalesOf([locale])).toEqual([locale])
    expect(Intl.DateTimeFormat.supportedLocalesOf([locale])).toEqual([locale])
    expect(getEffectiveLocale('auto', language)).toBe(locale)
  })

  it('offers the Hebrew locale as a user-selectable formatting override', () => {
    expect(SUPPORTED_LOCALES).toContain('he')
    expect(getEffectiveLocale('he', 'en')).toBe('he')
  })
})
