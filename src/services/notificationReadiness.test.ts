import { describe, expect, it } from 'vitest'
import { EMPTY_BOT_SECRETS } from '../types'
import type { NotifConfig } from './notificationConfig'
import { areChannelsReady, checkNotificationReadiness } from './notificationReadiness'

const baseConfig: NotifConfig = {
  email: { address: '', enabled: false },
  webPush: { enabled: false },
  webhook: { url: '', enabled: false },
  telegram: { chatId: '', enabled: false },
  discord: { channelId: '', enabled: false },
}

describe('notification readiness', () => {
  it('treats in-app delivery as ready and keeps empty global routing safe', () => {
    const readiness = checkNotificationReadiness(baseConfig, EMPTY_BOT_SECRETS, [])
    expect(readiness).toEqual([{ channel: 'inApp', status: 'ready' }])
    expect(areChannelsReady(readiness)).toBe(true)
  })

  it('requires channel configuration and session-only bot credentials', () => {
    const config: NotifConfig = {
      ...baseConfig,
      telegram: { chatId: 'chat-1', enabled: true },
      discord: { channelId: 'channel-1', enabled: true },
    }
    const readiness = checkNotificationReadiness(config, EMPTY_BOT_SECRETS, ['telegram', 'discord'])
    expect(readiness).toEqual([
      { channel: 'inApp', status: 'ready' },
      { channel: 'telegram', status: 'missingSecret' },
      { channel: 'discord', status: 'missingSecret' },
    ])
    expect(areChannelsReady(readiness)).toBe(false)
  })

  it('blocks disabled or unconfigured explicitly selected channels', () => {
    const readiness = checkNotificationReadiness(baseConfig, EMPTY_BOT_SECRETS, ['email'])
    expect(readiness.find(({ channel }) => channel === 'email')?.status).toBe('disabled')
    expect(areChannelsReady(readiness)).toBe(false)
  })

  it('checks browser permission and unsupported push environments explicitly', () => {
    const config = { ...baseConfig, webPush: { enabled: true } }
    expect(
      checkNotificationReadiness(config, EMPTY_BOT_SECRETS, ['webPush'], {
        supported: true,
        permission: 'default',
      }).find(({ channel }) => channel === 'webPush')?.status,
    ).toBe('permissionRequired')
    expect(
      checkNotificationReadiness(config, EMPTY_BOT_SECRETS, ['webPush'], { supported: false, permission: null }).find(
        ({ channel }) => channel === 'webPush',
      )?.status,
    ).toBe('unsupported')
  })

  it('passes configured email and webhook channels without claiming remote health', () => {
    const config: NotifConfig = {
      ...baseConfig,
      email: { address: 'alerts@example.com', enabled: true },
      webhook: { url: 'https://example.com/hook', enabled: true },
    }
    expect(areChannelsReady(checkNotificationReadiness(config, EMPTY_BOT_SECRETS, []))).toBe(true)
  })
})
