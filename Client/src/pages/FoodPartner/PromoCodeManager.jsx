import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Tag, Plus, Copy, Check, Power, Loader2, AlertCircle,
  IndianRupee, Percent, CalendarDays, Users, TrendingUp, TicketPercent, ShoppingBag, UtensilsCrossed
} from 'lucide-react'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { showError, showSuccess, showWarning } from '../../utils/toast'
import { copyText } from '../../utils/clipboard'
import ModalShell from '../../Components/foodfest/ModalShell'
import ScrambleNumber from '../../Components/ScrambleNumber'

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0)
const fmtCur = (n) => `₹${fmt(n)}`
const fmtDate = (value) => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : null

const discountLabel = (coupon) => {
  if (coupon.discountType === 'percentage') {
    return `${fmt(coupon.discountValue)}% off${coupon.maxDiscount ? ` · up to ${fmtCur(coupon.maxDiscount)}` : ''}`
  }
  return `${fmtCur(coupon.discountValue)} off`
}

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'fixed',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  scope: 'all',
  selectedItemIds: [],
  minQuantity: '',
  usageLimit: '',
  perUserLimit: '1',
  validUntil: ''
}

const StatCard = ({ label, value, prefix = '', format }) => (
  <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-4 shadow-sm">
    <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-0.5 text-xl font-bold tracking-tight text-[var(--color-text-base)]">
      {typeof value === 'number'
        ? <ScrambleNumber value={value} prefix={prefix} format={format} />
        : value}
    </p>
  </div>
)

const CouponCard = ({ coupon, onCopy, onToggle, toggling, copied }) => {
  const remaining = coupon.usageLimit == null
    ? null
    : Math.max(0, Number(coupon.usageLimit) - Number(coupon.usedCount || 0))
  const expired = coupon.validUntil && new Date(coupon.validUntil) < new Date()
  const status = !coupon.isActive
    ? { label: 'Inactive', cls: 'bg-[var(--color-border-light)] text-gray-600 border-[var(--color-border-medium)]' }
    : expired
      ? { label: 'Expired', cls: 'bg-red-50 text-red-600 border-red-200' }
      : { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200' }

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-border-light)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-orange-700">
            {coupon.code}
          </span>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.cls}`}>
            {status.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onCopy(coupon.code)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            copied
              ? 'border-green-200 bg-green-50 text-green-600'
              : 'border-[var(--color-border-medium)] text-[var(--color-text-faint)] hover:border-orange-200 hover:text-orange-600'
          }`}
          aria-label={`Copy promo code ${coupon.code}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <p className="mt-3 text-lg font-bold text-[var(--color-text-base)]">{discountLabel(coupon)}</p>
      {coupon.description && (
        <p className="mt-0.5 line-clamp-2 text-sm text-[var(--color-text-muted)]">{coupon.description}</p>
      )}

      <div className="mt-4 space-y-2 text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
          {coupon.minOrderAmount > 0 ? `Min. order value ${fmtCur(coupon.minOrderAmount)}` : 'No minimum order value'}
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
          {coupon.minQuantity > 1 ? `Minimum ${fmt(coupon.minQuantity)} eligible items` : 'No minimum item count'}
        </div>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
          {coupon.applicableItemIds?.length > 0
            ? `Applies to ${fmt(coupon.applicableItemIds.length)} selected item${coupon.applicableItemIds.length > 1 ? 's' : ''} only`
            : 'Applies to all items'}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
          {coupon.validUntil ? `Valid until ${fmtDate(coupon.validUntil)}` : 'No expiry date'}
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
          {coupon.perUserLimit === 1 ? 'One use per customer' : `Up to ${coupon.perUserLimit} uses per customer`}
        </div>
        <div className="flex items-center gap-2">
          <TicketPercent className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-faint)]" />
          {coupon.usageLimit == null
            ? `${fmt(coupon.usedCount)} redemptions · no overall limit`
            : `${fmt(coupon.usedCount)} of ${fmt(coupon.usageLimit)} redeemed${remaining === 0 ? ' · limit reached' : ''}`}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[var(--color-surface-muted)] p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Orders</p>
          <p className="text-sm font-bold text-gray-800">{fmt(coupon.stats?.orders)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Discount</p>
          <p className="text-sm font-bold text-gray-800">{fmtCur(coupon.stats?.discountGiven)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Revenue</p>
          <p className="text-sm font-bold text-gray-800">{fmtCur(coupon.stats?.revenue)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(coupon)}
        disabled={toggling === coupon._id}
        className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          coupon.isActive
            ? 'border-[var(--color-border-medium)] text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
            : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
        }`}
      >
        {toggling === coupon._id
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Power className="h-4 w-4" />}
        {coupon.isActive ? 'Deactivate code' : 'Reactivate code'}
      </button>
    </div>
  )
}

const PromoCodeManager = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [copied, setCopied] = useState(null)
  const [foods, setFoods] = useState([])

  // Item scoping needs the partner's own dishes (server enforces ownership).
  useEffect(() => {
    if (!showForm) return
    let cancelled = false
    axios.get(API_ENDPOINTS.food.myPosts, axiosConfig)
      .then((response) => {
        if (cancelled) return
        const grouped = response.data?.foods || {}
        const foodPosts = grouped.food || grouped.all || (Array.isArray(grouped) ? grouped : [])
        setFoods(foodPosts.filter((f) => f.postType !== 'advertisement'))
      })
      .catch(() => { if (!cancelled) setFoods([]) })
    return () => { cancelled = true }
  }, [showForm])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(API_ENDPOINTS.coupon.partnerStats, axiosConfig)
      setCoupons(response.data?.coupons || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const totals = useMemo(() => ({
    codes: coupons.length,
    active: coupons.filter((c) => c.isActive && (!c.validUntil || new Date(c.validUntil) >= new Date())).length,
    redemptions: coupons.reduce((sum, c) => sum + (Number(c.stats?.orders) || 0), 0),
    discountGiven: coupons.reduce((sum, c) => sum + (Number(c.stats?.discountGiven) || 0), 0)
  }), [coupons])

  const handleCopy = async (code) => {
    const ok = await copyText(code)
    if (ok) {
      setCopied(code)
      showSuccess(`${code} copied`)
      setTimeout(() => setCopied((current) => (current === code ? null : current)), 1800)
    } else {
      showWarning('Could not copy the code. Select it manually.')
    }
  }

  const handleToggle = async (coupon) => {
    setToggling(coupon._id)
    try {
      const response = await axios.put(
        API_ENDPOINTS.coupon.update(coupon._id),
        { isActive: !coupon.isActive },
        axiosConfig
      )
      const updated = response.data?.coupon
      setCoupons((current) => current.map((item) => (
        item._id === coupon._id
          ? { ...item, ...updated, stats: item.stats }
          : item
      )))
      showSuccess(coupon.isActive ? `${coupon.code} deactivated` : `${coupon.code} reactivated`)
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update the promo code')
    } finally {
      setToggling(null)
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()

    const code = form.code.trim().toUpperCase()
    const discountValue = Number(form.discountValue)
    if (!code) { showWarning('Enter a promo code'); return }
    if (code.length < 5) { showWarning('Promo codes must be at least 5 characters'); return }
    if (!/^[A-Z0-9_-]{5,32}$/.test(code)) {
      showWarning('Use 5–32 characters: letters, numbers, hyphens or underscores')
      return
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      showWarning('Enter a discount greater than zero')
      return
    }
    if (form.discountType === 'percentage' && discountValue > 100) {
      showWarning('A percentage discount cannot exceed 100')
      return
    }
    if (form.scope === 'items' && form.selectedItemIds.length === 0) {
      showWarning('Select at least one item, or choose "All items"')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code,
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue,
        minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
        perUserLimit: form.perUserLimit === '' ? 1 : Number(form.perUserLimit),
        ...(form.scope === 'items' ? { applicableItemIds: form.selectedItemIds } : {}),
        ...(form.minQuantity !== '' ? { minQuantity: Number(form.minQuantity) } : {}),
        ...(form.discountType === 'percentage' && form.maxDiscount !== ''
          ? { maxDiscount: Number(form.maxDiscount) }
          : {}),
        ...(form.usageLimit !== '' ? { usageLimit: Number(form.usageLimit) } : {}),
        ...(form.validUntil
          ? { validUntil: new Date(`${form.validUntil}T23:59:59`).toISOString() }
          : {})
      }

      const response = await axios.post(API_ENDPOINTS.coupon.create, payload, axiosConfig)
      showSuccess(response.data?.message || 'Promo code created')
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create the promo code')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-[var(--color-border-medium)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-text-base)] outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
  const labelClass = 'mb-1.5 block text-xs font-semibold text-gray-600'

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-base)]">Promo codes</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Codes your customers can apply at checkout. Every redemption is tracked here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New promo code
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total codes" value={totals.codes} />
        <StatCard label="Active codes" value={totals.active} />
        <StatCard label="Redemptions" value={totals.redemptions} />
        <StatCard label="Discount given" value={totals.discountGiven} prefix="₹" format={fmt} />
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">{error}</p>
          <button type="button" onClick={load} className="text-xs font-semibold text-red-600 hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-[var(--color-border-light)] bg-white p-5">
              <div className="h-8 w-32 rounded-lg bg-[var(--color-border-light)]" />
              <div className="mt-4 h-5 w-40 rounded bg-[var(--color-border-light)]" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-52 rounded bg-[var(--color-border-light)]" />
                <div className="h-3 w-44 rounded bg-[var(--color-border-light)]" />
                <div className="h-3 w-48 rounded bg-[var(--color-border-light)]" />
              </div>
            </div>
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border-medium)] bg-white py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
            <Tag className="h-6 w-6 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No promo codes yet</h3>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-faint)]">
            Create a code to turn a reel or advertisement into a discount customers can actually redeem.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Create your first code
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon._id}
              coupon={coupon}
              onCopy={handleCopy}
              onToggle={handleToggle}
              toggling={toggling}
              copied={copied === coupon.code}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title="Create a promo code" onClose={() => setShowForm(false)} busy={submitting} maxWidth="max-w-xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="promo-form-code" className={labelClass}>Code *</label>
              <input
                id="promo-form-code"
                type="text"
                value={form.code}
                onChange={(e) => setForm((current) => ({ ...current, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                placeholder="WEEKEND50"
                minLength={5}
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
                className={`${inputClass} font-mono font-bold uppercase tracking-wide`}
                required
              />
              <p className="mt-1 text-xs text-[var(--color-text-faint)]">5–32 characters: letters, numbers, hyphens and underscores. Case-insensitive at checkout.</p>
            </div>

            <div>
              <label htmlFor="promo-form-description" className={labelClass}>Description</label>
              <input
                id="promo-form-description"
                type="text"
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="₹50 off your weekend order"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="promo-form-type" className={labelClass}>Discount type *</label>
                <select
                  id="promo-form-type"
                  value={form.discountType}
                  onChange={(e) => setForm((current) => ({ ...current, discountType: e.target.value, maxDiscount: '' }))}
                  className={inputClass}
                >
                  <option value="fixed">Fixed amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label htmlFor="promo-form-value" className={labelClass}>
                  {form.discountType === 'percentage' ? 'Percentage off *' : 'Amount off (₹) *'}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]">
                    {form.discountType === 'percentage'
                      ? <Percent className="h-4 w-4" />
                      : <IndianRupee className="h-4 w-4" />}
                  </span>
                  <input
                    id="promo-form-value"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={form.discountType === 'percentage' ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm((current) => ({ ...current, discountValue: e.target.value }))}
                    className={`${inputClass} pl-9`}
                    required
                  />
                </div>
              </div>
            </div>

            {form.discountType === 'percentage' && (
              <div>
                <label htmlFor="promo-form-cap" className={labelClass}>Maximum discount (₹)</label>
                <input
                  id="promo-form-cap"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={(e) => setForm((current) => ({ ...current, maxDiscount: e.target.value }))}
                  placeholder="Leave empty for no cap"
                  className={inputClass}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="promo-form-min" className={labelClass}>Minimum order value (₹)</label>
                <input
                  id="promo-form-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((current) => ({ ...current, minOrderAmount: e.target.value }))}
                  placeholder="e.g. 100"
                  className={inputClass}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[100, 200, 500].map((amount) => {
                    const active = Number(form.minOrderAmount) === amount
                    return (
                      <button
                        key={amount}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setForm((current) => ({ ...current, minOrderAmount: String(amount) }))}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                          active
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-500 hover:border-orange-200'
                        }`}
                      >
                        ₹{amount}
                      </button>
                    )
                  })}
                  {Number(form.minOrderAmount) > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, minOrderAmount: '' }))}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-text-faint)]">
                  The code unlocks only when the eligible items total at least this amount. Leave 0 for no minimum.
                </p>
              </div>
              <div>
                <label htmlFor="promo-form-until" className={labelClass}>Valid until</label>
                <input
                  id="promo-form-until"
                  type="date"
                  value={form.validUntil}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((current) => ({ ...current, validUntil: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Plain-language preview of the rule the customer will hit. */}
            <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-3.5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-700">Condition preview</p>
              <p className="mt-1 text-sm text-gray-700">
                {Number(form.minOrderAmount) > 0
                  ? `Customer must buy at least ₹${fmt(form.minOrderAmount)} worth of ${form.scope === 'items' ? 'selected' : ''} eligible items`
                  : `No minimum order value${form.scope === 'items' ? ' on the selected items' : ''}`}
                {Number(form.minQuantity) > 1
                  ? `, including at least ${fmt(form.minQuantity)} item${Number(form.minQuantity) > 1 ? 's' : ''}.`
                  : '.'}
              </p>
            </div>

            {/* Item scope + minimum quantity */}
            <div>
              <span className={labelClass}>Applies to</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'All items' },
                  { value: 'items', label: 'Selected items' }
                ].map((option) => {
                  const active = form.scope === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm((current) => ({ ...current, scope: option.value }))}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                        active
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-500 hover:border-orange-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {form.scope === 'items' && (
                <div className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-2">
                  {foods.length === 0 ? (
                    <p className="px-2 py-4 text-center text-xs text-[var(--color-text-faint)]">
                      No food items found — create a post first, then scope your code.
                    </p>
                  ) : foods.map((food) => {
                    const checked = form.selectedItemIds.includes(food._id)
                    return (
                      <label
                        key={food._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          checked ? 'bg-orange-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setForm((current) => ({
                            ...current,
                            selectedItemIds: checked
                              ? current.selectedItemIds.filter((id) => id !== food._id)
                              : [...current.selectedItemIds, food._id]
                          }))}
                          className="h-4 w-4 rounded accent-orange-600"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{food.name}</span>
                        <span className="text-xs font-semibold text-gray-500">₹{food.price ?? '—'}</span>
                      </label>
                    )
                  })}
                  <p className="px-3 pt-1 text-[11px] text-[var(--color-text-faint)]">
                    The discount, minimum order and minimum items all count only these dishes.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="promo-form-minq" className={labelClass}>Minimum items</label>
              <input
                id="promo-form-minq"
                type="number"
                min="1"
                max="99"
                step="1"
                value={form.minQuantity}
                onChange={(e) => setForm((current) => ({ ...current, minQuantity: e.target.value }))}
                placeholder="1"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[var(--color-text-faint)]">Minimum eligible items in the cart (count, not amount). Leave 1 for no minimum.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="promo-form-usage" className={labelClass}>Total usage limit</label>
                <input
                  id="promo-form-usage"
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm((current) => ({ ...current, usageLimit: e.target.value }))}
                  placeholder="Unlimited"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="promo-form-per-user" className={labelClass}>Uses per customer *</label>
                <input
                  id="promo-form-per-user"
                  type="number"
                  min="1"
                  step="1"
                  value={form.perUserLimit}
                  onChange={(e) => setForm((current) => ({ ...current, perUserLimit: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-[var(--color-border-medium)] px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-[var(--color-surface-muted)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {submitting ? 'Creating…' : 'Create code'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  )
}

export default PromoCodeManager
