import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { addInboxItem, clearInbox } from '../services/inbox'
import { Inbox } from './Inbox'

afterEach(() => {
  cleanup()
  clearInbox()
})

function renderInbox() {
  return render(
    <MemoryRouter>
      <Inbox />
    </MemoryRouter>,
  )
}

describe('Inbox', () => {
  it('groups messages by day and filters by category', async () => {
    const user = userEvent.setup()
    addInboxItem({ category: 'alert', title: 'Threshold fired', message: 'BTC/USD', source: 'Price alerts' })
    addInboxItem({ category: 'system', title: 'Connection restored', message: 'Online', source: 'Network status' })

    renderInbox()
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByText('Threshold fired')).toBeInTheDocument()
    expect(screen.getByText('Connection restored')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'System' }))
    expect(screen.queryByText('Threshold fired')).not.toBeInTheDocument()
    expect(screen.getByText('Connection restored')).toBeInTheDocument()
  })

  it('marks an item read when its deep link is opened', async () => {
    const user = userEvent.setup()
    addInboxItem({
      id: 'alert:btc',
      category: 'alert',
      title: 'BTC alert',
      message: 'Price crossed threshold',
      href: '/prices/BTC%2FUSD',
      source: 'Price alerts',
    })

    renderInbox()
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link).toHaveAttribute('href', '/prices/BTC%2FUSD')
    await user.click(link)
    expect(screen.getByText(/0 unread\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark BTC alert as read' })).not.toBeInTheDocument()
  })

  it('creates community notices and provides an empty state', async () => {
    const user = userEvent.setup()
    renderInbox()
    expect(screen.getByRole('status')).toHaveTextContent('Your inbox is empty.')
    await user.type(screen.getByRole('textbox', { name: 'Notice title' }), 'Community call')
    await user.type(screen.getByRole('textbox', { name: 'Notice message' }), 'Join us Friday.')
    await user.click(screen.getByRole('button', { name: 'Add notice' }))

    expect(screen.getByText('Community call')).toBeInTheDocument()
    expect(screen.getByText('Join us Friday.')).toBeInTheDocument()
    expect(screen.getAllByText('Community')).toHaveLength(2)
  })

  it('marks every unread message read', async () => {
    const user = userEvent.setup()
    addInboxItem({ category: 'system', title: 'Status', message: '', source: 'API' })
    renderInbox()

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(screen.getByText(/0 unread\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark Status as read' })).not.toBeInTheDocument()
  })
})
