import { test, expect, type Page } from '@playwright/test'

function dispatchInstallPrompt(page: Page): Promise<void> {
  return page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    window.dispatchEvent(event)
  })
}

test.describe('PWA install and update lifecycle', () => {
  test('install prompt explains the benefit and remembers dismissal', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await dispatchInstallPrompt(page)

    const installPrompt = page.getByRole('region', { name: 'Install Stellar Oracle' })
    await expect(installPrompt).toContainText('Keep live oracle prices one tap away')
    await installPrompt.getByRole('button', { name: 'Not now' }).click()
    await expect(installPrompt).toBeHidden()

    await page.reload()
    await page.waitForLoadState('networkidle')
    await dispatchInstallPrompt(page)
    await expect(page.getByRole('region', { name: 'Install Stellar Oracle' })).toHaveCount(0)
  })

  test('activates a waiting worker and reloads every stale tab before chunks can mix', async ({
    context,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Service worker lifecycle is verified in Chromium')

    await context.addInitScript(() => {
      const key = 'pwa-test-navigation-count'
      const count = Number(sessionStorage.getItem(key) ?? '0')
      sessionStorage.setItem(key, String(count + 1))
    })
    const tabs = [await context.newPage(), await context.newPage()]
    for (const tab of tabs) {
      await tab.goto('/dashboard')
      await expect(tab.getByRole('heading', { name: 'Price Oracle Dashboard' })).toBeVisible()
      await expect
        .poll(() => tab.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active)), {
          timeout: 15_000,
        })
        .toBe(true)
      await tab.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    }

    const reloads = tabs.map((tab) =>
      tab.waitForEvent('framenavigated', {
        predicate: (frame) => frame === tab.mainFrame(),
      }),
    )

    await tabs[0].evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js?v=pwa-e2e-next', { scope: '/' })
    })
    await expect
      .poll(() => tabs[0].evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting)), {
        timeout: 15_000,
      })
      .toBe(true)
    await tabs[0]
      .getByRole('region', { name: 'Update available' })
      .getByRole('button', { name: 'Reload to update' })
      .click()

    await Promise.all(reloads)
    for (const tab of tabs) {
      await tab.waitForLoadState('load')
      await expect.poll(() => tab.evaluate(() => Number(sessionStorage.getItem('pwa-test-navigation-count')))).toBe(2)
      await expect(tab).toHaveURL(/\/dashboard$/)
      await expect(tab.getByRole('main')).toBeVisible()
    }
  })
})
