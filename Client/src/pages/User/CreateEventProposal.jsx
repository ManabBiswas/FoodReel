import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { showSuccess, showError, showWarning } from '../../utils/toast'
import { API_ENDPOINTS } from '../../config/Api'
import { formatDate } from '../../utils/foodfest'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import ErrorBoundary from '../../Components/ErrorBoundary'
import { Loader2, CalendarDays, MapPin, Sparkles, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react'

const initialForm = {
  name: '',
  description: '',
  venueAddress: '',
  venueCity: '',
  venueGpsLoc: '',
  startTime: '',
  endTime: '',
  salesStart: '',
  salesEnd: '',
  bannerImage: '',
  otherInfo: ''
}

const STATUS_META = {
  pending: { label: 'In review', icon: Clock, bg: 'rgba(255,184,0,0.14)', color: '#9a6b00' },
  approved: { label: 'Approved', icon: CheckCircle2, bg: 'rgba(34,197,94,0.14)', color: '#15803d' },
  rejected: { label: 'Not approved', icon: XCircle, bg: 'rgba(239,68,68,0.12)', color: '#b91c1c' }
}

const CreateEventProposal = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [proposals, setProposals] = useState([])
  const [proposalsLoading, setProposalsLoading] = useState(true)

  const fetchProposals = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.foodfest.myProposals, {
        withCredentials: true
      })
      if (res.data?.success) {
        setProposals(res.data.proposals || [])
      }
    } catch (err) {
      console.error('Failed to load proposals:', err)
    } finally {
      setProposalsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const setField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const required = [
      ['name', 'Event name'],
      ['venueAddress', 'Venue address'],
      ['venueCity', 'Venue city'],
      ['venueGpsLoc', 'GPS location'],
      ['startTime', 'Event start'],
      ['endTime', 'Event end'],
      ['salesStart', 'Sales start'],
      ['salesEnd', 'Sales end']
    ]

    for (const [field, label] of required) {
      if (!form[field]?.trim()) {
        showWarning(`${label} is required`)
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        venue: {
          address: form.venueAddress.trim(),
          city: form.venueCity.trim(),
          gpsLoc: form.venueGpsLoc.trim()
        },
        startTime: form.startTime,
        endTime: form.endTime,
        salesStart: form.salesStart,
        salesEnd: form.salesEnd,
        bannerImage: form.bannerImage.trim() || undefined,
        otherInfo: form.otherInfo.trim() || undefined
      }

      const res = await axios.post(API_ENDPOINTS.foodfest.proposals, payload, {
        withCredentials: true
      })

      if (res.data?.success) {
        showSuccess(res.data.message || 'Proposal submitted for review')
        setForm(initialForm)
        fetchProposals()
      } else {
        showError(res.data?.message || 'Failed to submit proposal')
      }
    } catch (err) {
      console.error('Proposal submit error:', err)
      showError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to submit proposal'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border px-4 py-3 font-sans text-sm outline-none transition-colors focus:border-[var(--color-primary)]'
  const labelClass =
    'mb-2 block font-sans text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 font-sans text-sm font-semibold"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <header className="mb-10">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Host with FoodReel
          </span>
          <h1
            className="mt-4 font-serif text-4xl font-black leading-tight sm:text-5xl"
            style={{ color: 'var(--color-text-base)' }}
          >
            Propose an event
          </h1>
          <p
            className="mt-3 max-w-xl font-sans text-base leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Tell us what you want to host. Our team reviews every proposal and gets
            back to you once it is approved.
          </p>
          <Link
            to="/events/organize"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-sans text-sm font-bold"
            style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
          >
            <Sparkles className="h-4 w-4" />
            Open organizer studio
          </Link>
        </header>

        <ErrorBoundary>
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl p-6 sm:p-8"
            style={{
              background: 'var(--color-background-white)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <label className={labelClass} htmlFor="proposal-name">Event name</label>
              <input
                id="proposal-name"
                value={form.name}
                onChange={setField('name')}
                className={inputClass}
                style={{ borderColor: 'var(--color-border-medium)' }}
                placeholder="e.g. Summer Street Food Festival"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="proposal-description">Description</label>
              <textarea
                id="proposal-description"
                value={form.description}
                onChange={setField('description')}
                rows={4}
                className={inputClass}
                style={{ borderColor: 'var(--color-border-medium)' }}
                placeholder="What should visitors expect? Food, music, stalls, activities..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="proposal-venue-address">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Venue address
                  </span>
                </label>
                <input
                  id="proposal-venue-address"
                  value={form.venueAddress}
                  onChange={setField('venueAddress')}
                  className={inputClass}
                  style={{ borderColor: 'var(--color-border-medium)' }}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="proposal-venue-city">City</label>
                <input
                  id="proposal-venue-city"
                  value={form.venueCity}
                  onChange={setField('venueCity')}
                  className={inputClass}
                  style={{ borderColor: 'var(--color-border-medium)' }}
                  placeholder="City"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="proposal-venue-gps">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> GPS location
                </span>
              </label>
              <input
                id="proposal-venue-gps"
                value={form.venueGpsLoc}
                onChange={setField('venueGpsLoc')}
                className={inputClass}
                style={{ borderColor: 'var(--color-border-medium)' }}
                placeholder="Google Maps link or latitude,longitude"
              />
              <p className="mt-2 font-sans text-xs" style={{ color: 'var(--color-text-faint)' }}>
                Required so guests and stall partners can find the venue.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="proposal-other-info">Other information (optional)</label>
              <textarea
                id="proposal-other-info"
                value={form.otherInfo}
                onChange={setField('otherInfo')}
                rows={3}
                className={inputClass}
                style={{ borderColor: 'var(--color-border-medium)' }}
                placeholder="Expected footfall, stall requirements, permits, anything the review team should know..."
              />
            </div>

            <div>
              <p className={`${labelClass} inline-flex items-center gap-1.5`}>
                <CalendarDays className="h-3.5 w-3.5" /> Event window
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={setField('startTime')}
                    className={inputClass}
                    style={{ borderColor: 'var(--color-border-medium)' }}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={setField('endTime')}
                    className={inputClass}
                    style={{ borderColor: 'var(--color-border-medium)' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className={`${labelClass} inline-flex items-center gap-1.5`}>
                <CalendarDays className="h-3.5 w-3.5" /> Ticket sales window
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Sales open
                  </label>
                  <input
                    type="datetime-local"
                    value={form.salesStart}
                    onChange={setField('salesStart')}
                    className={inputClass}
                    style={{ borderColor: 'var(--color-border-medium)' }}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Sales close
                  </label>
                  <input
                    type="datetime-local"
                    value={form.salesEnd}
                    onChange={setField('salesEnd')}
                    className={inputClass}
                    style={{ borderColor: 'var(--color-border-medium)' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="proposal-banner">Banner image URL (optional)</label>
              <input
                id="proposal-banner"
                value={form.bannerImage}
                onChange={setField('bannerImage')}
                className={inputClass}
                style={{ borderColor: 'var(--color-border-medium)' }}
                placeholder="https://..."
              />
              <p className="mt-2 font-sans text-xs" style={{ color: 'var(--color-text-faint)' }}>
                You can add or change this later with our team.
              </p>
            </div>

            <div
              className="rounded-xl p-4 font-sans text-sm leading-relaxed"
              style={{ background: 'rgba(255,184,0,0.12)', color: 'var(--color-text-base)' }}
            >
              Once approved, you get organizer access to set up ticket tiers, venue
              zones, sales, and gate check-ins — all from your organizer studio.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-sans text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting proposal...
                </>
              ) : (
                'Submit proposal'
              )}
            </button>
          </form>
        </ErrorBoundary>

        <section className="mt-12">
          <h2
            className="font-serif text-2xl font-bold"
            style={{ color: 'var(--color-text-base)' }}
          >
            Your proposals
          </h2>

          {proposalsLoading ? (
            <div className="mt-4 space-y-3 animate-pulse">
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          ) : proposals.length === 0 ? (
            <p className="mt-2 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Nothing submitted yet. Your proposals will appear here with their review status.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {proposals.map((proposal) => {
                const meta = STATUS_META[proposal.status] || STATUS_META.pending
                const Icon = meta.icon
                return (
                  <li
                    key={proposal._id}
                    className="rounded-xl p-4"
                    style={{
                      background: 'var(--color-background-white)',
                      border: '1px solid var(--color-border-light)'
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className="font-serif text-lg font-bold"
                          style={{ color: 'var(--color-text-base)' }}
                        >
                          {proposal.name}
                        </p>
                        <p className="mt-0.5 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {proposal.venue?.city} · {formatDate(proposal.startTime)}
                        </p>
                        {proposal.status === 'approved' && proposal.eventId && (
                          <Link
                            to={`/events/organize?event=${proposal.eventId}`}
                            className="mt-2 inline-flex items-center gap-1.5 font-sans text-xs font-bold"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Manage event in organizer studio
                          </Link>
                        )}
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-bold"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default CreateEventProposal