import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { showSuccess, showError, showWarning } from '../../../utils/toast'
import { formatDateRange } from '../../../utils/foodfest'
import { API_ENDPOINTS } from '../../../config/Api'

const STATUS_STYLES = {
  draft: { bg: 'rgba(26,18,8,0.07)', color: '#6b6460', label: 'Draft' },
  published: { bg: 'rgba(255,106,0,0.12)', color: '#e55a00', label: 'Published' },
  live: { bg: 'rgba(22,163,74,0.12)', color: '#16a34a', label: 'Live' },
  completed: { bg: 'rgba(26,18,8,0.10)', color: '#1a1208', label: 'Completed' },
  cancelled: { bg: 'rgba(220,38,38,0.10)', color: '#dc2626', label: 'Cancelled' }
}

const EventManagementTab = ({ setError }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.foodfest.adminEventsList, {
        withCredentials: true
      })
      if (res.data?.success) {
        setEvents(res.data.events || [])
      } else {
        setError('Failed to load events')
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
      showError('Failed to load events')
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [setError])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const runAction = async (eventId, endpoint, confirmText, body = {}) => {
    if (!window.confirm(confirmText)) return

    setBusyId(eventId)
    try {
      const res = await axios.patch(endpoint, body, { withCredentials: true })
      if (res.data?.success) {
        showSuccess(res.data.message || 'Event updated')
        if (res.data.warnings?.length) {
          res.data.warnings.forEach((warning) => showWarning(warning))
        }
        fetchEvents()
      } else {
        showError(res.data?.message || 'Action failed')
      }
    } catch (err) {
      console.error('Event action error:', err)
      showError(err?.response?.data?.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 animate-pulse sm:grid-cols-2">
          <div className="h-28 rounded-2xl bg-gray-100" />
          <div className="h-28 rounded-2xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No FoodFest events yet</p>
        <p className="mt-2 text-sm text-gray-400">
          Approve a user proposal to create the first draft event.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {events.map((event) => {
          const meta = STATUS_STYLES[event.status] || STATUS_STYLES.draft
          const busy = busyId === event._id
          return (
            <div
              key={event._id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      {event.name}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                      {event.organizerType === 'user' ? 'User-hosted' : 'Admin'}
                    </span>
                    {event.organizerType === 'user' && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{
                          background: event.organizerAccess ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
                          color: event.organizerAccess ? '#16a34a' : '#dc2626'
                        }}
                      >
                        {event.organizerAccess ? 'Organizer access' : 'Access revoked'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {event.venue?.address}, {event.venue?.city}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
                    {formatDateRange(event.startTime, event.endTime)}
                  </p>
                  {event.organizerNotes && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text-faint)]">Host notes: </span>
                      {event.organizerNotes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.organizerType === 'user' && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        runAction(
                          event._id,
                          API_ENDPOINTS.foodfest.adminOrganizerAccess(event._id),
                          event.organizerAccess
                            ? `Revoke organizer access for "${event.name}"? The host will no longer be able to manage it.`
                            : `Grant organizer access for "${event.name}"? The host will be able to manage tiers, zones, and sales.`,
                          { granted: !event.organizerAccess }
                        )
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                        event.organizerAccess
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {event.organizerAccess ? 'Revoke access' : 'Grant access'}
                    </button>
                  )}
                  {event.status === 'draft' && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        runAction(
                          event._id,
                          API_ENDPOINTS.foodfest.adminPublishEvent(event._id),
                          `Publish "${event.name}"? It will appear on the public events page.`
                        )
                      }
                      className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-200 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  )}
                  {event.status === 'published' && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        runAction(
                          event._id,
                          API_ENDPOINTS.foodfest.adminGoLive(event._id),
                          `Mark "${event.name}" as live?`
                        )
                      }
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
                    >
                      Go live
                    </button>
                  )}
                  {(event.status === 'published' || event.status === 'live') && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        runAction(
                          event._id,
                          API_ENDPOINTS.foodfest.adminCompleteEvent(event._id),
                          `Mark "${event.name}" as completed?`
                        )
                      }
                      className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EventManagementTab