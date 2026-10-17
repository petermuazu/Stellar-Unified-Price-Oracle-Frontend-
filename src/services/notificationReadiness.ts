import type { BotSecrets, NotificationChannelId } from '../types'
import { getEnabledChannels, type NotifConfig } from './notificationConfig'

export type ChannelReadinessStatus =
  | 'ready'
  | 'disabled'
  | 'missingConfiguration'
  | 'missingSecret'
  | 'permissionRequired'
  | 'permissionDenied'
  | 'unsupported'

export interface ChannelReadiness {
  channel: NotificationChannelId
  status: ChannelReadinessStatus
}

export interface PushCapability {
  supported: boolean
  permission: NotificationPermission | null
}

/** Reports local configuration readiness; it does not probe remote delivery endpoints. */
export function checkNotificationReadiness(
  config: NotifConfig,
  secrets: BotSecrets,
  selectedChannels: NotificationChannelId[],
  push: PushCapability = {
    supported: typeof Notification !== 'undefined',
    permission: typeof Notification === 'undefined' ? null : Notification.permission,
  },
): ChannelReadiness[] {
  const channels = new Set<NotificationChannelId>(
    selectedChannels.length > 0 ? ['inApp', ...selectedChannels] : ['inApp', ...getEnabledChannels(config)],
  )

  return [...channels].map((channel) => {
    let status: ChannelReadinessStatus
    switch (channel) {
      case 'inApp':
        status = 'ready'
        break
      case 'email':
        status = !config.email.enabled ? 'disabled' : config.email.address.trim() ? 'ready' : 'missingConfiguration'
        break
      case 'webhook':
        status = !config.webhook.enabled ? 'disabled' : config.webhook.url.trim() ? 'ready' : 'missingConfiguration'
        break
      case 'webPush':
        status = !config.webPush.enabled
          ? 'disabled'
          : !push.supported
            ? 'unsupported'
            : push.permission === 'granted'
              ? 'ready'
              : push.permission === 'denied'
                ? 'permissionDenied'
                : 'permissionRequired'
        break
      case 'telegram':
        status = !config.telegram.enabled
          ? 'disabled'
          : !config.telegram.chatId.trim()
            ? 'missingConfiguration'
            : !secrets.telegramBotToken.trim()
              ? 'missingSecret'
              : 'ready'
        break
      case 'discord':
        status = !config.discord.enabled
          ? 'disabled'
          : !config.discord.channelId.trim()
            ? 'missingConfiguration'
            : !secrets.discordWebhookUrl.trim()
              ? 'missingSecret'
              : 'ready'
        break
    }
    return { channel, status }
  })
}

export function areChannelsReady(readiness: ChannelReadiness[]): boolean {
  return readiness.every(({ status }) => status === 'ready')
}
