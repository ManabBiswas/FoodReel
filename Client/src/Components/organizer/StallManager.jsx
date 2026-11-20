import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { Check, X, Loader2, Store, MapPin, Clock, MessageSquareText } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS } from '../../config/Api'

const APP_STATUS = {
  pending: { label: 'Pending review', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  approved: { label: 'Approved', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
}

const metaLine = (Icon, text) =>
  text ? (
    <span className="inline-flex items-start gap-1.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {text}
    </span>
  ) : null

/**
 * Stall applications for one event: the organizer reviews them exactly like
 * the admin flow does (same shared helper on the server). Self-fetches its
 * list — stall data is not part of the organizer event detail payload.
 */
const StallManager = ({ eventId }) => {
  const [stalls, setStalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(API_ENDPOINTS.foodfest.organizerEventStalls(eventId), {
        withCredentials: true
      })
      setStalls(data.stalls ?? [])
    } catch (err) {
      showError(err?.response?.data?.message || 'Could not load stall applications')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (stall, decision) => {
    if (decision === 'rejected' && !rejectReason.trim()) {
      showError('A rejection reason is required')
      return
    }
    setBusyId(stall._id)
    try {
      await axios.post(
        API_ENDPOINTS.foodfest.organizerStallDecision(eventId, stall._id),
        { decision, reason: rejectReason.trim() || undefined },
        { withCredentials: true }
      )
      showSuccess(decision === 'approved' ? 'Application approved' : 'Application rejected')
      setRejectingId(null)
      setRejectReason('')
      await load()
    } catch (err) {
      showError(err?.response?.data?.message || 'Could not save the decision')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading stall applications
      </div>
    )
  }

  if (stalls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white/60 p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe8cc]">
          <Store className="h-6 w-6 text-[#e55a00]" aria-hidden="true" />
        </span>
        <p className="mt-3 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
          No stall applications yet
        </p>
        <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Partners apply from their dashboard once this event is published.
        </p>
      </div>
    )
  }

  return (
    <section aria-label="Stall applications">
      <div className="mb-4">
        <h2 className="font-serif text-2xl font-black tracking-[-0.02em]" style={{ color: 'var(--color-text-base)' }}>
          Stall applications
        </h2>
        <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Approve the kitchens that can set up at this event. Approved stalls appear on the public event page.
        </p>
      </div>

      <ul className="space-y-3">
        {stalls.map((stall) => {
          const status = APP_STATUS[stall.status] || APP_STATUS.pending
          const partner = stall.foodPartner
          const isRejecting = rejectingId === stall._id
          const busy = busyId === stall._id

          return (
            <li
              key={stall._id}
              className="org-stall-card rounded-2xl border border-[var(--color-border-light)] bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
                      {partner?.companyName || 'Unknown partner'}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold"
                      style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}
                    >
                      {status.label}
                    </span>
                    {stall.status === 'approved' ? (
                      <span
                        className="rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold"
                        style={{
                          background: stall.isOpen ? '#DCFCE7' : '#F3F4F6',
                          color: stall.isOpen ? '#15803D' : '#6B7280'
                        }}
                      >
                        {stall.isOpen ? 'Stall open' : 'Stall closed'}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {partner?.email}
                    {stall.appliedAt ? ` · Applied ${new Date(stall.appliedAt).toLocaleDateString()}` : ''}
                    {stall.proposedItems?.length ? ` · ${stall.proposedItems.length} menu item(s)` : ''}
                    {stall.status === 'approved' && stall.ratingCount
                      ? ` · ★ ${stall.rating} (${stall.ratingCount} review${stall.ratingCount > 1 ? 's' : ''})`
                      : ''}
                  </p>

                  <div className="mt-2 flex flex-col gap-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {metaLine(MapPin, stall.position)}
                    {metaLine(Clock, stall.timings)}
                    {metaLine(MessageSquareText, stall.conditions)}
                  </div>

                  {stall.status === 'rejected' && stall.rejectionReason ? (
                    <p className="mt-2 rounded-lg bg-[#fef2f2] px-3 py-2 font-sans text-xs" style={{ color: '#991B1B' }}>
                      Rejection reason: {stall.rejectionReason}
                    </p>
                  ) : null}
                </div>

                {stall.status === 'pending' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => decide(stall, 'approved')}
                      disabled={busy}
                      className="pressable inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-sans text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ background: '#DCFCE7', color: '#15803D' }}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(isRejecting ? null : stall._id)
                        setRejectReason('')
                      }}
                      disabled={busy}
                      className="pressable inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-sans text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#b91c1c' }}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>

              {isRejecting ? (
                <div className="mt-3 rounded-xl border border-[var(--color-border-light)] bg-[#fffafa] p-3">
                  <label
                    className="mb-1.5 block font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]"
                    htmlFor={`reject-${stall._id}`}
                  >
                    Rejection reason (required)
                  </label>
                  <textarea
                    id={`reject-${stall._id}`}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="e.g. Menu duplicates an approved stall"
                    className="w-full resize-none rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2 font-sans text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => decide(stall, 'rejected')}
                      disabled={busy}
                      className="pressable inline-flex items-center gap-1 rounded-xl bg-[#dc2626] px-3.5 py-2 font-sans text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                      Confirm rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null)
                        setRejectReason('')
                      }}
                      disabled={busy}
                      className="pressable inline-flex items-center gap-1 rounded-xl border border-[var(--color-border-medium)] bg-white px-3.5 py-2 font-sans text-xs font-bold text-[var(--color-text-muted)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default StallManager
