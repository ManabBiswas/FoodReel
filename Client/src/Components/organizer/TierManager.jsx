import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Pencil, Trash2, Loader2, Ticket, Check, X } from 'lucide-react'
import { animate, stagger } from 'animejs'
import { showSuccess, showError } from '../../utils/toast'
import { formatCurrency, formatDateTime } from '../../utils/foodfest'
import { API_ENDPOINTS } from '../../config/Api'

const emptyForm = {
  name: '',
  price: '',
  quantity: '',
  salesStart: '',
  salesEnd: '',
  active: true
}

const toLocalInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const tierToForm = (tier) => ({
  name: tier.name || '',
  price: tier.price ?? '',
  quantity: tier.quantity ?? '',
  salesStart: toLocalInput(tier.salesStart),
  salesEnd: toLocalInput(tier.salesEnd),
  active: tier.active !== false
})

const inputClass =
  'w-full rounded-xl border border-[var(--color-border-medium)] bg-white px-3.5 py-2.5 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-160 ease-out focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(255,106,0,0.18)]'
const labelClass =
  'mb-1.5 block font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]'

const TierManager = ({ eventId, tiers, onChanged, disabled }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  // List entrance (anime.js v4) — respects reduced motion, visible by default.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const items = [...document.querySelectorAll('.org-tier-card')]
    if (!items.length) return undefined
    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(50),
      duration: 500,
      easing: 'easeOutExpo'
    })
    return () => anim?.pause?.()
  }, [tiers.length, showForm])

  const setField = (field) => (event) => {
    const value = field === 'active' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (tier) => {
    setEditingId(tier._id)
    setForm(tierToForm(tier))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || form.price === '' || form.quantity === '') {
      showError('Name, price and quantity are required')
      return
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
      active: form.active,
      salesStart: form.salesStart || undefined,
      salesEnd: form.salesEnd || undefined
    }

    setBusy(true)
    try {
      if (editingId) {
        await axios.put(API_ENDPOINTS.foodfest.organizerTier(editingId), payload, {
          withCredentials: true
        })
        showSuccess('Ticket tier updated')
      } else {
        await axios.post(API_ENDPOINTS.foodfest.organizerEventTiers(eventId), payload, {
          withCredentials: true
        })
        showSuccess('Ticket tier added')
      }
      closeForm()
      onChanged()
    } catch (err) {
      console.error('Tier save error:', err)
      showError(err?.response?.data?.message || 'Could not save the ticket tier')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (tier) => {
    if (!window.confirm(`Delete the "${tier.name}" tier?`)) return

    setBusy(true)
    try {
      await axios.delete(API_ENDPOINTS.foodfest.organizerTier(tier._id), {
        withCredentials: true
      })
      showSuccess('Ticket tier deleted')
      onChanged()
    } catch (err) {
      console.error('Tier delete error:', err)
      showError(err?.response?.data?.message || 'Could not delete the ticket tier')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (tier) => {
    setBusy(true)
    try {
      await axios.put(
        API_ENDPOINTS.foodfest.organizerTier(tier._id),
        { active: tier.active === false },
        { withCredentials: true }
      )
      showSuccess(tier.active === false ? 'Tier is on sale' : 'Tier paused')
      onChanged()
    } catch (err) {
      console.error('Tier toggle error:', err)
      showError(err?.response?.data?.message || 'Could not update the ticket tier')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Ticket tiers">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-black tracking-[-0.02em]" style={{ color: 'var(--color-text-base)' }}>
            Ticket tiers
          </h2>
          <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Create the passes guests can buy, set prices, and control availability.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={openCreate}
            className="pressable hover-gated inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-sans text-sm font-bold text-[#fffcef] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add tier
          </button>
        )}
      </div>

      {showForm && !disabled && (
        <form
          onSubmit={submit}
          className="panel-enter mb-4 rounded-2xl border border-[var(--color-border-light)] bg-white p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="tier-name">Tier name</label>
              <input
                id="tier-name"
                value={form.name}
                onChange={setField('name')}
                className={inputClass}
                placeholder="General admission, VIP, Early bird..."
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tier-price">Price (INR)</label>
              <input
                id="tier-price"
                type="number"
                min="0"
                value={form.price}
                onChange={setField('price')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tier-quantity">Quantity</label>
              <input
                id="tier-quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={setField('quantity')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tier-sales-start">Sales open</label>
              <input
                id="tier-sales-start"
                type="datetime-local"
                value={form.salesStart}
                onChange={setField('salesStart')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tier-sales-end">Sales close</label>
              <input
                id="tier-sales-end"
                type="datetime-local"
                value={form.salesEnd}
                onChange={setField('salesEnd')}
                className={inputClass}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border-light)] bg-white px-3 py-2.5 font-sans text-sm transition-[border-color] duration-160 ease-out has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[#fff7ed] hover:border-[var(--color-primary)] sm:col-span-2" style={{ color: 'var(--color-text-base)' }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={setField('active')}
                className="h-4 w-4 rounded accent-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(255,106,0,0.3)]"
              />
              Tier is active and on sale
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-sans text-sm font-bold text-[#1a1208] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Add tier'}
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

      {tiers.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white/60 p-6 text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe8cc]">
            <Ticket className="h-6 w-6 text-[#e55a00]" aria-hidden="true" />
          </span>
          <p className="mt-3 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
            No ticket tiers yet
          </p>
          <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Add one before publishing the event.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tiers.map((tier) => {
            const available = Math.max(0, (tier.quantity || 0) - (tier.sold || 0) - (tier.reserved || 0))
            return (
              <li
                key={tier._id}
                className="org-tier-card rounded-2xl border border-[var(--color-border-light)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
                        {tier.name}
                      </h3>
                      <span
                        className="rounded-full px-2.5 py-0.5 font-sans text-[11px] font-bold"
                        style={{
                          background: tier.active === false ? 'rgba(148,163,184,0.18)' : 'rgba(34,197,94,0.16)',
                          color: tier.active === false ? '#475569' : '#15803d'
                        }}
                      >
                        {tier.active === false ? 'Paused' : 'On sale'}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      {formatCurrency(tier.price)}
                    </p>
                    <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {tier.sold || 0} sold · {tier.reserved || 0} reserved · {available} available of {tier.quantity}
                    </p>
                    {(tier.salesStart || tier.salesEnd) && (
                      <p className="mt-0.5 font-sans text-xs" style={{ color: 'var(--color-text-faint)' }}>
                        {tier.salesStart ? formatDateTime(tier.salesStart) : 'Open'} –{' '}
                        {tier.salesEnd ? formatDateTime(tier.salesEnd) : 'Until event ends'}
                      </p>
                    )}
                  </div>

                  {!disabled && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(tier)}
                        disabled={busy}
                        className="pressable rounded-xl px-3 py-1.5 font-sans text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: 'rgba(255,184,0,0.16)', color: '#8a5a00' }}
                      >
                        {tier.active === false ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(tier)}
                        disabled={busy}
                        className="pressable inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-sans text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: 'rgba(255,184,0,0.16)', color: '#8a5a00' }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(tier)}
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

export default TierManager
