import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CheckCircle, MapPin, Clock, Phone, Truck,
  AlertCircle, Copy, Download, Store, User,
  Mail, CreditCard, ChevronRight
} from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import FoodMedia from '../Components/FoodMedia'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { showSuccess, showError, showInfo } from '../utils/toast'
import { generateReceipt } from '../utils/receiptGenerator'

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toFixed(2)
const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']
const STATUS_LABELS = { pending: 'Confirmed', confirmed: 'Confirmed', preparing: 'Preparing', out_for_delivery: 'On the way', delivered: 'Delivered' }

const STATUS_BADGE = {
  pending: { bg: '#FEF9C3', text: '#854D0E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  preparing: { bg: '#F3E8FF', text: '#6B21A8' },
  out_for_delivery: { bg: '#FFEDD5', text: '#9A3412' },
  delivered: { bg: '#DCFCE7', text: '#15803D' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

/* ─── Page ──────────────────────────────────────────────────────── */
const OrderConfirmation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const orderId = location.state?.orderId

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(API_ENDPOINTS.order.getById(orderId), axiosConfig)
      setOrder(res.data.order)
    } catch (err) {
      setError(`Failed to load order details ${err}`);
      showError('Failed to load order')
    } finally { setLoading(false) }
  }, [orderId])

  useEffect(() => {
    if (!orderId) { setError('Order not found'); setLoading(false); return }
    fetchOrder()
  }, [orderId, fetchOrder])

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    setCopied(true); showSuccess('Order ID copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReceipt = () => {
    if (!order) { showError('Order details not available'); return }
    try { showInfo('Generating receipt…'); generateReceipt(order); showSuccess('Receipt downloaded!') }
    catch { showError('Failed to generate receipt') }
  }

  const statusIdx = STATUS_STEPS.indexOf(order?.status)
  const progressPct = statusIdx >= 0 ? Math.round((statusIdx / (STATUS_STEPS.length - 1)) * 100) : 0

  /* Loading */
  if (loading) return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full" style={{ border: '3px solid var(--color-border-light)', borderTopColor: 'var(--color-primary)' }} />
          <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>Loading order details…</p>
        </div>
      </div>
      <Footer />
    </div>
  )

  /* Error */
  if (error || !order) return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <AlertCircle className="mx-auto h-14 w-14" style={{ color: '#dc2626' }} />
          <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>Error Loading Order</h1>
          <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>{error || 'Order not found'}</p>
          <button onClick={() => navigate('/order/history')} className="rounded-xl px-8 py-3 font-bold font-sans cursor-pointer" style={{ background: 'var(--color-primary)', color: '#fff' }}>
            View All Orders
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )

  const da = order.deliveryAddress || {}
  const pricing = order.pricing || {}
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

          {/* ── Success header ────────────────────────────────── */}
          <header className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#DCFCE7' }}>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: 'var(--color-text-base)' }}>Order Confirmed!</h1>

            {/* Order ID pill */}
            <div className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5 mt-1 font-sans" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Order ID</span>
              <span className="font-mono font-bold" style={{ color: 'var(--color-text-base)' }}>#{(order.id || order._id)}</span>
              <button onClick={copyOrderId} className="cursor-pointer" style={{ color: copied ? '#16a34a' : 'var(--color-text-faint)' }}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <p className="mt-2 text-sm font-sans" style={{ color: 'var(--color-text-faint)' }}>
              Placed on {fmtDate(order.createdAt)}
            </p>
          </header>

          <div className="space-y-5">

            {/* ── Delivery progress card ─────────────────────── */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest font-sans mb-1" style={{ color: 'var(--color-text-faint)' }}>Estimated Arrival</p>
                  <h3 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>30 – 45 mins</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(255,106,0,0.1)' }}>
                  <Truck className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-light)' }}>
                <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: 'var(--color-primary)' }} />
              </div>
              <div className="mt-3 flex justify-between">
                {['Confirmed', 'Preparing', 'On the way', 'Delivered'].map((label, i) => {
                  const stepPct = i / 3 * 100
                  const isActive = progressPct >= stepPct
                  return (
                    <span key={label} className="text-[10px] font-bold uppercase tracking-wider font-sans" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-faint)' }}>
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* ── 2-column grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Delivery address */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 className="font-serif text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
                  <MapPin className="h-5 w-5" style={{ color: 'var(--color-primary)' }} /> Delivery Address
                </h2>
                <div className="rounded-xl p-4 font-sans text-sm space-y-1" style={{ background: 'var(--color-surface-muted)' }}>
                  <p className="font-bold" style={{ color: 'var(--color-text-base)' }}>{da.fullName}</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>{da.addressLine1}</p>
                  {da.landmark && <p style={{ color: 'var(--color-text-muted)' }}>{da.landmark}</p>}
                  <p style={{ color: 'var(--color-text-muted)' }}>{da.city}, {da.state} — {da.pincode}</p>
                  <div className="flex items-center gap-2 pt-2 mt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-faint)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{da.phone}</span>
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 className="font-serif text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
                  <CreditCard className="h-5 w-5" style={{ color: 'var(--color-primary)' }} /> Payment Info
                </h2>
                <div className="rounded-xl p-4 font-sans" style={{ background: 'var(--color-surface-muted)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--color-text-base)' }}>
                        {order.paymentDetails?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: order.paymentDetails?.status === 'completed' ? '#16a34a' : 'var(--color-primary)', animation: order.paymentDetails?.status !== 'completed' ? 'pulse 2s infinite' : 'none' }}
                        />
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest font-sans"
                          style={{ color: order.paymentDetails?.status === 'completed' ? '#16a34a' : 'var(--color-primary)' }}
                        >
                          {order.paymentDetails?.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold font-sans"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-2 pt-2">
                  {order.user?.email && (
                    <div className="flex items-center gap-2 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                      <Mail className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-faint)' }} /> {order.user.email}
                    </div>
                  )}
                  {order.user?.mobile && (
                    <div className="flex items-center gap-2 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                      <Phone className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-faint)' }} /> {order.user.mobile}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Order Summary ──────────────────────────────── */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>Order Summary</h2>

              <div className="space-y-3 pb-4 font-sans text-sm" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {item.foodItem?.name} <span className="font-bold" style={{ color: 'var(--color-text-base)' }}>×{item.quantity}</span>
                    </span>
                    <span className="font-medium" style={{ color: 'var(--color-text-base)' }}>₹{fmt(item.priceAtOrder * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pb-4 font-sans text-sm" style={{ borderBottom: '1px dashed var(--color-border-medium)' }}>
                {[
                  { l: 'Items total', v: `₹${fmt(pricing.itemPrice)}` },
                  { l: 'Delivery fee', v: pricing.deliveryFee === 0 ? 'FREE' : `₹${fmt(pricing.deliveryFee)}`, g: pricing.deliveryFee === 0 },
                  { l: 'Platform fee', v: `₹${fmt(pricing.platformFee)}` },
                  { l: 'GST (5%)', v: `₹${fmt(pricing.taxes?.gst)}` },
                  ...(pricing.discount > 0 ? [{ l: 'Discount', v: `-₹${fmt(pricing.discount)}`, g: true }] : []),
                ].map(({ l, v, g }) => (
                  <div key={l} className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{l}</span>
                    <span style={{ color: g ? '#16a34a' : 'var(--color-text-base)' }} className={g ? 'font-bold' : ''}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-lg font-sans" style={{ color: 'var(--color-text-base)' }}>Total Amount</span>
                <span className="font-serif text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>₹{fmt(pricing.totalAmount)}</span>
              </div>
            </div>

            {/* ── Items ordered ─────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>Items Ordered</h2>
              </div>
              {order.items?.map((item, i) => {
                const food = item.foodItem
                return (
                  <div key={i} className="flex items-center gap-4 px-6 py-5" style={{ borderTop: i > 0 ? '1px solid var(--color-border-light)' : 'none' }}>
                    <FoodMedia
                      foodItem={food}
                      className="h-20 w-20 flex-shrink-0 rounded-xl"
                      imgClass="h-full w-full object-cover"
                      thumbSecond={1}
                      showPlay={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-lg font-sans" style={{ color: 'var(--color-text-base)' }}>{food?.name || 'Food Item'}</h4>
                          <p className="text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                            {item.quantity} unit{item.quantity > 1 ? 's' : ''}{food?.preparationTime ? ` • ${food.preparationTime} min prep` : ''}
                          </p>
                        </div>
                        <span className="font-bold font-sans flex-shrink-0" style={{ color: 'var(--color-text-base)' }}>₹{fmt(item.priceAtOrder * item.quantity)}</span>
                      </div>
                      {item.foodPartner && (
                        <div className="mt-2 flex items-center gap-2 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                          <Store className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                          {item.foodPartner.companyName}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Action buttons ────────────────────────────── */}
            <footer className="space-y-3 ">
              <button
                onClick={() => navigate(`/order/tracking/${order.id || order._id}`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold font-sans text-lg transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
              >
                <Truck className="h-5 w-5" /> Track Order
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleReceipt}
                  className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold font-sans transition-colors cursor-pointer"
                  style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-medium)', color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background-white)'}
                >
                  <Download className="h-4 w-4" /> Receipt
                </button>
                <button
                  onClick={() => navigate('/order/history')}
                  className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold font-sans transition-colors cursor-pointer"
                  style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-medium)', color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background-white)'}
                >
                  All Orders <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/reels')}
                  className="w-1/2 gap-2 py-3 font-bold font-sans transition-colors cursor-pointer border-2  px-4 rounded-full hover:text-white hover:bg-primary"
                  style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                >
                  Continue Shopping
                </button></div>
            </footer>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderConfirmation