import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../../src/preferences/PreferencesContext'
import { PriceChart } from '../../src/components/PriceChart'
import type { PriceHistoryEntry } from '../../src/types'
import '../../src/index.css'

const fixedNow = Date.parse('2025-01-01T12:00:00.000Z')
Date.now = () => fixedNow

const theme = new URLSearchParams(window.location.search).get('theme') ?? 'light'
document.documentElement.classList.toggle('dark', theme === 'dark')
document.documentElement.classList.toggle('high-contrast', theme === 'high-contrast')

const data: PriceHistoryEntry[] = Array.from({ length: 24 }, (_, index) => ({
  price: 65_000 + Math.sin(index / 3) * 300 + index * 14,
  timestamp: fixedNow - (24 - index) * 60_000,
  confidence: 0.95,
  sources: index % 3 === 0 ? ['chainlink', 'band'] : ['chainlink', 'redstone'],
}))

const overlayData: PriceHistoryEntry[] = data.map((entry, index) => ({
  ...entry,
  price: entry.price * 1.002 + Math.cos(index / 4) * 35,
}))

const root = document.getElementById('root')
if (!root) throw new Error('Price chart visual test root is missing.')

createRoot(root).render(
  <MemoryRouter>
    <PreferencesProvider>
      <main className="min-h-screen bg-white p-6 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <PriceChart data={data} pair="BTC/USD" overlayPairs={[{ pair: 'ETH/USD', data: overlayData }]} />
        </div>
      </main>
    </PreferencesProvider>
  </MemoryRouter>,
)
