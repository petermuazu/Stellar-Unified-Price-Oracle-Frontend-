export type ChartTheme = 'light' | 'dark' | 'high-contrast'

export interface ChartPalette {
  background: string
  foreground: string
  muted: string
  grid: string
  border: string
  tooltipBackground: string
  tooltipForeground: string
  tooltipMuted: string
  series: { color: string; dash: string }[]
}

/** Shared chart/PDF design tokens. Keep each palette's text and graphics AA-visible. */
export const CHART_THEME_TOKENS: Record<ChartTheme, ChartPalette> = {
  light: {
    background: '#ffffff',
    foreground: '#111827',
    muted: '#4b5563',
    grid: '#6b7280',
    border: '#6b7280',
    tooltipBackground: '#ffffff',
    tooltipForeground: '#111827',
    tooltipMuted: '#4b5563',
    series: [
      { color: '#1d4ed8', dash: '0' },
      { color: '#b45309', dash: '6 3' },
      { color: '#6d28d9', dash: '2 2' },
      { color: '#047857', dash: '8 2 2 2' },
      { color: '#b91c1c', dash: '1 3' },
      { color: '#4338ca', dash: '10 3' },
    ],
  },
  dark: {
    background: '#111827',
    foreground: '#f9fafb',
    muted: '#d1d5db',
    grid: '#6b7280',
    border: '#6b7280',
    tooltipBackground: '#111827',
    tooltipForeground: '#f9fafb',
    tooltipMuted: '#d1d5db',
    series: [
      { color: '#67e8f9', dash: '0' },
      { color: '#fbbf24', dash: '6 3' },
      { color: '#c4b5fd', dash: '2 2' },
      { color: '#6ee7b7', dash: '8 2 2 2' },
      { color: '#fca5a5', dash: '1 3' },
      { color: '#93c5fd', dash: '10 3' },
    ],
  },
  'high-contrast': {
    background: '#000000',
    foreground: '#ffffff',
    muted: '#ffffff',
    grid: '#ffffff',
    border: '#ffffff',
    tooltipBackground: '#000000',
    tooltipForeground: '#ffffff',
    tooltipMuted: '#ffffff',
    series: [
      { color: '#00ffff', dash: '0' },
      { color: '#ffff00', dash: '6 3' },
      { color: '#ff00ff', dash: '2 2' },
      { color: '#00ff00', dash: '8 2 2 2' },
      { color: '#ff8000', dash: '1 3' },
      { color: '#ffffff', dash: '10 3' },
    ],
  },
}

export function getChartPalette(theme: ChartTheme): ChartPalette {
  return CHART_THEME_TOKENS[theme]
}

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    const rgb = hex.slice(1).match(/.{2}/g)
    if (!rgb || rgb.length !== 3) throw new Error(`Invalid chart token color: ${hex}`)
    const channels = rgb.map((channel) => {
      const value = parseInt(channel, 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }

  const high = Math.max(luminance(foreground), luminance(background))
  const low = Math.min(luminance(foreground), luminance(background))
  return (high + 0.05) / (low + 0.05)
}

export function getChartTheme(): ChartTheme {
  const root = document.documentElement
  const highContrast =
    root.classList.contains('high-contrast') ||
    root.classList.contains('hc-mode') ||
    window.matchMedia('(forced-colors: active)').matches ||
    window.matchMedia('(prefers-contrast: more)').matches
  if (highContrast) return 'high-contrast'
  return root.classList.contains('dark') ? 'dark' : 'light'
}
