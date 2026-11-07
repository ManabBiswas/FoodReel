import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, Save, MapPin, CalendarDays } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS } from '../../config/Api'

const toLocalInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toForm = (event) => ({
  name: event?.name || '',
  description: event?.description || '',
  venueAddress: event?.venue?.address || '',
  venueCity: event?.venue?.city || '',
  venueGpsLoc: event?.venue?.gpsLoc || '',
  venueMaxCapacity: event?.venue?.maxCapacity ?? '',
  startTime: toLocalInput(event?.startTime),
  endTime: toLocalInput(event?.endTime),
  salesStart: toLocalInput(event?.salesStart),
  salesEnd: toLocalInput(event?.salesEnd),
  bannerImage: event?.bannerImage || ''
})

const inputClass =
  'w-full rounded-xl border border-[var(--color-border-medium)] bg-white px-3.5 py-2.5 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-160 ease-out focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(255,106,0,0.18)]'
const labelClass =
  'mb-1.5 block font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]'

const EventSettingsForm = ({ event, onSaved, disabled }) => {
  const [form, setForm] = useState(() => toForm(event))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(toForm(event))
  }, [event])

  const setField = (field) => (event_) => {
    setForm((prev) => ({ ...prev, [field]: event_.target.value }))
  }

  const submit = async (event_) => {
    event_.preventDefault()

    if (!form.name.trim() || !form.venueAddress.trim() || !form.venueCity.trim()) {
      showError('Event name, venue address and city are required')
      return
    }

    setSaving(true)
    try {
      await axios.put(
        API_ENDPOINTS.foodfest.organizerEvent(event._id),
        {
          name: form.name.trim(),
          description: form.description.trim(),
          venue: {
            address: form.venueAddress.trim(),
            city: form.venueCity.trim(),
            gpsLoc: form.venueGpsLoc.trim(),
            maxCapacity: form.venueMaxCapacity === '' ? undefined : Number(form.venueMaxCapacity)
          },
          startTime: form.startTime,
          endTime: form.endTime,
          salesStart: form.salesStart,
          salesEnd: form.salesEnd,
          bannerImage: form.bannerImage.trim()
        },
        { withCredentials: true }
      )
      showSuccess('Event details saved')
      onSaved()
    } catch (err) {
      console.error('Event update error:', err)
      showError(err?.response?.data?.message || 'Could not save the event')
    } finally {
      setSaving(false)
    }
  }

  if (disabled) {
    return (
      <div
        className="rounded-2xl border border-[rgba(255,184,0,0.4)] bg-[rgba(255,184,0,0.12)] p-5 font-sans text-sm leading-relaxed"
        style={{ color: 'var(--color-text-base)' }}
      >
        Event details can only be changed while the event is a draft or published.
        Once it is live, contact the FoodReel team for changes.
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="panel-enter rounded-[28px] border border-[var(--color-border-light)] bg-white p-5 sm:p-6"
      aria-label="Event settings"
    >
      <div className="grid gap-4">
        <div>
          <label className={labelClass} htmlFor="organizer-event-name">Event name</label>
          <input
            id="organizer-event-name"
            value={form.name}
            onChange={setField('name')}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="organizer-event-description">Description</label>
          <textarea
            id="organizer-event-description"
            value={form.description}
            onChange={setField('description')}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="organizer-venue-address">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Venue address
              </span>
            </label>
            <input
              id="organizer-venue-address"
              value={form.venueAddress}
              onChange={setField('venueAddress')}
              className={inputClass}
              style={{ borderColor: 'var(--color-border-medium)' }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="organizer-venue-city">City</label>
            <input
              id="organizer-venue-city"
              value={form.venueCity}
              onChange={setField('venueCity')}
              className={inputClass}
              style={{ borderColor: 'var(--color-border-medium)' }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="organizer-venue-gps">GPS location</label>
            <input
              id="organizer-venue-gps"
              value={form.venueGpsLoc}
              onChange={setField('venueGpsLoc')}
              className={inputClass}
              style={{ borderColor: 'var(--color-border-medium)' }}
              placeholder="Google Maps link or latitude,longitude"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="organizer-venue-capacity">Max venue capacity</label>
            <input
              id="organizer-venue-capacity"
              type="number"
              min="1"
              value={form.venueMaxCapacity}
              onChange={setField('venueMaxCapacity')}
              className={inputClass}
              style={{ borderColor: 'var(--color-border-medium)' }}
            />
          </div>
        </div>

        <div>
          <p className={`${labelClass} inline-flex items-center gap-1.5`}>
            <CalendarDays className="h-3.5 w-3.5" /> Event window
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-sans text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Starts</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={setField('startTime')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Ends</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={setField('endTime')}
                className={inputClass}
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
              <label className="mb-1.5 block font-sans text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Sales open</label>
              <input
                type="datetime-local"
                value={form.salesStart}
                onChange={setField('salesStart')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Sales close</label>
              <input
                type="datetime-local"
                value={form.salesEnd}
                onChange={setField('salesEnd')}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="organizer-banner">Banner image URL</label>
          <input
            id="organizer-banner"
            value={form.bannerImage}
            onChange={setField('bannerImage')}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="pressable inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-sans text-sm font-bold text-[#fffcef] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Save event details
        </button>
      </div>
    </form>
  )
}

export default EventSettingsForm
