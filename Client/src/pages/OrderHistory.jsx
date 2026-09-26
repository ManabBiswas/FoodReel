import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShoppingBag, MapPin, Loader2, Search, Truck, ChevronRight, RefreshCw } from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import FoodMedia from '../Components/FoodMedia'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { showError, showSuccess } from '../utils/toast'
import { useCart } from '../hooks/useCart'

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS = {
  pending: { label: 'Pending', bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  confirmed: { label: 'Confirmed', bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  preparing: { label: 'Preparing', bg: '#F3E8FF', text: '#6B21A8', border: '#C4B5FD' },
  ready: { label: 'Ready', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  delivered: { label: 'Delivered', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
}

const getStatus = (s) => STATUS[s] ?? STATUS.pending

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

/* ─── Order card ────────────────────────────────────────────────── */
const OrderCard = ({ order, onTrack, onDetails, onReorder, reordering }) => {
  const s = getStatus(order.status)
  const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)

  return (
    <div
      className="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
      style={{
        background: 'var(--color-background-white)',
        border: isActive ? `1.5px solid var(--color-primary)` : `1px solid var(--color-border-light)`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
        {/* Image */}
        <div
          className="h-40 w-full flex-shrink-0 overflow-hidden rounded-xl md:h-36 md:w-36"
          style={{ opacity: isActive ? 1 : 0.8 }}
        >
          <FoodMedia
            foodItem={order.items?.[0]?.foodItem}
            className="h-full w-full"
            imgClass="h-full w-full object-cover"
            showPlay={true}
            thumbSecond={1}
          />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider font-sans"
                  style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                >
                  {s.label}
                </span>
                <span className="text-sm font-sans" style={{ color: 'var(--color-text-faint)' }}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                Order #{order._id?.slice(-6).toUpperCase()}
              </h3>
              <p className="text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                {order.items?.map(i => `${i.quantity}x ${i.foodItem?.name || 'Item'}`).join(', ')}
              </p>
              {order.cancellation?.isCancelled && order.cancellation.reason && (
                <p
                  className="mt-2 inline-flex max-w-full items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-sans"
                  style={{ background: '#FEF2F2', color: '#991B1B' }}
                >
                  <span className="font-bold">Reason:</span>
                  <span className="truncate">
                    {order.cancellation.cancelledBy === 'partner' ? 'Restaurant: ' : ''}
                    {order.cancellation.reason}
                  </span>
                </p>
              )}
            </div>
            <p className="font-serif text-2xl font-bold" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-base)' }}>
              ₹{Number(order.pricing?.totalAmount || 0).toFixed(2)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isActive ? (
              <button
                onClick={() => onTrack(order._id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-6 font-bold font-sans text-sm transition-all hover:opacity-90 md:flex-none"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                <Truck className="h-4 w-4" /> Track Order
              </button>
            ) : (
              <button
                onClick={() => onReorder(order)}
                disabled={reordering}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-6 font-bold font-sans text-sm transition-all hover:opacity-80 disabled:opacity-50 md:flex-none"
                style={{ background: 'rgba(255,106,0,0.1)', color: 'var(--color-primary)' }}
              >
                <RefreshCw className={`h-4 w-4 ${reordering ? 'animate-spin' : ''}`} /> Reorder
              </button>
            )}
            <button
              onClick={() => onDetails(order._id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-6 font-bold font-sans text-sm transition-all md:flex-none"
              style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)', border: '1px solid var(--color-border-light)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-muted)'}
            >
              View Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
const OrderHistory = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [reorderingId, setReorderingId] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1 })

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API_ENDPOINTS.order.getAll}?page=${page}&limit=10`, axiosConfig)
        if (cancelled) return
        setOrders(res.data.orders || [])
        setPagination(res.data.pagination || { totalCount: 0, totalPages: 1 })
      } catch {
        showError('Failed to load orders')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [page])

  const filtered = orders.filter(o => {
    const q = searchTerm.toLowerCase()
    const matchSearch = o._id?.toLowerCase().includes(q) || o.deliveryAddress?.fullName?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleReorder = async (order) => {
    const items = order.items || []
    if (items.length === 0) {
      showError('This order has no items to reorder')
      return
    }

    setReorderingId(order._id)
    try {
      for (const item of items) {
        const foodItemId = item.foodItem?._id || item.foodItem
        if (!foodItemId) continue
        const result = await addToCart(foodItemId, item.quantity || 1, item.specialInstructions || '')
        if (!result?.success) {
          showError(result?.error || 'Some items could not be added to the cart')
          return
        }
      }
      showSuccess('Items added to your cart')
      navigate('/cart')
    } finally {
      setReorderingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin" style={{ color: 'var(--color-primary)' }} />
            <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>Loading your orders…</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

          {/* Header */}
          <div className="mb-10 space-y-1">
            <h1 className="font-serif text-5xl font-bold" style={{ color: 'var(--color-text-base)' }}>
              Order History
            </h1>
            <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>
              Manage your previous culinary experiences and track active deliveries.
            </p>
          </div>

          {/* Filters */}
          <div
            className="mb-8 flex flex-cols-1 gap-4 rounded-2xl p-5 md:flex-cols-2"
            style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="relative flex-2 ">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
              <input
                type="text"
                placeholder="Search by order ID or name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl py-3 pl-10 pr-4 text-sm font-sans outline-none transition"
                style={{
                  background: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-base)',
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl py-3 px-4 text-sm font-sans outline-none flex-1"
              style={{
                background: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border-light)',
                color: 'var(--color-text-base)',
              }}
            >
              <option value="all">All Orders</option>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-3xl py-20 text-center"
              style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)' }}
            >
              <ShoppingBag className="mx-auto mb-4 h-14 w-14" style={{ color: 'var(--color-text-faint)' }} />
              <h3 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--color-text-base)' }}>No Orders Found</h3>
              <p className="mb-6 font-sans" style={{ color: 'var(--color-text-muted)' }}>
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter' : "You haven't placed any orders yet"}
              </p>
              <button
                onClick={() => navigate('/')}
                className="rounded-xl px-8 py-3 font-bold font-sans transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onTrack={(id) => navigate(`/order/tracking/${id}`)}
                  onDetails={(id) => navigate(`/order/confirmation/${id}`, { state: { orderId: id } })}
                  onReorder={handleReorder}
                  reordering={reorderingId === order._id}
                />
              ))}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-xl px-5 py-2.5 font-bold font-sans text-sm disabled:opacity-40"
                    style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)', border: '1px solid var(--color-border-light)' }}
                  >
                    Previous
                  </button>
                  <span className="font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Page {pagination.currentPage || page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="rounded-xl px-5 py-2.5 font-bold font-sans text-sm disabled:opacity-40"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderHistory