/**
 * Service worker registration for production builds.
 *
 * Dev relies on Vite's server and MSW's separate mock worker, so a caching
 * service worker would only get in the way there.
 */

const SW_URL = `${import.meta.env.BASE_URL}sw.js?v=${encodeURIComponent(__APP_BUILD_ID__)}`
const UPDATE_TIMEOUT_MS = 15_000

export interface ServiceWorkerCallbacks {
  onUpdateAvailable: (registration: ServiceWorkerRegistration) => void
  onOfflineReady: () => void
  onError: (error: Error) => void
}

let reloadRequested = false

function reloadForActivatedWorker(): void {
  if (reloadRequested) return
  reloadRequested = true
  window.location.reload()
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Registers the current build's worker and reports offline readiness, updates,
 * and failures to the app shell. Returns cleanup for all listeners.
 */
export function registerServiceWorker(callbacks: ServiceWorkerCallbacks): () => void {
  if (!import.meta.env.PROD) return () => {}
  if (!('serviceWorker' in navigator)) {
    callbacks.onError(new Error('Service workers are not supported'))
    return () => {}
  }

  let disposed = false
  let registration: ServiceWorkerRegistration | undefined
  let wasControlled = Boolean(navigator.serviceWorker.controller)
  const workerListeners: Array<{ worker: ServiceWorker; listener: EventListener }> = []
  const observedWorkers = new WeakSet<ServiceWorker>()

  const reportError = (error: unknown): void => {
    if (!disposed) callbacks.onError(normalizeError(error))
  }

  const onMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'UPDATE_ACTIVATED') {
      reloadForActivatedWorker()
    }
  }

  const onControllerChange = (): void => {
    if (wasControlled) {
      reloadForActivatedWorker()
    }
    wasControlled = Boolean(navigator.serviceWorker.controller)
  }

  const observeInstallingWorker = (): void => {
    const installing = registration?.installing
    const currentRegistration = registration
    if (!installing || !currentRegistration || observedWorkers.has(installing)) return
    observedWorkers.add(installing)

    const listener: EventListener = () => {
      if (disposed) return
      if (installing.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          callbacks.onUpdateAvailable(currentRegistration)
        } else {
          callbacks.onOfflineReady()
        }
      } else if (installing.state === 'redundant') {
        reportError(new Error('The service worker could not be installed'))
      }
    }

    installing.addEventListener('statechange', listener)
    workerListeners.push({ worker: installing, listener })
  }

  const onUpdateFound = (): void => observeInstallingWorker()
  const register = (): void => {
    navigator.serviceWorker
      .register(SW_URL, { scope: import.meta.env.BASE_URL })
      .then((value) => {
        if (disposed) return
        registration = value
        registration.addEventListener('updatefound', onUpdateFound)

        if (registration.waiting) {
          if (navigator.serviceWorker.controller) {
            callbacks.onUpdateAvailable(registration)
          } else {
            callbacks.onOfflineReady()
          }
        }
        observeInstallingWorker()
      })
      .catch(reportError)
  }

  navigator.serviceWorker.addEventListener('message', onMessage)
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }

  return () => {
    disposed = true
    window.removeEventListener('load', register)
    navigator.serviceWorker.removeEventListener('message', onMessage)
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    registration?.removeEventListener('updatefound', onUpdateFound)
    workerListeners.forEach(({ worker, listener }) => worker.removeEventListener('statechange', listener))
  }
}

/**
 * Activates the waiting worker and resolves when this tab is controlled by it.
 * Every open tab is reloaded by the worker's UPDATE_ACTIVATED broadcast.
 */
export function applyServiceWorkerUpdate(registration: ServiceWorkerRegistration): Promise<void> {
  const waiting = registration.waiting
  if (!waiting) return Promise.reject(new Error('No service worker update is waiting'))

  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
    const onControllerChange = (): void => {
      cleanup()
      resolve()
      reloadForActivatedWorker()
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('The new service worker did not take control in time'))
    }, UPDATE_TIMEOUT_MS)

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true })
    try {
      waiting.postMessage({ type: 'SKIP_WAITING' })
    } catch (error) {
      cleanup()
      reject(normalizeError(error))
    }
  })
}
