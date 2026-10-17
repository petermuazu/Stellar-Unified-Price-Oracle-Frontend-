import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { readRaw, remove, STORAGE_KEYS, writeRaw } from '../utils/storage'

const DISMISSAL_CADENCE_MS = 30 * 24 * 60 * 60 * 1000

function readDismissedUntil(): number {
  const value = Number(readRaw(STORAGE_KEYS.pwaInstallDismissed))
  return Number.isFinite(value) && value > Date.now() ? value : 0
}

/** Fires before the browser shows its own install UI, letting us render ours instead. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Prompts the user to install the app as a PWA (#361). */
export const InstallPrompt = memo(function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissedUntil, setDismissedUntil] = useState(readDismissedUntil)
  const [installing, setInstalling] = useState(false)
  const [installError, setInstallError] = useState(false)

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function handleAppInstalled() {
      setDeferredPrompt(null)
      remove(STORAGE_KEYS.pwaInstallDismissed)
      setDismissedUntil(0)
      setInstallError(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (installError) {
    return (
      <div className="fixed bottom-4 start-4 z-50 max-w-sm" role="alert">
        <div className="rounded-xl border border-amber-700/50 bg-gray-900/95 px-4 py-3 text-sm text-amber-100 shadow-lg">
          <p>{t('pwa.installError')}</p>
          <button
            type="button"
            onClick={() => setInstallError(false)}
            className="mt-2 text-xs text-gray-300 underline underline-offset-2"
          >
            {t('pwa.dismissError')}
          </button>
        </div>
      </div>
    )
  }

  if (!deferredPrompt || dismissedUntil > Date.now()) return null

  function dismissPrompt() {
    const until = Date.now() + DISMISSAL_CADENCE_MS
    writeRaw(STORAGE_KEYS.pwaInstallDismissed, String(until))
    setDismissedUntil(until)
  }

  async function handleInstall() {
    if (!deferredPrompt || installing) return
    setInstalling(true)
    setInstallError(false)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (outcome === 'dismissed') {
        dismissPrompt()
      }
    } catch {
      setDeferredPrompt(null)
      setInstallError(true)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="fixed bottom-4 start-4 z-50" role="region" aria-label={t('pwa.installTitle')}>
      <div className="bg-gray-900/95 dark:bg-gray-900/95 border border-gray-700/50 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg shadow-black/30 flex items-center gap-3 max-w-sm">
        <svg
          className="w-5 h-5 text-gray-300 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-100">{t('pwa.installTitle')}</p>
          <p className="text-xs text-gray-400">{t('pwa.installDetail')}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            {installing ? t('pwa.installing') : t('pwa.installAction')}
          </button>
          <button
            type="button"
            onClick={dismissPrompt}
            className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {t('pwa.installDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
})
