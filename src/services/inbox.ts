import { z } from 'zod'
import { readJson, STORAGE_KEYS, writeJson } from '../utils/storage'

export type InboxCategory = 'alert' | 'system' | 'community'

export interface InboxItem {
  id: string
  category: InboxCategory
  title: string
  message: string
  createdAt: number
  readAt: number | null
  href: string | null
  source: string
}

const InboxItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['alert', 'system', 'community']),
  title: z.string().min(1),
  message: z.string(),
  createdAt: z.number().int().nonnegative(),
  readAt: z.number().int().nonnegative().nullable(),
  href: z.string().startsWith('/').nullable(),
  source: z.string().min(1),
})
const InboxItemsSchema = z.array(InboxItemSchema)

export const INBOX_RETENTION_MS = 90 * 24 * 60 * 60 * 1000
export const INBOX_MAX_ITEMS = 250

const listeners = new Set<() => void>()

function isInboxItems(value: unknown): value is InboxItem[] {
  return InboxItemsSchema.safeParse(value).success
}

function prune(items: InboxItem[], now = Date.now()): InboxItem[] {
  return items
    .filter((item) => item.createdAt >= now - INBOX_RETENTION_MS && item.createdAt <= now)
    .slice(0, INBOX_MAX_ITEMS)
}

const storedItems = readJson<InboxItem[]>(STORAGE_KEYS.inbox, [], isInboxItems)
let items = prune(storedItems)
if (items.length !== storedItems.length && !writeJson(STORAGE_KEYS.inbox, items)) {
  console.error('[inbox] Could not prune expired inbox state; browser storage is unavailable.')
}

function persist(): void {
  if (!writeJson(STORAGE_KEYS.inbox, items)) {
    console.error('[inbox] Could not persist inbox state; browser storage is unavailable.')
  }
}

function publish(): void {
  persist()
  for (const listener of listeners) listener()
}

export function getInboxItems(): InboxItem[] {
  return items
}

export function subscribeToInbox(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export interface NewInboxItem {
  id?: string
  category: InboxCategory
  title: string
  message: string
  createdAt?: number
  href?: string | null
  source: string
}

export function addInboxItem(input: NewInboxItem): InboxItem {
  const createdAt = input.createdAt ?? Date.now()
  const id = input.id ?? crypto.randomUUID()
  const item: InboxItem = {
    id,
    category: input.category,
    title: input.title,
    message: input.message,
    createdAt,
    readAt: null,
    href: input.href ?? null,
    source: input.source,
  }

  const parsed = InboxItemSchema.safeParse(item)
  if (!parsed.success) {
    throw new Error(`Invalid inbox item: ${parsed.error.message}`)
  }

  const duplicate = items.find((existing) => existing.id === item.id)
  if (duplicate) return duplicate

  items = prune([item, ...items])
  publish()
  return item
}

export function markInboxItemRead(id: string, readAt = Date.now()): void {
  const item = items.find((entry) => entry.id === id)
  if (!item || item.readAt !== null) return
  items = items.map((entry) => (entry.id === id ? { ...entry, readAt } : entry))
  publish()
}

export function markAllInboxItemsRead(readAt = Date.now()): void {
  if (!items.some((item) => item.readAt === null)) return
  items = items.map((item) => (item.readAt === null ? { ...item, readAt } : item))
  publish()
}

export function unreadInboxCount(): number {
  return items.filter((item) => item.readAt === null).length
}

export function clearInbox(): void {
  if (items.length === 0) return
  items = []
  publish()
}

export function recordCommunityNotice(title: string, message: string): InboxItem {
  const cleanTitle = title.trim()
  const cleanMessage = message.trim()
  if (!cleanTitle || !cleanMessage) {
    throw new Error('Community notices require both a title and a message.')
  }
  return addInboxItem({
    category: 'community',
    title: cleanTitle,
    message: cleanMessage,
    source: 'Community',
  })
}

export function pruneInbox(now = Date.now()): void {
  const next = prune(items, now)
  if (next.length === items.length) return
  items = next
  publish()
}
