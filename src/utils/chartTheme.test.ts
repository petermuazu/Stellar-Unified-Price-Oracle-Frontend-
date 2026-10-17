import { describe, expect, it } from 'vitest'
import { CHART_THEME_TOKENS, contrastRatio, type ChartTheme } from './chartTheme'

describe('chart theme tokens', () => {
  const themes: ChartTheme[] = ['light', 'dark', 'high-contrast']

  it.each(themes)('%s palette meets WCAG AA text and graphic contrast', (theme) => {
    const palette = CHART_THEME_TOKENS[theme]
    expect(contrastRatio(palette.foreground, palette.background)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(palette.muted, palette.background)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(palette.tooltipForeground, palette.tooltipBackground)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(palette.tooltipMuted, palette.tooltipBackground)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(palette.grid, palette.background)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(palette.border, palette.background)).toBeGreaterThanOrEqual(3)
    for (const series of palette.series) {
      expect(contrastRatio(series.color, palette.background)).toBeGreaterThanOrEqual(3)
    }
  })

  it('distinguishes each series with a unique dash pattern as well as color', () => {
    for (const theme of themes) {
      const patterns = CHART_THEME_TOKENS[theme].series.map(({ dash }) => dash)
      expect(new Set(patterns).size).toBe(patterns.length)
    }
  })
})
