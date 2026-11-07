import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import { API_ENDPOINTS } from '../../config/Api'
import { useNow } from '../../hooks/useNow'
import { swrFetcher } from '../../utils/fetcher'
import { extractApiError, showError, showSuccess } from '../../utils/toast'
import {
  formatCurrency,
  formatDateRange,
  formatDateTime,
  formatRemaining,
  getPendingExpiry,
  getTicketGroup,
  getTicketStatusMeta,
} from '../../utils/foodfest'
import { Ticket, RefreshCw, CalendarDays, Clock, Copy, Check, Eye, EyeOff, ExternalLink, CircleCheck, CircleAlert, LoaderCircle } from 'lucide-react'

const GROUPS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'scanned', label: 'Scanned' },
  { id: 'past', label: 'Past' },
]

const eventStart = (ticket) => {
  const value = ticket?.eventId?.startTime
  const time = value ? new Date(value).getTime() : NaN
  return Number.isNaN(time) ? 0 : time
}

const TicketCard = memo(({ ticket, now, highlighted }) => {
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)

  const statusMeta = getTicketStatusMeta(ticket.status)
  const event = ticket.eventId && typeof ticket.eventId === 'object' ? ticket.eventId : null
  const tier = ticket.tierId && typeof ticket.tierId === 'object' ? ticket.tierId : null

  const pendingExpiry = ticket.status === 'pending_payment' ? getPendingExpiry(ticket) : null
  const pendingRemaining = pendingExpiry ? pendingExpiry - now : null
  const pendingExpired = pendingRemaining !== null && pendingRemaining <= 0

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticket.qrToken)
      setCopied(true)
      showSuccess('Entry code copied.')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      showError('Could not copy the entry code. Select it manually.')
    }
  }

  return (
    <article
      id={`ticket-${ticket._id}`}
      className="rounded-2xl p-5"
      style={{
        background: 'var(--color-background-white)',
        border: `1px solid ${highlighted ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
        boxShadow: highlighted ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-sans"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {tier?.name || 'FoodFest ticket'}
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold leading-tight" style={{ color: 'var(--color-text-base)' }}>
            {event?.name || 'Event unavailable'}
          </h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateRange(event?.startTime, event?.endTime) || 'Date unavailable'}
          </p>
        </div>

        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold font-sans"
          style={{
            background: statusMeta.bg,
            color: statusMeta.text,
            border: `1px solid ${statusMeta.border}`,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
        <span>Paid {formatCurrency(ticket.priceAtPurchase)}</span>
        {ticket.createdAt ? <span>Booked {formatDateTime(ticket.createdAt)}</span> : null}
      </div>

      {ticket.status === 'valid' && ticket.qrImageUrl ? (
        <div
          className="mt-4 flex flex-col items-center gap-2 rounded-2xl px-4 py-5"
          style={{ background: 'var(--color-surface-muted)' }}
        >
          <img
            src={ticket.qrImageUrl}
            alt={`QR pass for ${event?.name || 'your FoodFest event'}`}
            className="h-44 w-44 rounded-xl bg-white object-contain p-2"
            loading="lazy"
            decoding="async"
          />
          <p className="text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
            Show this QR at the gate.
          </p>
          <a
            href={ticket.qrImageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold font-sans"
            style={{ color: 'var(--color-primary)' }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open QR
          </a>
        </div>
      ) : null}

      {ticket.status === 'valid' && ticket.qrToken ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowToken((value) => !value)}
            className="inline-flex items-center gap-1.5 text-xs font-bold font-sans"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showToken ? 'Hide entry code' : 'Show entry code'}
          </button>

          {showToken ? (
            <div className="mt-2 flex items-start gap-2">
              <code
                className="min-w-0 flex-1 break-all rounded-lg px-3 py-2 text-[11px] leading-relaxed"
                style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }}
              >
                {ticket.qrToken}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy entry code"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {ticket.status === 'pending_payment' ? (
        <div className="mt-4 rounded-xl px-4 py-3" style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: '#92400E' }} />
            <p className="text-sm font-bold font-sans" style={{ color: '#92400E' }}>
              {pendingExpired
                ? 'Payment hold expired'
                : pendingRemaining !== null
                  ? `${formatRemaining(pendingRemaining)} left to pay`
                  : 'Payment pending'}
            </p>
          </div>
          <p className="mt-1 text-xs leading-relaxed font-sans" style={{ color: '#92400E' }}>
            {pendingExpired
              ? 'Refresh in a moment to see the released seat.'
              : 'Payment cannot be resumed. If this hold expires, start a new purchase from the event page.'}
          </p>
        </div>
      ) : null}

      {ticket.status === 'used' ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
          <CircleCheck className="h-4 w-4" style={{ color: '#15803D' }} />
          {ticket.checkedInAt ? `Checked in ${formatDateTime(ticket.checkedInAt)}` : 'Checked in at the gate'}
        </p>
      ) : null}

      {ticket.status === 'refunded' && ticket.refundedAt ? (
        <p className="mt-4 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
          Refunded {formatDateTime(ticket.refundedAt)}
        </p>
      ) : null}
    </article>
  )
})

TicketCard.displayName = 'TicketCard'

const TicketSkeleton = () => (
  <div
    className="animate-pulse rounded-2xl p-5"
    style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded" style={{ background: 'var(--color-surface-muted)' }} />
        <div className="h-5 w-2/3 rounded" style={{ background: 'var(--color-surface-muted)' }} />
        <div className="h-3 w-40 rounded" style={{ background: 'var(--color-surface-muted)' }} />
      </div>
      <div className="h-6 w-20 rounded-full" style={{ background: 'var(--color-surface-muted)' }} />
    </div>
    <div className="mt-5 h-3 w-48 rounded" style={{ background: 'var(--color-surface-muted)' }} />
  </div>
)

const EmptyTickets = () => (
  <div
    className="flex flex-col items-center rounded-2xl px-6 py-16 text-center"
    style={{ background: 'var(--color-background-white)', border: '1px dashed var(--color-border-medium)' }}
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(255,106,0,0.1)' }}>
      <Ticket className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
    </div>
    <h2 className="mt-4 font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
      No tickets yet
    </h2>
    <p className="mt-2 max-w-md text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
      Browse FoodFest events and book a pass. Your QR ticket will appear here as soon as the
      payment is confirmed.
    </p>
    <Link
      to="/events"
      className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans"
      style={{ background: 'var(--color-primary)', color: '#fff' }}
    >
      <Ticket className="h-4 w-4" />
      Browse events
    </Link>
  </div>
)

const MyTickets = () => {
  const location = useLocation()
  const highlightId = location.state?.highlightTicketId
  const highlightHandledRef = useRef(false)
  const [activeGroup, setActiveGroup] = useState('upcoming')

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_ENDPOINTS.foodfest.myTickets,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const grouped = useMemo(() => {
    const result = { upcoming: [], scanned: [], past: [] }
    const list = Array.isArray(data?.tickets) ? data.tickets : []

    for (const ticket of list) {
      const group = getTicketGroup(ticket.status)
      if (result[group]) result[group].push(ticket)
    }

    result.upcoming.sort((a, b) => eventStart(a) - eventStart(b))
    result.scanned.sort((a, b) => eventStart(b) - eventStart(a))
    result.past.sort((a, b) => eventStart(b) - eventStart(a))

    return result
  }, [data])

  const hasPending = grouped.upcoming.some((ticket) => ticket.status === 'pending_payment')
  const now = useNow(hasPending ? 1000 : 60000)

  useEffect(() => {
    if (!highlightId || !data || highlightHandledRef.current) return

    const ticket = (data.tickets || []).find((item) => item._id === highlightId)
    if (!ticket) return

    highlightHandledRef.current = true
    setActiveGroup(getTicketGroup(ticket.status))

    const timer = window.setTimeout(() => {
      document.getElementById(`ticket-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)

    return () => window.clearTimeout(timer)
  }, [highlightId, data])

  const totalTickets = grouped.upcoming.length + grouped.scanned.length + grouped.past.length
  const activeTickets = grouped[activeGroup] || []
  const activeLabel = GROUPS.find((group) => group.id === activeGroup)?.label || 'Tickets'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-sans"
              style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
            >
              FoodFest
            </span>
            <h1 className="mt-3 font-serif text-3xl font-black leading-tight sm:text-4xl" style={{ color: 'var(--color-text-base)' }}>
              My tickets
            </h1>
            <p className="mt-2 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
              Your QR passes, payment holds, and entry history in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold font-sans transition-colors disabled:opacity-50"
            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-base)' }}
          >
            {isValidating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </header>

        {isLoading ? (
          <div className="mt-8 space-y-4">
            <TicketSkeleton />
            <TicketSkeleton />
          </div>
        ) : error ? (
          <div
            className="mt-8 flex flex-col items-center rounded-2xl px-6 py-14 text-center"
            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
          >
            <CircleAlert className="h-10 w-10" style={{ color: '#DC2626' }} />
            <h2 className="mt-4 font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
              Tickets could not be loaded
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
              {extractApiError(error, 'Check your connection and try again.')}
            </p>
            <button
              type="button"
              onClick={() => mutate()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : totalTickets === 0 ? (
          <div className="mt-8">
            <EmptyTickets />
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Ticket groups">
              {GROUPS.map((group) => {
                const active = activeGroup === group.id
                const count = grouped[group.id].length

                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveGroup(group.id)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold font-sans transition-colors"
                    style={{
                      background: active ? 'var(--color-primary)' : 'var(--color-background-white)',
                      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                      color: active ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    {group.label}
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-muted)',
                        color: active ? '#fff' : 'var(--color-text-faint)',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <section className="mt-5" aria-label={`${activeLabel} tickets`}>
              {activeTickets.length === 0 ? (
                <div
                  className="rounded-2xl px-6 py-12 text-center"
                  style={{ background: 'var(--color-background-white)', border: '1px dashed var(--color-border-medium)' }}
                >
                  <Ticket className="mx-auto h-8 w-8" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="mt-3 font-serif text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                    No {activeLabel.toLowerCase()} tickets
                  </p>
                  <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                    {activeGroup === 'upcoming'
                      ? 'Book a pass and it will show up here.'
                      : 'Nothing to show in this group yet.'}
                  </p>
                  {activeGroup === 'upcoming' ? (
                    <Link
                      to="/events"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      <Ticket className="h-4 w-4" />
                      Browse events
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTickets.map((ticket) => (
                    <TicketCard
                      key={ticket._id}
                      ticket={ticket}
                      now={ticket.status === 'pending_payment' ? now : 0}
                      highlighted={ticket._id === highlightId}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default MyTickets
