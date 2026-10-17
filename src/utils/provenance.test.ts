import { describe, expect, it } from 'vitest'
import { isSecureProvenanceUrl } from './provenance'

describe('isSecureProvenanceUrl', () => {
  it('accepts credential-free HTTPS URLs', () => {
    expect(isSecureProvenanceUrl('https://oracle.example/source-ticks/42')).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'http://oracle.example/source-ticks/42',
    'https://user:secret@oracle.example/source-ticks/42',
    'not a URL',
  ])('rejects unsafe or malformed URLs: %s', (url) => {
    expect(isSecureProvenanceUrl(url)).toBe(false)
  })
})
