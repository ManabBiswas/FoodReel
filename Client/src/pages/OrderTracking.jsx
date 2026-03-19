import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Package, Clock, CheckCircle, XCircle, Truck,
  ChefHat, MapPin, Phone, Home, AlertCircle,
  ArrowLeft, MessageCircle, Download, Calendar,
  User, CreditCard
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

const STATUS_FLOW = [
  { key: 'pending', label: 'Order Placed', Icon: Package },
  { key: 'confirmed', label: 'Confirmed', Icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', Icon: ChefHat },
  { key: 'ready', label: 'Ready for Pickup', Icon: Clock },
  { key: 'out_for_delivery', label: 'Out for Delivery', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle },
]

/* ─── Timeline step ─────────────────────────────────────────────── */
const Step = ({ step, isComplete, isCurrent, isLast }) => {
  const { Icon, label } = step
  return (
    <div className="flex gap-5 pb-8 relative">
      {!isLast && (
        <div
          className="absolute left-[11px] top-6 bottom-0 w-px"
          style={{ background: isComplete ? 'var(--color-primary)' : 'var(--color-border-medium)' }}
        />
      )}
      {/* Circle */}
      <div
        className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
        style={
          isComplete
            ? { background: 'var(--color-primary)', boxShadow: '0 0 0 4px rgba(255,106,0,0.15)' }
            : isCurrent
              ? { background: 'var(--color-background-white)', border: '1.5px solid var(--color-primary)' }
              : { background: 'var(--color-surface-muted)', border: '1.5px solid var(--color-border-medium)' }
        }
      >
        {isComplete
          ? <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          : isCurrent
            ? <Icon className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
            : <Icon className="h-3 w-3" style={{ color: 'var(--color-text-faint)' }} />
        }
      </div>
      {/* Label */}
      <div className="pt-0.5">
        <p
          className="text-sm font-bold font-sans"
          style={{ color: isComplete || isCurrent ? 'var(--color-text-base)' : 'var(--color-text-faint)' }}
        >
          {label}
        </p>
        {isCurrent && <p className="mt-0.5 text-xs font-medium font-sans" style={{ color: 'var(--color-primary)' }}>In progress</p>}
        {isComplete && !isCurrent && <p className="mt-0.5 text-xs font-sans" style={{ color: '#16a34a' }}>Completed</p>}
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
const OrderTracking = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOrder = useCallback(async () => {
    if (!orderId || orderId === 'undefined') { setError('Order ID not found'); setLoading(false); return }
    try {
      setLoading(true)
      const res = await axios.get(API_ENDPOINTS.order.getById(orderId), axiosConfig)
      setOrder(res.data.order); setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order'); showError('Failed to load order')
    } finally { setLoading(false) }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
    const id = setInterval(fetchOrder, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [orderId, fetchOrder])

  const getEstDelivery = () => {
    if (!order) return 'Calculating…'
    if (order.status === 'delivered') return 'Delivered'
    const prepTimes = order.items?.map(i => i.foodItem?.preparationTime || 20) ?? [20]
    const eta = new Date(order.createdAt).getTime() + (Math.max(...prepTimes) + 50) * 60000
    const left = eta - Date.now()
    if (left <= 0) return 'Any moment now'
    return `${Math.floor(left / 60000)} mins`
  }

  const currentIdx = STATUS_FLOW.findIndex(s => s.key === order?.status)
  const isCancelled = order?.cancellation?.isCancelled || order?.status === 'cancelled'
  const isDelivered = order?.status === 'delivered'
  const canCancel = order && !isCancelled && ['pending', 'confirmed', 'preparing'].includes(order.status)

  const handleCancel = async () => {
    try {
      setCancelLoading(true)
      await axios.post(API_ENDPOINTS.order.cancel(orderId), { reason: 'Customer requested cancellation' }, axiosConfig)
      showSuccess('Order cancelled'); fetchOrder()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to cancel order')
    } finally { setCancelLoading(false) }
  }

  const handleReceipt = () => {
    if (!order) { showError('Order details not available'); return }
    try { showInfo('Generating receipt…'); generateReceipt(order); showSuccess('Receipt downloaded!') }
    catch { showError('Failed to generate receipt') }
  }

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
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-14 w-14" style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>Order Not Found</h2>
          <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          <button onClick={() => navigate('/order/history')} className="rounded-xl px-8 py-3 font-bold font-sans cursor-pointer" style={{ background: 'var(--color-primary)', color: '#fff' }}>
            View Orders
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

          {/* Page header */}
          <div className="mb-8">
            <button onClick={() => navigate('/order/history')} className="mb-4 flex items-center gap-2 text-sm font-medium font-sans transition-colors py-2 px-4 border-2 rounded-full cursor-pointer" style={{ color: 'var(--color-text-muted)'}}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </button>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-5xl font-bold" style={{ color: 'var(--color-text-base)' }}>Track Order</h1>
                <p className="mt-1 font-sans font-medium" style={{ color: 'var(--color-primary)' }}>Order ID: #{orderId?.slice(-6).toUpperCase()}</p>
              </div>
              <span
                className="rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider font-sans"
                style={isCancelled ? { background: '#FEE2E2', color: '#991B1B' } : isDelivered ? { background: '#DCFCE7', color: '#15803D' } : { background: '#DBEAFE', color: '#1E40AF' }}
              >
                {order.status?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">

            {/* ── Left ─────────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-7">

              {/* ETA / delivered banner */}
              {!isCancelled && !isDelivered && (
                <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-glow)' }}>
                  <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full opacity-20" style={{ background: '#fff' }} />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-75 font-sans">Estimated Arrival</p>
                  <h3 className="font-serif text-4xl font-bold mt-1 mb-3">{getEstDelivery()}</h3>
                  <p className="text-sm opacity-80 font-sans">Your food is being prepared with love.</p>
                </div>
              )}
              {isDelivered && (
                <div className="flex items-center gap-4 rounded-2xl p-6 text-white" style={{ background: '#16a34a' }}>
                  <CheckCircle className="h-8 w-8 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg font-sans">Order Delivered!</p>
                    <p className="text-sm opacity-80 font-sans">Thank you for ordering with FoodReel.</p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="rounded-2xl p-8" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 className="font-serif text-xl font-bold mb-8" style={{ color: 'var(--color-text-base)' }}>Order Status</h4>
                {isCancelled ? (
                  <div className="flex flex-col items-center py-8 text-center gap-3">
                    <XCircle className="h-14 w-14" style={{ color: '#dc2626' }} />
                    <h3 className="font-serif text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>Order Cancelled</h3>
                    {order.cancellation?.reason && <p className="text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>Reason: {order.cancellation.reason}</p>}
                  </div>
                ) : (
                  STATUS_FLOW.map((step, i) => (
                    <Step
                      key={step.key}
                      step={step}
                      isComplete={i <= currentIdx}
                      isCurrent={i === currentIdx}
                      isLast={i === STATUS_FLOW.length - 1}
                    />
                  ))
                )}
              </div>

              {/* Items */}
              <div className="rounded-2xl p-8" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 className="font-serif text-xl font-bold mb-6" style={{ color: 'var(--color-text-base)' }}>
                  Items ({order.items?.length || 0})
                </h4>
                <div className="space-y-4">
                  {order.items?.map((item, i) => {
                    const food = item.foodItem
                    return (
                      <div key={i} className="flex gap-4 rounded-xl p-4" style={{ background: 'var(--color-surface-muted)' }}>
                        <FoodMedia
                          foodItem={food}
                          className="h-20 w-20 flex-shrink-0 rounded-xl"
                          imgClass="h-full w-full object-cover"
                          thumbSecond={1}
                          showPlay={true}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>{food?.name || 'Food Item'}</h5>
                          {food?.description && <p className="mt-0.5 text-xs font-sans line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{food.description}</p>}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                            <span>Qty: <strong style={{ color: 'var(--color-text-base)' }}>{item.quantity}</strong></span>
                            <span>₹{item.priceAtOrder} each</span>
                            {food?.preparationTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{food.preparationTime} min prep</span>}
                          </div>
                        </div>
                        <p className="font-bold font-sans flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                          ₹{fmt(item.priceAtOrder * item.quantity)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Delivery address */}
              <div className="rounded-2xl p-8" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 className="font-serif text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
                  <MapPin className="h-5 w-5" style={{ color: 'var(--color-primary)' }} /> Delivery Address
                </h4>
                <div className="rounded-xl p-4 space-y-2 font-sans text-sm" style={{ background: 'var(--color-surface-muted)' }}>
                  <p className="font-bold" style={{ color: 'var(--color-text-base)' }}>{order.deliveryAddress?.fullName}</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>{order.deliveryAddress?.addressLine1}</p>
                  {order.deliveryAddress?.landmark && <p style={{ color: 'var(--color-text-muted)' }}>{order.deliveryAddress.landmark}</p>}
                  <p style={{ color: 'var(--color-text-muted)' }}>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} — {order.deliveryAddress?.pincode}</p>
                  <div className="flex items-center gap-2 pt-2 mt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <Phone className="h-4 w-4" style={{ color: 'var(--color-text-faint)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{order.deliveryAddress?.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right ────────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-5">

              {/* Summary */}
              <div className="sticky top-24 rounded-2xl p-6" style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-md)' }}>
                <h4 className="font-serif text-xl font-bold mb-5" style={{ color: 'var(--color-text-base)' }}>Items Summary</h4>

                {/* Item list */}
                <div className="mb-4 space-y-3 pb-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold font-sans" style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}>
                          {item.quantity}
                        </span>
                        <span className="text-sm font-medium font-sans" style={{ color: 'var(--color-text-base)' }}>
                          {item.foodItem?.name || 'Item'}
                        </span>
                      </div>
                      <span className="text-sm font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>₹{fmt(item.priceAtOrder * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-2 pb-4 font-sans text-sm" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  {[
                    { l: 'Items total', v: fmt(order.pricing?.itemPrice) },
                    { l: 'Delivery fee', v: order.pricing?.deliveryFee === 0 ? 'FREE' : `₹${fmt(order.pricing?.deliveryFee)}`, g: order.pricing?.deliveryFee === 0 },
                    { l: 'Platform fee', v: `₹${fmt(order.pricing?.platformFee)}` },
                    { l: 'GST (5%)', v: `₹${fmt(order.pricing?.taxes?.gst)}` },
                  ].map(({ l, v, g }) => (
                    <div key={l} className="flex justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>{l}</span>
                      <span style={{ color: g ? '#16a34a' : 'var(--color-text-base)' }} className={g ? 'font-bold' : ''}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-end justify-between pt-4 mb-5">
                  <p className="font-bold font-sans text-lg" style={{ color: 'var(--color-text-base)' }}>Total Amount</p>
                  <p className="font-serif text-3xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                    ₹{fmt(order.pricing?.totalAmount)}
                  </p>
                </div>

                {/* Meta */}
                <div className="mb-5 space-y-2 text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {fmtDate(order.createdAt)}</p>
                  <p className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" />
                    {order.paymentDetails?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={handleReceipt}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl p-4 text-xs font-bold font-sans transition-colors cursor-pointer"
                    style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  >
                    <Download className="h-5 w-5" /> Receipt
                  </button>
                  <button
                    onClick={() => navigate('/contact')}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl p-4 text-xs font-bold font-sans transition-colors cursor-pointer"
                    style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  >
                    <MessageCircle className="h-5 w-5" /> Support
                  </button>
                </div>

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold font-sans text-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    style={{ background: '#dc2626', color: '#fff' }}
                  >
                    {cancelLoading
                      ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Cancelling…</>
                      : <><XCircle className="h-4 w-4" /> Cancel Order</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderTracking