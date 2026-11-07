import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import axios from 'axios'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import ModalShell from '../../Components/foodfest/ModalShell'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { swrFetcher } from '../../utils/fetcher'
import { extractApiError, showError, showSuccess } from '../../utils/toast'
import { formatCurrency, formatDateRange, formatDateTime } from '../../utils/foodfest'
import { CalendarDays, MapPin, Store, Utensils, Plus, RefreshCw, LoaderCircle, CircleCheck, CircleX, CircleAlert, Check } from 'lucide-react'

const APP_STATUS = {
  pending: { label: 'Pending review', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  approved: { label: 'Approved', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
}

const appStatusMeta = (status) =>
  APP_STATUS[status] || { label: status || 'Unknown', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' }

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'

const ApplyModal = ({ event, foods, onClose, onApplied }) => {
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggleItem = (foodId) => {
    setSelected((current) =>
      current.includes(foodId) ? current.filter((id) => id !== foodId) : [...current, foodId]
    )
  }

  const submit = async () => {
    if (selected.length === 0) {
      setError('Choose at least one food item for your stall.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await axios.post(
        API_ENDPOINTS.foodfest.partnerApply(event._id),
        { proposedItems: selected },
        axiosConfig
      )
      showSuccess('Stall application submitted.')
      onApplied()
    } catch (err) {
      setError(extractApiError(err, 'Could not submit the stall application.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title={`Apply to ${event.name}`} onClose={onClose} busy={submitting} maxWidth="max-w-xl">
      <div className="space-y-5">
        <div>
          <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
            Choose your food items
          </h3>
          <p className="mt-1 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
            Pick the dishes you want to sell at this event. The organiser reviews every application.
          </p>
        </div>

        {foods.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-8 text-center"
            style={{ background: 'var(--color-surface-muted)', border: '1px dashed var(--color-border-medium)' }}
          >
            <Utensils className="mx-auto h-8 w-8" style={{ color: 'var(--color-text-faint)' }} />
            <p className="mt-3 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
              No food posts yet
            </p>
            <p className="mt-1 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
              Add at least one food post before applying for a stall.
            </p>
            <Link
              to="/CreateFood"
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold font-sans"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <Plus className="h-4 w-4" />
              Create a food post
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {foods.map((food) => {
              const isSelected = selected.includes(food._id)

              return (
                <label
                  key={food._id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
                  style={{
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-light)',
                    background: isSelected ? 'rgba(255,106,0,0.06)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(food._id)}
                    className="h-4 w-4 shrink-0"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />

                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'var(--color-surface-muted)' }}
                    >
                      <Utensils className="h-5 w-5" style={{ color: 'var(--color-text-faint)' }} />
                    </div>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>
                      {food.name}
                    </span>
                    {food.price !== undefined && food.price !== null ? (
                      <span className="block text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                        {formatCurrency(food.price)}
                      </span>
                    ) : null}
                  </span>

                  {isSelected ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </label>
              )
            })}
          </div>
        )}

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl px-4 py-3"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#DC2626' }} />
            <p className="text-sm leading-relaxed font-sans" style={{ color: '#991B1B' }}>
              {error}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={submit}
            disabled={submitting || foods.length === 0 || selected.length === 0}
            className={`${primaryButton} flex-1`}
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
            {submitting ? 'Submitting...' : `Apply with ${selected.length} item${selected.length === 1 ? '' : 's'}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`${primaryButton} flex-1`}
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

const EventSkeleton = () => (
  <div
    className="animate-pulse rounded-2xl p-5"
    style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
  >
    <div className="h-3 w-24 rounded" style={{ background: 'var(--color-surface-muted)' }} />
    <div className="mt-3 h-6 w-2/3 rounded" style={{ background: 'var(--color-surface-muted)' }} />
    <div className="mt-3 h-3 w-40 rounded" style={{ background: 'var(--color-surface-muted)' }} />
    <div className="mt-6 h-10 w-full rounded-xl" style={{ background: 'var(--color-surface-muted)' }} />
  </div>
)

const ErrorBox = ({ message, onRetry }) => (
  <div
    className="flex flex-col items-center rounded-2xl px-6 py-10 text-center"
    style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
  >
    <CircleAlert className="h-9 w-9" style={{ color: '#DC2626' }} />
    <p className="mt-3 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
      {message}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold font-sans"
      style={{ background: 'var(--color-primary)', color: '#fff' }}
    >
      <RefreshCw className="h-4 w-4" />
      Retry
    </button>
  </div>
)

const StallApplications = () => {
  const [applyEvent, setApplyEvent] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const {
    data: eventsData,
    error: eventsError,
    isLoading: eventsLoading,
    mutate: mutateEvents,
  } = useSWR(API_ENDPOINTS.foodfest.partnerAvailableEvents, swrFetcher, {
    revalidateOnFocus: false,
  })

  const {
    data: appsData,
    error: appsError,
    isLoading: appsLoading,
    mutate: mutateApps,
  } = useSWR(API_ENDPOINTS.foodfest.partnerMyApplications, swrFetcher, {
    revalidateOnFocus: false,
  })

  const { data: foodsData, isLoading: foodsLoading } = useSWR(
    `${API_ENDPOINTS.food.myPosts}?postType=food`,
    swrFetcher,
    { revalidateOnFocus: false }
  )

  const events = Array.isArray(eventsData?.events) ? eventsData.events : []
  const applications = Array.isArray(appsData?.applications) ? appsData.applications : []
  const foods = (Array.isArray(foodsData?.foods) ? foodsData.foods : []).filter(
    (food) => food.postType === 'food'
  )

  const handleApplied = useCallback(() => {
    setApplyEvent(null)
    Promise.allSettled([mutateEvents(), mutateApps()])
  }, [mutateEvents, mutateApps])

  const toggleOpen = useCallback(
    async (application) => {
      const nextOpen = !application.isOpen
      setTogglingId(application._id)

      const applyOpen = (current, open) => ({
        ...current,
        applications: (current?.applications || []).map((item) =>
          item._id === application._id ? { ...item, isOpen: open } : item
        ),
      })

      try {
        await mutateApps(
          async (current) => {
            const { data } = await axios.patch(
              API_ENDPOINTS.foodfest.partnerToggleStall(application._id),
              {},
              axiosConfig
            )
            return applyOpen(current, data?.isOpen ?? nextOpen)
          },
          {
            optimisticData: (current) => applyOpen(current, nextOpen),
            rollbackOnError: true,
            revalidate: false,
            populateCache: true,
          }
        )
        showSuccess(nextOpen ? 'Stall marked open.' : 'Stall marked closed.')
      } catch (err) {
        showError(extractApiError(err, 'Could not update the stall.'))
      } finally {
        setTogglingId(null)
      }
    },
    [mutateApps]
  )

  const showFoodNotice = !foodsLoading && foods.length === 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-sans"
            style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
          >
            FoodFest for partners
          </span>
          <h1 className="mt-3 font-serif text-3xl font-black leading-tight sm:text-4xl" style={{ color: 'var(--color-text-base)' }}>
            Stall applications
          </h1>
          <p className="mt-2 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
            Apply to open a stall at an upcoming FoodFest, then toggle it open when you are ready
            to serve on event day.
          </p>
        </header>

        {showFoodNotice ? (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
            style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}
          >
            <p className="text-sm font-sans" style={{ color: '#92400E' }}>
              You need at least one food post before you can apply for a stall.
            </p>
            <Link
              to="/CreateFood"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold font-sans"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create a food post
            </Link>
          </div>
        ) : null}

        <section className="mt-10" aria-labelledby="open-events-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="open-events-heading" className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                Open events
              </h2>
              <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                Published events you have not applied to yet.
              </p>
            </div>
            <span className="text-xs font-bold font-sans" style={{ color: 'var(--color-text-faint)' }}>
              {events.length} available
            </span>
          </div>

          {eventsLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
            </div>
          ) : eventsError ? (
            <div className="mt-5">
              <ErrorBox message={extractApiError(eventsError, 'Open events could not be loaded.')} onRetry={() => mutateEvents()} />
            </div>
          ) : events.length === 0 ? (
            <div
              className="mt-5 rounded-2xl px-6 py-12 text-center"
              style={{ background: 'var(--color-background-white)', border: '1px dashed var(--color-border-medium)' }}
            >
              <Store className="mx-auto h-9 w-9" style={{ color: 'var(--color-text-faint)' }} />
              <p className="mt-3 font-serif text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                No open events right now
              </p>
              <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                New events appear here when the organiser opens applications.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <article
                  key={event._id}
                  className="flex h-full flex-col rounded-2xl p-5"
                  style={{
                    background: 'var(--color-background-white)',
                    border: '1px solid var(--color-border-light)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest font-sans" style={{ color: 'var(--color-primary)' }}>
                    Applications open
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-bold leading-tight" style={{ color: 'var(--color-text-base)' }}>
                    {event.name}
                  </h3>

                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateRange(event.startTime, event.endTime) || 'Dates unavailable'}
                  </p>

                  <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {[event.venue?.address, event.venue?.city].filter(Boolean).join(', ') ||
                        'Venue to be announced'}
                    </span>
                  </p>

                  {event.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
                      {event.description}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setApplyEvent(event)}
                    className={`${primaryButton} mt-5 w-full`}
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    <Store className="h-4 w-4" />
                    Apply for a stall
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12" aria-labelledby="applications-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="applications-heading" className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                Your applications
              </h2>
              <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                Approved stalls can be opened and closed from here.
              </p>
            </div>
            <span className="text-xs font-bold font-sans" style={{ color: 'var(--color-text-faint)' }}>
              {applications.length} total
            </span>
          </div>

          {appsLoading ? (
            <div className="mt-5 space-y-4">
              <EventSkeleton />
              <EventSkeleton />
            </div>
          ) : appsError ? (
            <div className="mt-5">
              <ErrorBox message={extractApiError(appsError, 'Your applications could not be loaded.')} onRetry={() => mutateApps()} />
            </div>
          ) : applications.length === 0 ? (
            <div
              className="mt-5 rounded-2xl px-6 py-12 text-center"
              style={{ background: 'var(--color-background-white)', border: '1px dashed var(--color-border-medium)' }}
            >
              <Store className="mx-auto h-9 w-9" style={{ color: 'var(--color-text-faint)' }} />
              <p className="mt-3 font-serif text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                No applications yet
              </p>
              <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                Apply to an open event above and track its status here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {applications.map((application) => {
                const meta = appStatusMeta(application.status)
                const event = application.eventId && typeof application.eventId === 'object' ? application.eventId : null

                return (
                  <article
                    key={application._id}
                    className="rounded-2xl p-5"
                    style={{
                      background: 'var(--color-background-white)',
                      border: '1px solid var(--color-border-light)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest font-sans" style={{ color: 'var(--color-text-faint)' }}>
                          Stall application
                        </p>
                        <h3 className="mt-1 font-serif text-xl font-bold leading-tight" style={{ color: 'var(--color-text-base)' }}>
                          {event?.name || 'Event unavailable'}
                        </h3>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDateRange(event?.startTime, event?.endTime) || 'Date unavailable'}
                        </p>
                      </div>

                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-bold font-sans"
                        style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                      <span>
                        {application.proposedItems?.length || 0} food item
                        {(application.proposedItems?.length || 0) === 1 ? '' : 's'}
                      </span>
                      <span>Applied {formatDateTime(application.appliedAt || application.createdAt)}</span>
                    </div>

                    {application.status === 'rejected' && application.rejectionReason ? (
                      <p
                        className="mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed font-sans"
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}
                      >
                        <span className="font-bold">Reason:</span> {application.rejectionReason}
                      </p>
                    ) : null}

                    {application.status === 'approved' ? (
                      <div
                        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3"
                        style={{ background: 'var(--color-surface-muted)' }}
                      >
                        <div>
                          <p className="text-sm font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>
                            {application.isOpen ? 'Stall is open' : 'Stall is closed'}
                          </p>
                          <p className="text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                            Toggle this when you are ready to serve.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(application.isOpen)}
                          onClick={() => toggleOpen(application)}
                          disabled={togglingId === application._id}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold font-sans transition-colors disabled:opacity-50"
                          style={{
                            background: application.isOpen ? '#DCFCE7' : 'var(--color-background-white)',
                            border: `1px solid ${application.isOpen ? '#86EFAC' : 'var(--color-border-medium)'}`,
                            color: application.isOpen ? '#15803D' : 'var(--color-text-muted)',
                          }}
                        >
                          {togglingId === application._id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : application.isOpen ? (
                            <CircleCheck className="h-4 w-4" />
                          ) : (
                            <CircleX className="h-4 w-4" />
                          )}
                          {application.isOpen ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {applyEvent ? (
        <ApplyModal
          key={applyEvent._id}
          event={applyEvent}
          foods={foods}
          onClose={() => setApplyEvent(null)}
          onApplied={handleApplied}
        />
      ) : null}
    </div>
  )
}

export default StallApplications
