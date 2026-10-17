import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { STORAGE_KEYS } from '../utils/storage'
import { InstallPrompt } from './InstallPrompt'

function dispatchInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted', prompt = vi.fn()) {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return { event, prompt }
}

describe('InstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(cleanup)

  it('explains the install value and invokes the browser install prompt', async () => {
    render(<InstallPrompt />)
    const { event, prompt } = dispatchInstallPrompt()

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('region', { name: 'Install Stellar Oracle' })).toHaveTextContent(
      'Keep live oracle prices one tap away',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Install' }))
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce())
    expect(screen.queryByRole('region', { name: 'Install Stellar Oracle' })).not.toBeInTheDocument()
  })

  it('persists dismissal and suppresses the prompt on the next visit', () => {
    const firstVisit = render(<InstallPrompt />)
    dispatchInstallPrompt()
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))

    expect(localStorage.getItem(STORAGE_KEYS.pwaInstallDismissed)).not.toBeNull()
    expect(screen.queryByRole('region', { name: 'Install Stellar Oracle' })).not.toBeInTheDocument()

    firstVisit.unmount()
    render(<InstallPrompt />)
    dispatchInstallPrompt()

    expect(screen.queryByRole('region', { name: 'Install Stellar Oracle' })).not.toBeInTheDocument()
  })

  it('reports browser prompt failures instead of silently hiding them', async () => {
    render(<InstallPrompt />)
    dispatchInstallPrompt('accepted', vi.fn().mockRejectedValue(new Error('prompt blocked')))

    fireEvent.click(screen.getByRole('button', { name: 'Install' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The install prompt could not be opened')
  })
})
