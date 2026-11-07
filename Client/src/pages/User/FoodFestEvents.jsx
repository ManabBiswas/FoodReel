import React from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import { API_ENDPOINTS } from '../../config/Api'
import { swrFetcher } from '../../utils/fetcher'
import { formatDateRange } from '../../utils/foodfest'
import { CalendarDays, MapPin, Ticket, ArrowRight, RefreshCw, Film, Sparkles } from 'lucide-react'

const EventCard = ({ event }) => (
  <Link
    to={`/events/${event._id}`}
    className="group flex h-full flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg"
    style={{
      background: 'var(--color-background-white)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div className="relative h-48 overflow-hidden">
      {event.bannerImage ? (
        <img
          src={event.bannerImage}
          alt={event.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
          }}
        >
          <Ticket className="h-14 w-14 text-white/80" />
        </div>
      )}
      <span
        className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider font-sans"
        style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
      >
        FoodFest
      </span>
    </div>

    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-3 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDateRange(event.startTime, event.endTime)}
        </span>
        {event.venue?.city && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {event.venue.city}
          </span>
        )}
      </div>

      <h2 className="font-serif text-xl font-bold leading-tight" style={{ color: 'var(--color-text-base)' }}>
        {event.name}
      </h2>

      {event.description && (
        <p className="line-clamp-2 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
          {event.description}
        </p>
      )}

      {event.venue?.address && (
        <p className="line-clamp-1 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
          {event.venue.address}
        </p>
      )}

      <span
        className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-bold font-sans"
        style={{ color: 'var(--color-primary)' }}
      >
        View tickets
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  </Link>
)

const SkeletonCard = () => (
  <div
    className="overflow-hidden rounded-2xl animate-pulse"
    style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
  >
    <div className="h-48" style={{ background: 'var(--color-surface-muted)' }} />
    <div className="space-y-3 p-5">
      <div className="h-3 w-2/3 rounded" style={{ background: 'var(--color-surface-muted)' }} />
      <div className="h-5 w-4/5 rounded" style={{ background: 'var(--color-surface-muted)' }} />
      <div className="h-3 w-full rounded" style={{ background: 'var(--color-surface-muted)' }} />
      <div className="h-3 w-1/2 rounded" style={{ background: 'var(--color-surface-muted)' }} />
    </div>
  </div>
)

const EmptyState = () => (
  <div
    className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
    style={{ background: 'var(--color-background-white)', border: '1px dashed var(--color-border-medium)' }}
  >
    <div
      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
      style={{ background: 'rgba(255,106,0,0.1)' }}
    >
      <Ticket className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
    </div>
    <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
      No events are on sale yet
    </h2>
    <p className="mt-2 max-w-md text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
      New FoodFest dates will appear here as soon as tickets open. In the meantime, explore the reels feed.
    </p>
    <Link
      to="/reels"
      className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans"
      style={{ background: 'var(--color-primary)', color: '#fff' }}
    >
      <Film className="h-4 w-4" />
      Watch reels
    </Link>
  </div>
)

const FoodFestEvents = () => {
  const { data, error, isLoading, mutate } = useSWR(API_ENDPOINTS.foodfest.events, swrFetcher, {
    revalidateOnFocus: false,
  })

  const events = data?.events ?? []

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest font-sans"
            style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
          >
            FoodFest
          </span>
          <h1 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-5xl" style={{ color: 'var(--color-text-base)' }}>
            Find your next food festival
          </h1>
          <p className="mt-3 text-base leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
            Browse upcoming FoodFest events, compare ticket tiers, and keep every QR pass in one place.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/events/host"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
            >
              <Sparkles className="h-4 w-4" />
              Host an event
            </Link>
            <Link
              to="/events/organize"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans transition-colors"
              style={{ border: '1px solid var(--color-border-medium)', color: 'var(--color-text-base)' }}
            >
              Organizer studio
            </Link>
            <span className="text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
              Anyone can propose a festival — no partner account needed.
            </span>
          </div>
        </header>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center rounded-2xl px-6 py-14 text-center"
            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
          >
            <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
              Events could not be loaded
            </h2>
            <p className="mt-2 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
              Check your connection and try again.
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
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default FoodFestEvents
