import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  Users,
  Settings,
  LayoutDashboard,
  Loader2,
  Sparkles,
  ShieldCheck,
  ShieldX,
  Plus,
  RefreshCw,
  IndianRupee,
  TicketCheck,
  DoorOpen,
  PlayCircle,
  Flag
} from 'lucide-react'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import ErrorBoundary from '../../Components/ErrorBoundary'
import ScrambleNumber from '../../Components/ScrambleNumber'
import TierManager from '../../Components/organizer/TierManager'
import ZoneManager from '../../Components/organizer/ZoneManager'
import EventSettingsForm from '../../Components/organizer/EventSettingsForm'
import { showSuccess, showError, showWarning } from '../../utils/toast'
import {
  formatCurrency,
  formatDateRange,
  formatDateTime,
  getTicketStatusMeta
} from '../../utils/foodfest'
import { API_ENDPOINTS } from '../../config/Api'

const EVENT_STATUS_META = {
  draft: { label: 'Draft', bg: 'rgba(148,163,184,0.18)', color: '#475569' },
  published: { label: 'Published', bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' },
  live: { label: 'Live', bg: 'rgba(34,197,94,0.16)', color: '#15803d' },
  completed: { label: 'Completed', bg: 'rgba(139,92,246,0.16)', color: '#6d28d9' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.14)', color: '#b91c1c' }
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tickets', label: 'Ticket tiers', icon: Ticket },
  { id: 'zones', label: 'Zones', icon: DoorOpen },
  { id: 'attendees', label: 'Attendees', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings }
]

const TICKET_FILTERS = [
  { value: '', label: 'All tickets' },
  { value: 'valid', label: 'Valid' },
  { value: 'used', label: 'Scanned' },
  { value: 'pending_payment', label: 'Payment pending' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' }
]

const StatCard = ({ icon, label, value, accent, prefix = '' }) => (
  <div
    className="org-stat-card rounded-2xl p-4"
    style={{
      background: 'var(--color-background-white)',
      border: '1px solid var(--color-border-light)'
    }}
  >
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: accent ? 'rgba(255,106,0,0.12)' : 'rgba(255,184,0,0.16)' }}
      >
        {React.createElement(icon, {
          className: 'h-4 w-4',
          style: { color: accent ? 'var(--color-primary)' : '#8a5a00' }
        })}
      </span>
      <span className="font-sans text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
    <p className="mt-2 font-serif text-2xl font-black tracking-[-0.02em]" style={{ color: 'var(--color-text-base)' }}>
      {typeof value === 'number' ? <ScrambleNumber value={value} prefix={prefix} /> : value}
    </p>
  </div>
)

const OrganizerDashboard = () => {
  const [searchParams] = useSearchParams()
  const requestedEvent = searchParams.get('event')

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [busyAction, setBusyAction] = useState(null)
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketFilter, setTicketFilter] = useState('')
  const sectionBarRef = useRef(null)
  const sectionRefs = useRef({})
  const [sectionIndicator, setSectionIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    visible: false
  })

  // Active-tab pill: measures the selected tab so it stays correct when the
  // bar wraps to multiple rows on narrow screens.
  useLayoutEffect(() => {
    const bar = sectionBarRef.current
    if (!bar) return undefined

    const update = () => {
      const el = sectionRefs.current[activeSection]
      if (!el) return
      const barRect = bar.getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      setSectionIndicator({
        left: rect.left - barRect.left - bar.clientLeft,
        top: rect.top - barRect.top - bar.clientTop,
        width: rect.width,
        height: rect.height,
        visible: true
      })
    }

    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(bar)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeSection, detail?.event?._id])

  const selectedEvent = events.find((event) => event._id === selectedId) || null
  const hasAccess = selectedEvent?.organizerAccess === true

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.foodfest.organizerEvents, {
        withCredentials: true
      })
      if (res.data?.success) {
        setEvents(res.data.events || [])
      }
    } catch (err) {
      console.error('Failed to load organizer events:', err)
      showError('Could not load your events')
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (eventId) => {
    if (!eventId) return

    setDetailLoading(true)
    try {
      const res = await axios.get(API_ENDPOINTS.foodfest.organizerEvent(eventId), {
        withCredentials: true
      })
      if (res.data?.success) {
        setDetail({
          event: res.data.event,
          tiers: res.data.tiers || [],
          zones: res.data.zones || [],
          summary: res.data.summary || {}
        })
      }
    } catch (err) {
      console.error('Failed to load event detail:', err)
      setDetail(null)
      showError(err?.response?.data?.message || 'Could not load this event')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const fetchTickets = useCallback(async (eventId, status) => {
    if (!eventId) return

    setTicketsLoading(true)
    try {
      const url = new URL(API_ENDPOINTS.foodfest.organizerEventTickets(eventId))
      if (status) url.searchParams.set('status', status)
      const res = await axios.get(url.toString(), { withCredentials: true })
      if (res.data?.success) {
        setTickets(res.data.tickets || [])
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
      showError('Could not load attendees')
    } finally {
      setTicketsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (events.length === 0) return
    if (selectedId && events.some((event) => event._id === selectedId)) return

    const preferred =
      events.find((event) => event._id === requestedEvent) ||
      events.find((event) => event.organizerAccess) ||
      events[0]
    setSelectedId(preferred._id)
  }, [events, requestedEvent, selectedId])

  useEffect(() => {
    if (!selectedId || !hasAccess) {
      setDetail(null)
      return
    }
    loadDetail(selectedId)
  }, [selectedId, hasAccess, loadDetail])

  useEffect(() => {
    if (!selectedId || !hasAccess || activeSection !== 'attendees') return
    fetchTickets(selectedId, ticketFilter)
  }, [selectedId, hasAccess, activeSection, ticketFilter, fetchTickets])

  const refreshAll = async () => {
    await fetchEvents()
    if (selectedId && hasAccess) await loadDetail(selectedId)
  }

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Entrance choreography (anime.js v4): cards → stats → section panel.
  // Elements are visible by default; animation only runs when motion is allowed,
  // so no-JS and reduced-motion users get the finished layout.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const cards = [...document.querySelectorAll('.org-event-card')]
    if (!cards.length) return undefined
    const anim = animate(cards, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: stagger(60),
      duration: 600,
      easing: 'easeOutExpo'
    })
    return () => anim?.pause?.()
  }, [events.length])

  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const nodes = [...document.querySelectorAll('.org-stat-card, .org-panel')]
    if (!nodes.length) return undefined
    const anim = animate(nodes, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: stagger(50),
      duration: 550,
      easing: 'easeOutExpo'
    })
    return () => anim?.pause?.()
  }, [activeSection, selectedId, detail?.event?._id])

  const runLifecycle = async (kind) => {
    if (!selectedEvent) return

    const actions = {
      publish: {
        url: API_ENDPOINTS.foodfest.organizerPublish(selectedEvent._id),
        confirm: `Publish "${selectedEvent.name}"? It will appear on the public events page.`,
        success: 'Event published'
      },
      goLive: {
        url: API_ENDPOINTS.foodfest.organizerGoLive(selectedEvent._id),
        confirm: `Mark "${selectedEvent.name}" as live? Gate check-ins will start working.`,
        success: 'Event is live'
      },
      complete: {
        url: API_ENDPOINTS.foodfest.organizerComplete(selectedEvent._id),
        confirm: `Mark "${selectedEvent.name}" as completed?`,
        success: 'Event completed'
      }
    }

    const action = actions[kind]
    if (!action || !window.confirm(action.confirm)) return

    setBusyAction(kind)
    try {
      const res = await axios.patch(action.url, {}, { withCredentials: true })
      if (res.data?.success) {
        showSuccess(res.data.message || action.success)
        if (res.data.warnings?.length) {
          res.data.warnings.forEach((warning) => showWarning(warning))
        }
        await refreshAll()
      } else {
        showError(res.data?.message || 'Action failed')
      }
    } catch (err) {
      console.error('Organizer action error:', err)
      showError(err?.response?.data?.message || 'Action failed')
    } finally {
      setBusyAction(null)
    }
  }

  const summary = detail?.summary || {}

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="pressable mb-4 inline-flex items-center gap-2 rounded-full px-2 py-1 font-sans text-sm font-semibold transition-colors hover:text-[#1a1208]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </button>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Organizer studio
            </span>
            <h1
              className="mt-3 font-serif text-4xl font-black leading-[1.05] tracking-[-0.02em] sm:text-5xl"
              style={{ color: 'var(--color-text-base)' }}
            >
              Your events
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Set up ticket tiers, venue zones, and everything guests need. Admin approval gives you full control here.
            </p>
          </div>

          <Link
            to="/events/host"
            className="pressable hover-gated inline-flex items-center gap-2 rounded-xl px-5 py-3 font-sans text-sm font-bold shadow-[0_8px_20px_rgba(26,18,8,0.12)]"
            style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Propose another event
          </Link>
        </div>

        <ErrorBoundary>
          {eventsLoading ? (
            <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
              <div className="h-64 animate-pulse rounded-2xl bg-[var(--color-border-light)]" />
              <div className="h-96 animate-pulse rounded-2xl bg-[var(--color-border-light)]" />
            </div>
          ) : events.length === 0 ? (
            <div
              className="panel-enter rounded-[28px] p-10 text-center sk-surface"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ffe8cc]">
                <Sparkles className="h-8 w-8" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-serif text-3xl font-black tracking-[-0.02em]" style={{ color: 'var(--color-text-base)' }}>
                No events yet
              </h2>
              <p className="mx-auto mt-2 max-w-md font-sans text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Propose your first FoodFest event. Once an admin approves it, it will appear here with full organizer tools.
              </p>
              <Link
                to="/events/host"
                className="pressable hover-gated mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-sans text-sm font-bold text-[#1a1208]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Propose an event
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <aside className="space-y-3" aria-label="Your events">
                {events.map((event) => {
                  const meta = EVENT_STATUS_META[event.status] || EVENT_STATUS_META.draft
                  const active = event._id === selectedId
                  return (
                    <button
                      key={event._id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedId(event._id)
                        setActiveSection('overview')
                      }}
                      className="org-event-card pressable hover-gated w-full rounded-2xl p-4 text-left"
                      style={{
                        background: 'var(--color-background-white)',
                        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                        boxShadow: active
                          ? 'inset 0 0 0 1px var(--color-primary), 0 8px 20px rgba(26,18,8,0.08)'
                          : 'none'
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-base font-bold leading-snug" style={{ color: 'var(--color-text-base)' }}>
                          {event.name}
                        </p>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-bold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {event.venue?.city} · {formatDateRange(event.startTime, event.endTime)}
                      </p>
                      <span
                        className="mt-2 inline-flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: event.organizerAccess ? '#15803d' : '#b91c1c' }}
                      >
                        {event.organizerAccess ? <ShieldCheck className="h-3 w-3" aria-hidden="true" /> : <ShieldX className="h-3 w-3" aria-hidden="true" />}
                        {event.organizerAccess ? 'Organizer access' : 'Access revoked'}
                      </span>
                    </button>
                  )
                })}
              </aside>

              <section className="min-w-0">
                {!selectedEvent ? null : !hasAccess ? (
                  <div
                    className="rounded-2xl p-8"
                    style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
                  >
                    <ShieldX className="h-9 w-9" style={{ color: '#b91c1c' }} />
                    <h2 className="mt-3 font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                      Organizer access revoked
                    </h2>
                    <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      An admin has paused your organizer powers for this event. The event and its sales are untouched.
                      Contact the FoodReel team if you think this is a mistake.
                    </p>
                  </div>
                ) : detailLoading && !detail ? (
                  <div className="h-96 animate-pulse rounded-2xl bg-[var(--color-border-light)]" />
                ) : !detail ? (
                  <div
                    className="rounded-2xl p-8 text-center"
                    style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
                  >
                    <p className="font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Could not load this event.
                    </p>
                    <button
                      type="button"
                      onClick={() => loadDetail(selectedId)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-sans text-sm font-bold"
                      style={{ background: 'var(--color-primary)', color: '#1a1208' }}
                    >
                      <RefreshCw className="h-4 w-4" /> Retry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div
                      className="org-panel rounded-[28px] p-5 sk-surface"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-serif text-2xl font-black tracking-[-0.02em]" style={{ color: 'var(--color-text-base)' }}>
                              {detail.event.name}
                            </h2>
                            <span
                              className="rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold"
                              style={{
                                background: (EVENT_STATUS_META[detail.event.status] || EVENT_STATUS_META.draft).bg,
                                color: (EVENT_STATUS_META[detail.event.status] || EVENT_STATUS_META.draft).color
                              }}
                            >
                              {(EVENT_STATUS_META[detail.event.status] || EVENT_STATUS_META.draft).label}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 font-sans text-[11px] font-bold text-green-700">
                              <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Organizer
                            </span>
                          </div>
                          <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {detail.event.venue?.address}, {detail.event.venue?.city}
                          </p>
                          <p className="mt-0.5 font-sans text-xs" style={{ color: 'var(--color-text-faint)' }}>
                            {formatDateTime(detail.event.startTime)} – {formatDateTime(detail.event.endTime)}
                          </p>
                          {detail.event.venue?.gpsLoc && (
                            <p className="mt-1 break-all font-sans text-xs" style={{ color: 'var(--color-text-faint)' }}>
                              GPS: {detail.event.venue.gpsLoc}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {detail.event.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => runLifecycle('publish')}
                              disabled={busyAction !== null}
                              className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-sans text-sm font-bold text-[#1a1208] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyAction === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlayCircle className="h-4 w-4" aria-hidden="true" />}
                              Publish
                            </button>
                          )}
                          {detail.event.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => runLifecycle('goLive')}
                              disabled={busyAction !== null}
                              className="pressable hover-gated inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 font-sans text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyAction === 'goLive' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlayCircle className="h-4 w-4" aria-hidden="true" />}
                              Go live
                            </button>
                          )}
                          {(detail.event.status === 'published' || detail.event.status === 'live') && (
                            <button
                              type="button"
                              onClick={() => runLifecycle('complete')}
                              disabled={busyAction !== null}
                              className="pressable inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-medium)] bg-white px-4 py-2.5 font-sans text-sm font-bold text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyAction === 'complete' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Flag className="h-4 w-4" aria-hidden="true" />}
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      ref={sectionBarRef}
                      role="tablist"
                      aria-label="Event sections"
                      className="relative flex flex-wrap gap-1 rounded-2xl border border-[var(--color-border-light)] bg-white/70 p-1 backdrop-blur"
                    >
                      <div
                        aria-hidden="true"
                        className="tab-slide pointer-events-none absolute left-0 top-0 rounded-xl bg-[var(--color-primary)]"
                        style={{
                          width: sectionIndicator.width,
                          height: sectionIndicator.height,
                          transform: `translate(${sectionIndicator.left}px, ${sectionIndicator.top}px)`,
                          opacity: sectionIndicator.visible ? 1 : 0
                        }}
                      />
                      {SECTIONS.map((section) => {
                        const Icon = section.icon
                        const active = activeSection === section.id
                        const showFallbackFill = active && !sectionIndicator.visible
                        return (
                          <button
                            key={section.id}
                            ref={(el) => { sectionRefs.current[section.id] = el }}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setActiveSection(section.id)}
                            className={`pressable relative z-10 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-sans text-sm font-bold cursor-pointer ${
                              active
                                ? showFallbackFill
                                  ? 'bg-[var(--color-primary)]'
                                  : ''
                                : 'hover:bg-[#fff3e6]'
                            }`}
                            style={{
                              color: active ? '#fffcef' : 'var(--color-text-muted)'
                            }}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" /> {section.label}
                          </button>
                        )
                      })}
                    </div>

                    <div key={activeSection + (selectedId || '')} className="org-panel space-y-5">
                    {activeSection === 'overview' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <StatCard icon={TicketCheck} label="Sold" value={summary.sold ?? 0} accent />
                          <StatCard icon={IndianRupee} label="Revenue" value={summary.revenue ?? 0} prefix="₹" accent />
                          <StatCard icon={Users} label="Checked in" value={summary.checkedIn ?? 0} />
                          <StatCard icon={Ticket} label="Capacity" value={summary.capacity ?? 0} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div
                            className="org-panel rounded-2xl p-5"
                            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
                          >
                            <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
                              Sales snapshot
                            </h3>
                            <dl className="mt-3 space-y-2 font-sans text-sm">
                              <div className="flex justify-between gap-3">
                                <dt style={{ color: 'var(--color-text-muted)' }}>Valid tickets</dt>
                                <dd className="font-bold" style={{ color: 'var(--color-text-base)' }}>{summary.byStatus?.valid ?? 0}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt style={{ color: 'var(--color-text-muted)' }}>Scanned tickets</dt>
                                <dd className="font-bold" style={{ color: 'var(--color-text-base)' }}>{summary.byStatus?.used ?? 0}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt style={{ color: 'var(--color-text-muted)' }}>Payment pending</dt>
                                <dd className="font-bold" style={{ color: 'var(--color-text-base)' }}>{summary.byStatus?.pending_payment ?? 0}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt style={{ color: 'var(--color-text-muted)' }}>Reserved seats</dt>
                                <dd className="font-bold" style={{ color: 'var(--color-text-base)' }}>{summary.reserved ?? 0}</dd>
                              </div>
                            </dl>
                          </div>

                          <div
                            className="org-panel rounded-2xl p-5"
                            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
                          >
                            <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
                              Event checklist
                            </h3>
                            <ul className="mt-3 space-y-2 font-sans text-sm">
                              <li className="flex items-center justify-between gap-3">
                                <span style={{ color: 'var(--color-text-muted)' }}>Ticket tiers</span>
                                <span className="font-bold" style={{ color: detail.tiers.length ? '#15803d' : '#b45309' }}>
                                  {detail.tiers.length ? `${detail.tiers.length} configured` : 'Add one'}
                                </span>
                              </li>
                              <li className="flex items-center justify-between gap-3">
                                <span style={{ color: 'var(--color-text-muted)' }}>Venue zones</span>
                                <span className="font-bold" style={{ color: detail.zones.length ? '#15803d' : '#b45309' }}>
                                  {detail.zones.length ? `${detail.zones.length} configured` : 'Add one'}
                                </span>
                              </li>
                              <li className="flex items-center justify-between gap-3">
                                <span style={{ color: 'var(--color-text-muted)' }}>GPS location</span>
                                <span className="font-bold" style={{ color: detail.event.venue?.gpsLoc ? '#15803d' : '#b45309' }}>
                                  {detail.event.venue?.gpsLoc ? 'Added' : 'Missing'}
                                </span>
                              </li>
                              <li className="flex items-center justify-between gap-3">
                                <span style={{ color: 'var(--color-text-muted)' }}>Banner image</span>
                                <span className="font-bold" style={{ color: detail.event.bannerImage ? '#15803d' : '#b45309' }}>
                                  {detail.event.bannerImage ? 'Added' : 'Optional'}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {detail.event.organizerNotes && (
                          <div
                            className="rounded-xl p-4 font-sans text-sm leading-relaxed"
                            style={{ background: 'rgba(255,184,0,0.12)', color: 'var(--color-text-base)' }}
                          >
                            <span className="font-bold">Your notes to the review team: </span>
                            {detail.event.organizerNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {activeSection === 'tickets' && (
                      <TierManager
                        eventId={detail.event._id}
                        tiers={detail.tiers}
                        onChanged={() => loadDetail(selectedId)}
                        disabled={false}
                      />
                    )}

                    {activeSection === 'zones' && (
                      <ZoneManager
                        eventId={detail.event._id}
                        zones={detail.zones}
                        onChanged={() => loadDetail(selectedId)}
                        disabled={false}
                      />
                    )}

                    {activeSection === 'attendees' && (
                      <div
                        className="org-panel rounded-[28px] p-5 sk-surface"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                              Attendees
                            </h2>
                            <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              Latest 200 tickets for this event.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={ticketFilter}
                              onChange={(event) => setTicketFilter(event.target.value)}
                              aria-label="Filter tickets"
                              className="rounded-xl border border-[var(--color-border-medium)] bg-white px-3 py-2 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-160 ease-out focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(255,106,0,0.18)]"
                            >
                              {TICKET_FILTERS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => fetchTickets(selectedId, ticketFilter)}
                              className="pressable inline-flex items-center gap-2 rounded-xl px-3 py-2 font-sans text-sm font-bold"
                              style={{ background: 'rgba(255,184,0,0.16)', color: '#8a5a00' }}
                            >
                              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
                            </button>
                          </div>
                        </div>

                        {ticketsLoading ? (
                          <div className="mt-4 space-y-2 animate-pulse">
                            <div className="h-14 rounded-lg bg-[var(--color-border-light)]" />
                            <div className="h-14 rounded-lg bg-[var(--color-border-light)]" />
                            <div className="h-14 rounded-lg bg-[var(--color-border-light)]" />
                          </div>
                        ) : tickets.length === 0 ? (
                          <p className="mt-6 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            No tickets match this filter yet.
                          </p>
                        ) : (
                          <ul className="mt-4 divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                            {tickets.map((ticket) => {
                              const meta = getTicketStatusMeta(ticket.status)
                              const buyer = ticket.user
                              const buyerName = [buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ') || 'Guest'
                              return (
                                <li key={ticket._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                  <div className="min-w-0">
                                    <p className="font-sans text-sm font-bold" style={{ color: 'var(--color-text-base)' }}>
                                      {buyerName}
                                    </p>
                                    <p className="font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                      {buyer?.email || 'No email'} · {ticket.tierId?.name || 'Ticket'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-sans text-sm font-bold" style={{ color: 'var(--color-text-base)' }}>
                                      {formatCurrency(ticket.priceAtPurchase)}
                                    </span>
                                    <span
                                      className="rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold"
                                      style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
                                    >
                                      {meta.label}
                                    </span>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )}

                    {activeSection === 'settings' && (
                      <EventSettingsForm
                        event={detail.event}
                        onSaved={() => refreshAll()}
                        disabled={['live', 'completed', 'cancelled'].includes(detail.event.status)}
                      />
                    )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  )
}

export default OrganizerDashboard
