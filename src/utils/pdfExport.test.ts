import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getChartPalette } from './chartTheme'
import { exportPriceHistoryPdf } from './pdfExport'

const pdf = vi.hoisted(() => ({
  internal: {
    pageSize: { getWidth: () => 297, getHeight: () => 210 },
  },
  setProperties: vi.fn(),
  setFillColor: vi.fn(),
  rect: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  setFont: vi.fn(),
  setDrawColor: vi.fn(),
  line: vi.fn(),
  addPage: vi.fn(),
  addImage: vi.fn(),
  getNumberOfPages: vi.fn(() => 1),
  setPage: vi.fn(),
  save: vi.fn(),
}))

vi.mock('jspdf', () => ({ jsPDF: vi.fn(function MockJsPdf() { return pdf }) }))

describe('exportPriceHistoryPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pdf.getNumberOfPages.mockReturnValue(1)
  })

  it('uses the active theme palette for printable table contrast and page background', () => {
    const palette = getChartPalette('dark')
    exportPriceHistoryPdf({
      pair: 'BTC/USD',
      history: [],
      chart: null,
      filename: 'history.pdf',
      palette,
    })

    expect(pdf.setFillColor).toHaveBeenCalledWith(17, 24, 39)
    expect(pdf.setTextColor).toHaveBeenCalledWith(249, 250, 251)
    expect(pdf.setTextColor).toHaveBeenCalledWith(209, 213, 219)
    expect(pdf.save).toHaveBeenCalledWith('history.pdf')
  })

  it('uses the high-contrast page palette when requested', () => {
    const palette = getChartPalette('high-contrast')
    exportPriceHistoryPdf({
      pair: 'XLM/USD',
      history: [],
      chart: null,
      filename: 'history.pdf',
      palette,
    })

    expect(pdf.setFillColor).toHaveBeenCalledWith(0, 0, 0)
    expect(pdf.setTextColor).toHaveBeenCalledWith(255, 255, 255)
  })
})
