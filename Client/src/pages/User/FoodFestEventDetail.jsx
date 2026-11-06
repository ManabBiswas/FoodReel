import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import PurchaseModal from '../../Components/foodfest/PurchaseModal'
import { API_ENDPOINTS } from '../../config/Api'
import { useAuth } from '../../hooks/useAuth'
import { useNow } from '../../hooks/useNow'
import { swrFetcher } from '../../utils/fetcher'
import { showWarning } from '../../utils/toast'
import {
  formatCurrency,
  formatDateRange,
  formatTimeRange,
  getEventSalesState,
  getTierAvailability,
  getTierSalesState,
} from '../../utils/foodfest'
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days'
import Clock from 'lucide-react/dist/esm/icons/clock'
import MapPin from 'lucide-react/dist/esm/icons/map-pin'
import Ticket from 'lucide-react/dist/esm/icons/ticket'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw'
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'

const salesTone = (onSale) =>
  onSale
    ? { background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D' }
    : { background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280' }

const TierCard = ({ tier, eventSales, now, isAuthenticated, authType, onBuy }) => {
  const availability = getTierAvailability(tier)
  const tierSales = getTierSalesState(tier, now)
  const soldOut = availability <= 0
  const blocked = soldOut || !eventSales.onSale || !tierSales.onSale

  let label = 'Buy ticket'
  if (soldOut) label = 'Sold out'
  else if (!eventSales.onSale) label = eventSales.label
  else if (!tierSales.onSale) label = tierSales.label
  else if (!isAuthenticated) label = 'Sign in to buy'
  else if (authType !== 'user') label = 'User account required'

  const disabled = blocked || (isAuthenticated && authType !== 'user')

  const taken = (tier.sold || 0) + (tier.reserved || 0)
  const percent = tier.quantity > 0 ? Math.min(100, Math.round((taken / tier.quantity) * 100)) : 100
  const barColor = percent >= 95 ? '#DC2626' : percent >= 80 ? '#D97706' : 'var(--color-primary)'

  return (
    <article
      className="flex h-full flex-col rounded-2xl p-5"
      style={{
        background: 'var(--color-background-white)',
        border: '1px solid var(--color-border-light)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl font-bold leading-tight" style={{ color: 'var(--color-text-base)' }}>
          {tier.name}
        </h3>
        <p className="shrink-0 font-serif text-2xl font-black" style={{ color: 'var(--color-primary)' }}>
          {formatCurrency(tier.price)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold font-sans" style={salesTone(tierSales.onSale)}>
          {tierSales.label}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold font-sans"
          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
        >
          {availability > 0 ? `${availability} left` : 'Sold out'}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: barColor }} />
        </div>
        <p className="mt-1.5 text-[11px] font-sans" style={{ color: 'var(--color-text-faint)' }}>
          {taken} of {tier.quantity} claimed
        </p>
      </div>

      <button
        type="button"
        onClick={() => onBuy(tier)}
        disabled={disabled}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold font-sans transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: disabled ? 'var(--color-surface-muted)' : 'var(--color-primary)', color: disabled ? 'var(--color-text-muted)' : '#fff' }}
      >
        <Ticket className="h-4 w-4" />
        {label}
      </button>
    </article>
  )
}

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-2xl ${className}`} style={{ background: 'var(--color-surface-muted)' }} />
)

const FoodFestEventDetail = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, authType } = useAuth()
  const now = useNow(30000)
  const [selectedTier, setSelectedTier] = useState(null)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    eventId ? API_ENDPOINTS.foodfest.event(eventId) : null,
    swrFetcher,
    {
      refreshInterval: 20000,
      revalidateOnFocus: false,
    }
  )

  const event = data?.event
  const tiers = data?.tiers ?? []
  const eventSales = getEventSalesState(event, now)
  const notFound = error?.response?.status === 404

  const handleBuy = (tier) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${eventId}` } })
      return
    }
    if (authType !== 'user') {
      showWarning('Sign in with a user account to buy tickets.')
      return
    }
    setSelectedTier(tier)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm font-bold font-sans transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <SkeletonBlock className="h-80" />
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonBlock className="h-52" />
              <SkeletonBlock className="h-52" />
            </div>
          </div>
        ) : error ? (
          <div
            className="mt-6 flex flex-col items-center rounded-2xl px-6 py-16 text-center"
            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
          >
            <Ticket className="h-10 w-10" style={{ color: 'var(--color-text-faint)' }} />
            <h1 className="mt-4 font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
              {notFound ? 'This event is not available' : 'Event could not be loaded'}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
              {notFound
                ? 'It may have ended, been cancelled, or not been published yet.'
                : 'Check your connection and try again.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {!notFound ? (
                <button
                  type="button"
                  onClick={() => mutate()}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              ) : null}
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans"
                style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }}
              >
                Browse events
              </Link>
            </div>
          </div>
        ) : event ? (
          <>
            <section
              className="mt-6 overflow-hidden rounded-3xl"
              style={{
                background: 'var(--color-background-white)',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-[240px] lg:min-h-[380px]">
                  {event.bannerImage ? (
                    <img
                      src={event.bannerImage}
                      alt={event.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                      }}
                    >
                      <Ticket className="h-20 w-20 text-white/80" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-sans"
                      style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
                    >
                      FoodFest
                    </span>
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-sans" style={salesTone(eventSales.onSale)}>
                      {eventSales.label}
                    </span>
                    {event.status === 'live' ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-sans" style={{ background: 'rgba(255,184,0,0.18)', color: 'var(--color-primary-dark)' }}>
                        <Sparkles className="h-3 w-3" />
                        Live
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-4 font-serif text-3xl font-black leading-tight sm:text-4xl" style={{ color: 'var(--color-text-base)' }}>
                    {event.name}
                  </h1>

                  {event.description ? (
                    <p className="mt-3 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
                      {event.description}
                    </p>
                  ) : null}

                  <dl className="mt-6 space-y-3 text-sm font-sans">
                    <div className="flex items-start gap-2.5">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <dt className="sr-only">Dates</dt>
                        <dd style={{ color: 'var(--color-text-base)' }}>
                          {formatDateRange(event.startTime, event.endTime)}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <dt className="sr-only">Time</dt>
                        <dd style={{ color: 'var(--color-text-base)' }}>
                          {formatTimeRange(event.startTime, event.endTime)}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <dt className="sr-only">Venue</dt>
                        <dd style={{ color: 'var(--color-text-base)' }}>
                          {[event.venue?.address, event.venue?.city].filter(Boolean).join(', ') ||
                            'Venue to be announced'}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                    Tickets
                  </h2>
                  <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                    Choose a tier to continue. Availability updates automatically.
                  </p>
                </div>

                {isValidating ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Updating
                  </span>
                ) : null}
              </div>

              {!eventSales.onSale ? (
                <p className="mt-3 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                  {eventSales.label}. Ticket sales are not open right now.
                </p>
              ) : null}

              {tiers.length === 0 ? (
                <div
                  className="mt-5 rounded-2xl px-6 py-12 text-center"
                  style={{ background: 'var(--color-background-white)', border: '1px dashed var(--color-border-medium)' }}
                >
                  <Ticket className="mx-auto h-8 w-8" style={{ color: 'var(--color-text-faint)' }} />
                  <p className="mt-3 font-serif text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                    No ticket tiers are on sale
                  </p>
                  <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                    Check back soon or browse the other FoodFest events.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {tiers.map((tier) => (
                    <TierCard
                      key={tier._id}
                      tier={tier}
                      eventSales={eventSales}
                      now={now}
                      isAuthenticated={isAuthenticated}
                      authType={authType}
                      onBuy={handleBuy}
                    />
                  ))}
                </div>
              )}

              {!isAuthenticated ? (
                <p className="mt-4 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                  You will be asked to sign in before payment.
                </p>
              ) : null}
            </section>
          </>
        ) : null}
      </main>

      <Footer />

      {selectedTier ? (
        <PurchaseModal
          key={selectedTier._id}
          event={event}
          tier={selectedTier}
          onClose={() => setSelectedTier(null)}
        />
      ) : null}
    </div>
  )
}

export default FoodFestEventDetail
