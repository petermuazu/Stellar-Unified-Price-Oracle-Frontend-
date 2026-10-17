import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { checkAccessibility } from '../test/accessibility'
import { recordSubscriptionUpdate } from '../realtime/subscriptionHealth'
import { SubscriptionHealthBadge } from './SubscriptionHealthBadge'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SubscriptionHealthBadge', () => {
  it('identifies a connected pair with no updates as waiting', () => {
    render(<SubscriptionHealthBadge pair="HEALTH-WAIT/USD" status="connected" />)
    expect(screen.getByText('Waiting for updates')).toBeInTheDocument()
    expect(screen.getByLabelText(/HEALTH-WAIT\/USD subscription health: Waiting for updates/)).toBeInTheDocument()
  })

  it('reports pair health as unavailable when realtime is disconnected', () => {
    render(<SubscriptionHealthBadge pair="HEALTH-OFF/USD" status="disconnected" />)
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('reports offline snapshot state instead of implying a live subscription', () => {
    render(<SubscriptionHealthBadge pair="HEALTH-CACHE/USD" status="disconnected" isOfflineSnapshot />)
    expect(screen.getByText('Offline snapshot')).toBeInTheDocument()
  })

  it('tracks a pair update and marks it stale after two minutes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    const pair = 'HEALTH-STALE/USD'
    recordSubscriptionUpdate(pair, Date.now())
    render(<SubscriptionHealthBadge pair={pair} status="connected" />)
    expect(screen.getByText('Live')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(120_000))
    expect(screen.getByText('Stale')).toBeInTheDocument()
    expect(screen.getByLabelText(/last update 2m ago/)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    await checkAccessibility(<SubscriptionHealthBadge pair="HEALTH-A11Y/USD" status="connected" />)
  })
})
