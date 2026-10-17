import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useIsRtl } from '../hooks/useIsRtl'
import i18n from './index'

const SRC_ROOT = join(process.cwd(), 'src')
const PHYSICAL_DIRECTIONAL_CLASS =
  /(?:^|\s)-?(?:left|right)-(?:\d|full|auto|\[)|(?:^|\s)(?:ml|mr|pl|pr)-(?:\d|auto|\[)|(?:^|\s)text-(?:left|right)(?:\s|$)|(?:^|\s)border-[lr](?:-\d+)?(?=\s|$)|(?:^|\s)rounded-[lr]-(?:none|sm|md|lg|xl|[23]xl|full|\[)/

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:tsx|css)$/.test(entry.name) ? [path] : []
  })
}

describe('RTL layout safeguards', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('uses logical positioning classes throughout React screens', () => {
    const violations = sourceFiles(SRC_ROOT).flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      return PHYSICAL_DIRECTIONAL_CLASS.test(content) ? [file] : []
    })
    expect(violations).toEqual([])
  })

  it('keeps global layout positioning on logical CSS properties', () => {
    const css = readFileSync(join(SRC_ROOT, 'index.css'), 'utf8')
    expect(css).not.toMatch(/^\s*(?:left|right|margin-left|margin-right|padding-left|padding-right):/m)
  })

  it('reacts to locale direction changes', async () => {
    const { result } = renderHook(() => useIsRtl())
    expect(result.current).toBe(false)

    await act(async () => {
      await i18n.changeLanguage('ar')
    })
    expect(result.current).toBe(true)

    await act(async () => {
      await i18n.changeLanguage('he')
    })
    expect(result.current).toBe(true)
  })
})
