import { useEffect, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { useAnnounce, type Announcement, type AnnouncementPriority } from '../hooks/useAnnounce'

const ANNOUNCEMENT_DURATION_MS = 1000
const ANNOUNCEMENT_GAP_MS = 100

/**
 * Keeps one live region mounted at the app shell and queues messages so bursts
 * are announced in order instead of replacing content before assistive tech reads it.
 */
export function LiveRegionContainer(): ReactElement {
  const { subscribe } = useAnnounce()
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const queuesRef = useRef<Record<AnnouncementPriority, Announcement[]>>({
    polite: [],
    assertive: [],
  })
  const activeRef = useRef<Record<AnnouncementPriority, boolean>>({
    polite: false,
    assertive: false,
  })
  const timeoutsRef = useRef<Record<AnnouncementPriority, ReturnType<typeof setTimeout> | undefined>>({
    polite: undefined,
    assertive: undefined,
  })

  useEffect(() => {
    const queues = queuesRef.current
    const active = activeRef.current
    const timeouts = timeoutsRef.current

    const displayNext = (priority: AnnouncementPriority): void => {
      const next = queues[priority].shift()
      if (!next) {
        active[priority] = false
        return
      }

      active[priority] = true
      if (priority === 'polite') {
        setPoliteMessage(next.message)
      } else {
        setAssertiveMessage(next.message)
      }

      timeouts[priority] = setTimeout(() => {
        if (priority === 'polite') {
          setPoliteMessage('')
        } else {
          setAssertiveMessage('')
        }
        timeouts[priority] = setTimeout(() => displayNext(priority), ANNOUNCEMENT_GAP_MS)
      }, ANNOUNCEMENT_DURATION_MS)
    }

    const unsubscribe = subscribe((announcement: Announcement) => {
      const { priority } = announcement
      queues[priority].push(announcement)
      if (!active[priority]) {
        displayNext(priority)
      }
    })

    return () => {
      unsubscribe()
      clearTimeout(timeouts.polite)
      clearTimeout(timeouts.assertive)
      queues.polite = []
      queues.assertive = []
      active.polite = false
      active.assertive = false
    }
  }, [subscribe])

  return createPortal(
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions text"
        className="sr-only"
        data-testid="live-region-polite"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-relevant="additions text"
        className="sr-only"
        data-testid="live-region-assertive"
      >
        {assertiveMessage}
      </div>
    </>,
    document.body,
  )
}
