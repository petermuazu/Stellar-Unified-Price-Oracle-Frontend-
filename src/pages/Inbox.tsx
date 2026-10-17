import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  getInboxItems,
  markAllInboxItemsRead,
  markInboxItemRead,
  recordCommunityNotice,
  subscribeToInbox,
  type InboxCategory,
  type InboxItem,
} from '../services/inbox'

type Filter = 'all' | 'unread' | InboxCategory

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'alert', label: 'Alerts' },
  { value: 'system', label: 'System' },
  { value: 'community', label: 'Community' },
]

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { dateStyle: 'long' })
}

function groupByDay(entries: InboxItem[]): [string, InboxItem[]][] {
  const groups = new Map<string, InboxItem[]>()
  for (const entry of entries) {
    const label = dayLabel(entry.createdAt)
    const group = groups.get(label) ?? []
    group.push(entry)
    groups.set(label, group)
  }
  return [...groups.entries()]
}

function categoryLabel(category: InboxCategory): string {
  return category[0].toUpperCase() + category.slice(1)
}

export function Inbox() {
  const items = useSyncExternalStore(subscribeToInbox, getInboxItems, getInboxItems)
  const [filter, setFilter] = useState<Filter>('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const unreadCount = useMemo(() => items.filter((item) => item.readAt === null).length, [items])
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (filter === 'unread') return item.readAt === null
        return filter === 'all' || item.category === filter
      }),
    [filter, items],
  )
  const groupedItems = useMemo(() => groupByDay(visibleItems), [visibleItems])

  function submitCommunityNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      recordCommunityNotice(title, message)
      setTitle('')
      setMessage('')
      setFormError('')
      setFilter('community')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not add this notice.')
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="inbox-title">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="inbox-title" className="text-2xl font-semibold text-gray-900 dark:text-white">
            Inbox
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Alerts, system updates, and community notices. {unreadCount} unread.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllInboxItemsRead()}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Mark all as read
          </button>
        )}
      </header>

      <form
        onSubmit={submitCommunityNotice}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        aria-labelledby="community-notice-title"
      >
        <h2 id="community-notice-title" className="text-sm font-semibold text-gray-900 dark:text-white">
          Add a community notice
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(10rem,1fr)_2fr_auto]">
          <label className="sr-only" htmlFor="inbox-notice-title">
            Notice title
          </label>
          <input
            id="inbox-notice-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            placeholder="Title"
            className="min-h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 dark:border-gray-700 dark:text-white"
          />
          <label className="sr-only" htmlFor="inbox-notice-message">
            Notice message
          </label>
          <input
            id="inbox-notice-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1000}
            required
            placeholder="Write a notice to keep in your inbox"
            className="min-h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 dark:border-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-cyan-700 px-4 text-sm font-medium text-white hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
          >
            Add notice
          </button>
        </div>
        {formError && <p className="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">{formError}</p>}
      </form>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter inbox by category">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 ${
              filter === value
                ? 'border-cyan-700 bg-cyan-100 text-cyan-900 dark:border-cyan-500 dark:bg-cyan-950 dark:text-cyan-100'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {groupedItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400" role="status">
          {items.length === 0 ? 'Your inbox is empty.' : 'No messages match this filter.'}
        </p>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(([day, dayItems]) => (
            <section key={day} aria-labelledby={`inbox-day-${day}`}>
              <h2 id={`inbox-day-${day}`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {day}
              </h2>
              <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                {dayItems.map((item) => (
                  <li key={item.id} className={`flex items-start gap-3 p-4 ${item.readAt === null ? 'bg-cyan-50/60 dark:bg-cyan-950/20' : ''}`}>
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-600" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {categoryLabel(item.category)}
                        </span>
                        {!item.readAt && <span className="text-xs font-medium text-cyan-800 dark:text-cyan-300">Unread</span>}
                        <time className="text-xs text-gray-500" dateTime={new Date(item.createdAt).toISOString()}>
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </time>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
                      <p className="mt-1 text-xs text-gray-500">From {item.source}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {item.href && (
                        <Link
                          to={item.href}
                          onClick={() => markInboxItemRead(item.id)}
                          className="text-sm font-medium text-cyan-800 underline underline-offset-2 hover:text-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          Open
                        </Link>
                      )}
                      {item.readAt === null && (
                        <button
                          type="button"
                          onClick={() => markInboxItemRead(item.id)}
                          className="text-xs text-gray-600 underline underline-offset-2 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 dark:text-gray-400 dark:hover:text-white"
                          aria-label={`Mark ${item.title} as read`}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
