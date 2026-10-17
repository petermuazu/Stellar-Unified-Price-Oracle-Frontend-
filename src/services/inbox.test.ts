import { afterEach, describe, expect, it } from 'vitest'
import { readJson, STORAGE_KEYS } from '../utils/storage'
import {
  addInboxItem,
  clearInbox,
  getInboxItems,
  INBOX_MAX_ITEMS,
  INBOX_RETENTION_MS,
  markAllInboxItemsRead,
  markInboxItemRead,
  recordCommunityNotice,
  unreadInboxCount,
} from './inbox'

afterEach(() => {
  clearInbox()
})

describe('inbox service', () => {
  it('persists category, source, deep link, and unread state', () => {
    const item = addInboxItem({
      id: 'alert:one',
      category: 'alert',
      title: 'BTC threshold',
      message: 'BTC/USD moved',
      href: '/prices/BTC%2FUSD',
      source: 'Price alerts',
    })

    expect(readJson(STORAGE_KEYS.inbox, [])).toEqual([item])
    expect(unreadInboxCount()).toBe(1)

    markInboxItemRead(item.id, 42)
    expect(getInboxItems()[0].readAt).toBe(42)
    expect(readJson(STORAGE_KEYS.inbox, [])[0]).toMatchObject({ id: item.id, readAt: 42 })
    expect(unreadInboxCount()).toBe(0)
  })

  it('does not add an item with a duplicate id', () => {
    const first = addInboxItem({ id: 'same', category: 'system', title: 'Online', message: '', source: 'Network' })
    const second = addInboxItem({ id: 'same', category: 'system', title: 'Offline', message: '', source: 'Network' })

    expect(second).toBe(first)
    expect(getInboxItems()).toHaveLength(1)
  })

  it('retains at most 250 recent items', () => {
    for (let index = 0; index < INBOX_MAX_ITEMS + 1; index++) {
      addInboxItem({ id: String(index), category: 'community', title: 'Notice', message: '', source: 'Community' })
    }
    expect(getInboxItems()).toHaveLength(INBOX_MAX_ITEMS)
    expect(getInboxItems()[0].id).toBe(String(INBOX_MAX_ITEMS))
  })

  it('drops items older than the retention window', () => {
    const now = Date.now()
    addInboxItem({
      id: 'expired',
      category: 'system',
      title: 'Old status',
      message: '',
      source: 'API',
      createdAt: now - INBOX_RETENTION_MS - 1,
    })

    expect(getInboxItems()).toHaveLength(0)
  })

  it('marks all unread items as read and creates community notices', () => {
    const notice = recordCommunityNotice('Maintenance', 'Prices may pause briefly.')
    addInboxItem({ category: 'system', title: 'Status', message: '', source: 'Network' })
    markAllInboxItemsRead(123)

    expect(notice.category).toBe('community')
    expect(unreadInboxCount()).toBe(0)
    expect(getInboxItems().every((item) => item.readAt === 123)).toBe(true)
  })

  it('rejects empty community notices', () => {
    expect(() => recordCommunityNotice(' ', 'Details')).toThrow('Community notices require both a title and a message.')
  })
})
