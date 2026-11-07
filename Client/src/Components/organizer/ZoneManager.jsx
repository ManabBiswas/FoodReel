import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Pencil, Trash2, Loader2, DoorOpen, Check, X } from 'lucide-react'
import { animate, stagger } from 'animejs'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS } from '../../config/Api'

const emptyForm = {
  name: '',
  capacity: '',
  warningThreshold: 80,
  criticalThreshold: 95,
  tracksExit: false
}

const zoneToForm = (zone) => ({
  name: zone.name || '',
  capacity: zone.capacity ?? '',
  warningThreshold: zone.warningThreshold ?? 80,
  criticalThreshold: zone.criticalThreshold ?? 95,
  tracksExit: Boolean(zone.tracksExit)
})

const inputClass =
  'w-full rounded-xl border border-[var(--color-border-medium)] bg-white px-3.5 py-2.5 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-160 ease-out focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(255,106,0,0.18)]'
const labelClass =
  'mb-1.5 block font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]'

const ZoneManager = ({ eventId, zones, onChanged, disabled }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  // List entrance (anime.js v4) — respects reduced motion, visible by default.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const items = [...document.querySelectorAll('.org-zone-card')]
    if (!items.length) return undefined
    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(50),
      duration: 500,
      easing: 'easeOutExpo'
    })
    return () => anim?.pause?.()
  }, [zones.length, showForm])

  const setField = (field) => (event) => {
    const value = field === 'tracksExit' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (zone) => {
    setEditingId(zone._id)
    setForm(zoneToForm(zone))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || form.capacity === '') {
      showError('Zone name and capacity are required')
      return
    }

    const payload = {
      name: form.name.trim(),
      capacity: Number(form.capacity),
      warningThreshold: Number(form.warningThreshold),
      criticalThreshold: Number(form.criticalThreshold),
      tracksExit: form.tracksExit
    }

    setBusy(true)
    try {
      if (editingId) {
        await axios.put(API_ENDPOINTS.foodfest.organizerZone(editingId), payload, {
          withCredentials: true
        })
        showSuccess('Zone updated')
      } else {
        await axios.post(API_ENDPOINTS.foodfest.organizerEventZones(eventId), payload, {
          withCredentials: true
        })
        showSuccess('Zone added')
      }
      closeForm()
      onChanged()
    } catch (err) {
      console.error('Zone save error:', err)
      showError(err?.response?.data?.message || 'Could not save the zone')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (zone) => {
    if (!window.confirm(`Delete the "${zone.name}" zone?`)) return

    setBusy(true)
    try {
      await axios.delete(API_ENDPOINTS.foodfest.organizerZone(zone._id), {
        withCredentials: true
      })
      showSuccess('Zone deleted')
      onChanged()
    } catch (err) {
      console.error('Zone delete error:', err)
      showError(err?.response?.data?.message || 'Could not delete the zone')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Venue zones">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-black tracking-[-0.02em]" style={{ color: 'var(--color-text-base)' }}>
            Venue zones
          </h2>
          <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Zones power capacity tracking and gate check-ins on the event day.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={openCreate}
            className="pressable hover-gated inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-sans text-sm font-bold text-[#fffcef] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add zone
          </button>
        )}
      </div>

      {showForm && !disabled && (
        <form
          onSubmit={submit}
          className="panel-enter mb-4 rounded-2xl border border-[var(--color-border-light)] bg-white p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="zone-name">Zone name</label>
              <input
                id="zone-name"
                value={form.name}
                onChange={setField('name')}
                className={inputClass}
                placeholder="Main lawn, Food court, VIP lounge..."
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="zone-capacity">Capacity</label>
              <input
                id="zone-capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={setField('capacity')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="zone-warning">Warning threshold (%)</label>
              <input
                id="zone-warning"
                type="number"
                min="0"
                max="100"
                value={form.warningThreshold}
                onChange={setField('warningThreshold')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="zone-critical">Critical threshold (%)</label>
              <input
                id="zone-critical"
                type="number"
                min="0"
                max="100"
                value={form.criticalThreshold}
                onChange={setField('criticalThreshold')}
                className={inputClass}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border-light)] bg-white px-3 py-2.5 font-sans text-sm transition-[border-color] duration-160 ease-out has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[#fff7ed] hover:border-[var(--color-primary)] sm:col-span-2" style={{ color: 'var(--color-text-base)' }}>
              <input
                type="checkbox"
                checked={form.tracksExit}
                onChange={setField('tracksExit')}
                className="h-4 w-4 rounded accent-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(255,106,0,0.3)]"
              />
              Track exits so guests can be checked out of this zone
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-sans text-sm font-bold text-[#1a1208] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Add zone'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="pressable inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-medium)] bg-white px-4 py-2.5 font-sans text-sm font-bold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-base)]"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Cancel
            </button>
          </div>
        </form>
      )}

      {zones.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white/60 p-6 text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe8cc]">
            <DoorOpen className="h-6 w-6 text-[#e55a00]" aria-hidden="true" />
          </span>
          <p className="mt-3 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
            No zones yet
          </p>
          <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Add at least one to track venue capacity at the gate.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {zones.map((zone) => {
            const fill = zone.capacity ? Math.min(100, Math.round((zone.currentCount / zone.capacity) * 100)) : 0
            return (
              <li
                key={zone._id}
                className="org-zone-card rounded-2xl border border-[var(--color-border-light)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
                        {zone.name}
                      </h3>
                      {zone.tracksExit && (
                        <span className="rounded-full bg-[#efe7d8] px-2.5 py-0.5 font-sans text-[11px] font-bold text-[#6b6460]">
                          Tracks exit
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {zone.currentCount || 0} inside · {zone.totalAdmitted || 0} admitted total · capacity {zone.capacity}
                    </p>
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#f3f1ed]">
                      <div
                        className="h-full rounded-full transition-[width] duration-400 ease-out"
                        style={{
                          width: `${fill}%`,
                          background: fill >= (zone.criticalThreshold ?? 95)
                            ? '#ef4444'
                            : fill >= (zone.warningThreshold ?? 80)
                              ? '#ffb800'
                              : 'var(--color-primary)'
                        }}
                      />
                    </div>
                  </div>

                  {!disabled && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(zone)}
                        disabled={busy}
                        className="pressable inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-sans text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: 'rgba(255,184,0,0.16)', color: '#8a5a00' }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(zone)}
                        disabled={busy}
                        className="pressable inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-sans text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#b91c1c' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ZoneManager
