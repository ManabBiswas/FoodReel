import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { showError, showSuccess } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import { usePartnerData } from '../../hooks/usePartnerData'
import {
  Plus, ShoppingBag, Megaphone, TrendingUp, TrendingDown,
  IndianRupee, AlertCircle, Package, Clock, ChefHat,
  CheckCircle, XCircle, RefreshCw, Search,
  List, Heart, MessageCircle, Activity, BarChart2,
  Star, Trash2, Edit3, Eye, Send, FileText, ChevronLeft, ChevronRight
} from 'lucide-react'

/* ─── helpers ────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
const fmtCur = (n) => `₹${fmt(n)}`

const STATUS_CFG = {
  pending:   { icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500'   },
  confirmed: { icon: CheckCircle, color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'    },
  preparing: { icon: ChefHat,     color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-500'  },
  ready:     { icon: CheckCircle, color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200',   dot: 'bg-teal-500'    },
  delivered: { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500'   },
  completed: { icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500'   },
  cancelled: { icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'     },
}

/* ─── KPI Card ───────────────────────────────────────────── */
const KPICard = ({ title, value, subtitle, from, to, icon, trend }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${from} ${to} text-white shadow-md`}>
    <div className="flex items-start justify-between">
      <div className="bg-white/20 rounded-xl p-2.5">
        {icon && <icon className="w-5 h-5 text-white" />}
      </div>
      {trend != null && (
        <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-xs font-semibold">
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-white/70 text-xs font-medium mt-4">{title}</p>
    <p className="text-2xl font-bold mt-0.5 tracking-tight">{value}</p>
    {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
    <div className="absolute -right-5 -bottom-5 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute -right-1 -bottom-9 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
  </div>
)

/* ─── Mini stat ──────────────────────────────────────────── */
const MiniStat = ({ icon, label, value, cls }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
      {icon && <icon className="w-5 h-5" />}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
)

/* ─── Status badge ───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${c.bg} ${c.color} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {status}
    </span>
  )
}

/* ─── Skeleton card ──────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
    <div className="h-9 w-9 bg-gray-200 rounded-xl mb-4" />
    <div className="h-3 bg-gray-200 rounded w-28 mb-2" />
    <div className="h-6 bg-gray-200 rounded w-20" />
  </div>
)

/* ─── Chart tooltip ──────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? (p.name.includes('₹') ? `₹${p.value.toFixed(2)}` : p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

/* ─── Order row ──────────────────────────────────────────── */
const OrderRow = ({ order, onViewDetails, onStatusUpdate, onCancelOrder, updating }) => {
  const customerName = order.user
    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer'
    : order.deliveryAddress?.fullName || 'Customer'
  const amount = order.pricing?.totalAmount || order.totalAmount || 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* ID + date */}
        <div className="md:w-36 flex-shrink-0">
          <p className="text-xs font-mono text-gray-400">#{order._id?.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            {' · '}
            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Customer */}
        <div className="md:w-40 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{customerName}</p>
          <p className="text-xs text-gray-400 truncate">{order.user?.mobile || order.deliveryAddress?.phone || ''}</p>
        </div>

        {/* Items */}
        <div className="flex-1 min-w-0">
          {(order.items || []).slice(0, 2).map((item, i) => (
            <p key={i} className="text-sm text-gray-700 truncate">
              <span className="font-semibold text-orange-500">{item.quantity}×</span>{' '}
              {item.foodItem?.name || 'Item'}
            </p>
          ))}
          {(order.items?.length || 0) > 2 && (
            <p className="text-xs text-gray-400">+{order.items.length - 2} more</p>
          )}
          {order.cancellation?.isCancelled && order.cancellation.reason && (
            <p className="mt-1 inline-flex max-w-full items-start gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] text-red-700">
              <span className="font-bold">
                {order.cancellation.cancelledBy === 'partner' ? 'You: ' : 'Customer: '}
              </span>
              <span className="truncate">{order.cancellation.reason}</span>
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="md:w-24 flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">{fmtCur(amount)}</p>
        </div>

        {/* Status */}
        <div className="md:w-28 flex-shrink-0">
          <StatusBadge status={order.status} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <button
            onClick={() => onViewDetails(order._id)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Details
          </button>
          {order.status === 'pending' && (
            <button onClick={() => onStatusUpdate(order._id, 'confirmed')} disabled={updating}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors">
              {updating ? '…' : 'Confirm'}
            </button>
          )}
          {order.status === 'confirmed' && (
            <button onClick={() => onStatusUpdate(order._id, 'preparing')} disabled={updating}
              className="px-3 py-1.5 text-xs font-semibold bg-violet-500 hover:bg-violet-600 text-white rounded-lg disabled:opacity-50 transition-colors">
              {updating ? '…' : 'Prepare'}
            </button>
          )}
          {order.status === 'preparing' && (
            <button onClick={() => onStatusUpdate(order._id, 'ready')} disabled={updating}
              className="px-3 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-lg disabled:opacity-50 transition-colors">
              {updating ? '…' : 'Ready'}
            </button>
          )}
          {['pending', 'confirmed', 'preparing'].includes(order.status) && (
            <button onClick={() => onCancelOrder(order._id)} disabled={updating}
              className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50 transition-colors cursor-pointer">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Empty state ────────────────────────────────────────── */
const EmptyState = ({ filtered }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Package className="w-10 h-10 text-gray-300" />
    </div>
    <h3 className="text-lg font-semibold text-gray-700">
      {filtered ? 'No matching orders' : 'No orders yet'}
    </h3>
    <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">
      {filtered
        ? 'Try adjusting your search or filter.'
        : 'Orders placed by customers will appear here.'}
    </p>
  </div>
)

/* ═══════════════════════════════════════════════════════════
   Main Dashboard
═══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate()
  const { partnerProfile, posts, loading, refreshing, refresh } = usePartnerData()

  const [orders, setOrders] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [orderLoading, setOrderLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState(null)
  const [responseText, setResponseText] = useState('')

  // Content management state
  const [contentFilter, setContentFilter] = useState('all') // all, food, advertisement
  const [deletingId, setDeletingId] = useState(null)
  const [orderPage, setOrderPage] = useState(1)
  const [orderPagination, setOrderPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 })
  const [revenueByDay, setRevenueByDay] = useState([])

  /**
   * Fetch only orders from backend
   * Partner profile and posts come from context
   */
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setOrderLoading(true)
      setError('')

      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_ENDPOINTS.order.partner}?page=${page}&limit=20`, axiosConfig),
        axios.get(API_ENDPOINTS.order.statistics, axiosConfig)
      ])
      const ordersData = ordersRes.data?.orders || []
      setOrders(ordersData)
      setOrderPagination(ordersRes.data?.pagination || { currentPage: page, totalPages: 1, totalCount: ordersData.length })

      const byStatus = {}
      let totalCountAll = 0
      let totalRevenueAll = 0
      for (const row of statsRes.data?.statistics?.byStatus || []) {
        byStatus[row._id] = row.count
        totalCountAll += row.count
        totalRevenueAll += row.totalRevenue || 0
      }
      setRevenueByDay(statsRes.data?.statistics?.revenueByDay || [])

      const foodPosts = posts?.food || []
      const adPosts = posts?.advertisement || []

      setStatistics({
        food: {
          count: foodPosts.length,
          totalLikes: foodPosts.reduce((s, p) => s + (p.likeCount || p.likes?.length || 0), 0),
          totalReviews: foodPosts.reduce((s, p) => s + (p.commentCount || p.comments?.length || 0), 0),
          totalSaves: foodPosts.reduce((s, p) => s + (p.savesCount || p.saves?.length || 0), 0)
        },
        advertisement: {
          count: adPosts.length,
          totalLikes: adPosts.reduce((s, a) => s + (a.likeCount || a.likes?.length || 0), 0),
          totalComments: adPosts.reduce((s, a) => s + (a.commentCount || a.comments?.length || 0), 0)
        },
        orders: {
          total: totalCountAll,
          pending: byStatus.pending || 0,
          confirmed: byStatus.confirmed || 0,
          preparing: byStatus.preparing || 0,
          ready: byStatus.ready || 0,
          completed: byStatus.delivered || 0,
          cancelled: byStatus.cancelled || 0,
          revenue: statsRes.data?.statistics?.delivered?.deliveredRevenue || 0,
          totalRevenue: totalRevenueAll
        }
      })
    } catch (err) {
      console.error('Orders fetch error:', err)
      if (err.response?.status === 401) {
        showError('Session expired. Please login again.')
        setTimeout(() => navigate('/partner-login'), 2000)
      } else {
        const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to load orders'
        setError(msg)
        showError(msg)
      }
    } finally {
      setOrderLoading(false)
    }
  }, [posts, navigate])

  useEffect(() => {
    fetchOrders(orderPage)
  }, [fetchOrders, orderPage])

  /* ── order action handlers ──────────────────────────────── */
  const handleRefresh = useCallback(async () => {
    refresh()
    await fetchOrders(orderPage)
    showSuccess('Dashboard refreshed')
  }, [refresh, fetchOrders, orderPage])

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      await axios.put(API_ENDPOINTS.order.updateStatus(orderId), { status: newStatus }, axiosConfig)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)))
      showSuccess(`Order marked as ${newStatus}`)
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to update order status')
    } finally { setUpdatingOrder(null) }
  }, [])

  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)

  const handleCancelOrder = useCallback(async (reason) => {
    if (!cancelTarget) return
    try {
      setCancellingOrder(true)
      await axios.post(API_ENDPOINTS.order.partnerCancel(cancelTarget), { reason }, axiosConfig)
      setOrders((prev) => prev.map((o) => (
        o._id === cancelTarget
          ? { ...o, status: 'cancelled', cancellation: { ...(o.cancellation || {}), isCancelled: true, cancelledBy: 'partner', reason } }
          : o
      )))
      setCancelTarget(null)
      showSuccess('Order cancelled')
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel order')
    } finally { setCancellingOrder(false) }
  }, [cancelTarget])

  const handleViewDetails = useCallback(
    (orderId) => navigate(`/order/${orderId}`),
    [navigate]
  )

  /* ── Reviews handlers ───────────────────────────────────── */
  const fetchReviews = useCallback(async () => {
    if (!partnerProfile?._id) return
    try {
      setReviewsLoading(true)
      const res = await axios.get(API_ENDPOINTS.reviews.byPartner(partnerProfile._id), axiosConfig)
      const list = res.data?.reviews || res.data?.data || []
      setReviews(list.map((r) => ({ ...r, partnerResponse: r.partnerResponse || r.response?.text || '' })))
    } catch (err) {
      console.error('Reviews fetch error:', err)
    } finally { setReviewsLoading(false) }
  }, [partnerProfile])

  useEffect(() => { if (activeTab === 'reviews') fetchReviews() }, [activeTab, fetchReviews])

  const handleRespondToReview = useCallback(async (reviewId) => {
    if (!responseText.trim()) return
    try {
      await axios.post(API_ENDPOINTS.reviews.respond(reviewId), { text: responseText.trim() }, axiosConfig)
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, partnerResponse: responseText.trim(), response: { text: responseText.trim() } } : r))
      setRespondingTo(null)
      setResponseText('')
      showSuccess('Response posted')
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to respond')
    }
  }, [responseText])

  /* ── Content management handlers ────────────────────────── */
  const allContent = useMemo(() => {
    const food = (posts?.food || []).map(p => ({ ...p, _type: 'food' }))
    const ads = (posts?.advertisement || []).map(p => ({ ...p, _type: 'advertisement' }))
    if (contentFilter === 'food') return food
    if (contentFilter === 'advertisement') return ads
    return [...food, ...ads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [posts, contentFilter])

  const handleDeletePost = useCallback(async (id, type) => {
    try {
      setDeletingId(id)
      if (type === 'advertisement') {
        await axios.delete(API_ENDPOINTS.advertisement.delete(id), axiosConfig)
      } else {
        await axios.delete(API_ENDPOINTS.food.delete(id), axiosConfig)
      }
      showSuccess('Post deleted')
      refresh() // refresh context data
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete')
    } finally { setDeletingId(null) }
  }, [refresh])

  /* ── derived / chart data ───────────────────────────────── */
  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase()
    let list = orders

    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter)
    if (term) {
      list = list.filter((o) =>
        o._id.toLowerCase().includes(term) ||
        `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.toLowerCase().includes(term)
      )
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders, statusFilter, searchTerm])

  const revenueChartData = useMemo(() => {
    const byDate = new Map((revenueByDay || []).map(row => [row._id, row]))
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const key = `${yyyy}-${mm}-${dd}`
      const row = byDate.get(key)
      return {
        day: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        'Revenue (₹)': row?.revenue || 0,
        Orders: row?.orders || 0
      }
    })
    return days
  }, [revenueByDay])

  const ordersBarData = useMemo(() => {
    if (!statistics) return []
    return [
      { name: 'Pending',   value: statistics.orders.pending,   fill: '#F59E0B' },
      { name: 'Confirmed', value: statistics.orders.confirmed, fill: '#3B82F6' },
      { name: 'Preparing', value: statistics.orders.preparing, fill: '#8B5CF6' },
      { name: 'Ready',     value: statistics.orders.ready,     fill: '#14B8A6' },
      { name: 'Completed', value: statistics.orders.completed, fill: '#22C55E' },
      { name: 'Cancelled', value: statistics.orders.cancelled, fill: '#EF4444' },
    ].filter((d) => d.value > 0)
  }, [statistics])

  const statusPieData = useMemo(() => ordersBarData, [ordersBarData])

  /* ── loading skeleton ───────────────────────────────────── */
  if (loading || orderLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="h-9 bg-gray-200 rounded-xl w-64 animate-pulse mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl h-72 animate-pulse" />
            <div className="bg-white rounded-2xl h-72 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'orders',   label: `Orders${statistics ? ` (${statistics.orders.total})` : ''}`, icon: List },
    { id: 'content',  label: 'My Content', icon: FileText },
    { id: 'reviews',  label: 'Reviews', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* ══ Header ══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {partnerProfile?.companyName || 'Partner Dashboard'}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => navigate('/CreateFood')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* ══ Error banner ══ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={handleRefresh} className="text-xs font-semibold text-red-600 hover:text-red-800">
              Retry
            </button>
          </div>
        )}

        {/* ══ Tabs ══ */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-8 w-fit shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════
            OVERVIEW TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'overview' && statistics && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <KPICard
                title="Completed Revenue"
                value={fmtCur(statistics.orders.revenue)}
                subtitle={`${statistics.orders.completed} completed orders`}
                from="from-orange-500" to="to-amber-500"
                icon={IndianRupee}
              />
              <KPICard
                title="Active Orders"
                value={statistics.orders.pending + statistics.orders.confirmed + statistics.orders.preparing}
                subtitle={`${statistics.orders.pending} pending right now`}
                from="from-blue-500" to="to-indigo-600"
                icon={Package}
              />
              <KPICard
                title="Food Items"
                value={statistics.food.count}
                subtitle={`${statistics.food.totalLikes} total likes`}
                from="from-emerald-500" to="to-teal-600"
                icon={ShoppingBag}
              />
              <KPICard
                title="Engagement"
                value={fmt(
                  statistics.food.totalLikes + statistics.food.totalReviews + statistics.food.totalSaves +
                  statistics.advertisement.totalLikes + statistics.advertisement.totalComments
                )}
                subtitle={`${statistics.advertisement.count} ads running`}
                from="from-violet-500" to="to-purple-600"
                icon={Activity}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Area chart — revenue & orders (takes 2/3) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Revenue & Orders</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />Revenue
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />Orders
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F97316" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="Revenue (₹)" stroke="#F97316" strokeWidth={2.5} fill="url(#gRev)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="Orders"      stroke="#3B82F6" strokeWidth={2.5} fill="url(#gOrd)" dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Donut + bar — order status (1/3) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Order Status</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Current distribution</p>
                </div>
                {statusPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                          {statusPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-3">
                      {statusPieData.map((s) => (
                        <div key={s.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-gray-600">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.fill }} />
                            {s.name}
                          </span>
                          <span className="font-semibold text-gray-900">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                    <Package className="w-10 h-10 mb-2" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Orders by status bar chart */}
            {ordersBarData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Orders by Status</h3>
                  <p className="text-xs text-gray-400 mt-0.5">All-time breakdown</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ordersBarData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: '#F9FAFB' }} />
                    <Bar dataKey="value" name="Orders" radius={[6, 6, 0, 0]}>
                      {ordersBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Content + engagement mini stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <MiniStat icon={ShoppingBag}   label="Food Posts"     value={statistics.food.count}               cls="bg-emerald-50 text-emerald-600" />
              <MiniStat icon={Megaphone}     label="Ads Running"    value={statistics.advertisement.count}      cls="bg-violet-50 text-violet-600" />
              <MiniStat icon={Heart}         label="Total Likes"    value={fmt(statistics.food.totalLikes + statistics.advertisement.totalLikes)}  cls="bg-pink-50 text-pink-600" />
              <MiniStat icon={MessageCircle} label="Total Comments" value={fmt(statistics.food.totalReviews + statistics.advertisement.totalComments)} cls="bg-blue-50 text-blue-600" />
            </div>

            {/* Recent 5 orders */}
            {orders.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-orange-500 hover:text-orange-700 flex items-center gap-1"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {[...orders]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map((order) => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        onViewDetails={handleViewDetails}
                        onStatusUpdate={handleStatusUpdate}
                        onCancelOrder={handleCancelOrder}
                        updating={updatingOrder === order._id}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════
            ORDERS TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div>
            {/* Status summary pills (clickable filter) */}
            {statistics && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {[
                  { label: 'Total',     val: statistics.orders.total,     borderActive: 'border-gray-400'   },
                  { label: 'Pending',   val: statistics.orders.pending,   borderActive: 'border-amber-400'  },
                  { label: 'Confirmed', val: statistics.orders.confirmed, borderActive: 'border-blue-400'   },
                  { label: 'Preparing', val: statistics.orders.preparing, borderActive: 'border-violet-400' },
                  { label: 'Completed', val: statistics.orders.completed, borderActive: 'border-green-400'  },
                  { label: 'Cancelled', val: statistics.orders.cancelled, borderActive: 'border-red-400'    },
                ].map((s) => {
                  const isActive = s.label === 'Total' ? statusFilter === 'all' : statusFilter === s.label.toLowerCase()
                  return (
                    <button
                      key={s.label}
                      onClick={() => setStatusFilter(s.label === 'Total' ? 'all' : s.label.toLowerCase())}
                      className={`bg-white rounded-xl p-3 border-2 text-center transition-all hover:shadow-sm ${
                        isActive ? `${s.borderActive} shadow-sm` : 'border-transparent'
                      }`}
                    >
                      <p className="text-xl font-bold text-gray-900">{s.val}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 px-4 py-3 mb-4">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by order ID or customer name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 text-xs">
                  ✕
                </button>
              )}
            </div>

            {/* Order list */}
            {filteredOrders.length === 0 ? (
              <EmptyState filtered={orders.length > 0} />
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    onViewDetails={handleViewDetails}
                    onStatusUpdate={handleStatusUpdate}
                    onCancelOrder={handleCancelOrder}
                    updating={updatingOrder === order._id}
                  />
                ))}
                {orderPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                      onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                      disabled={orderPage <= 1}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {orderPagination.currentPage} of {orderPagination.totalPages}
                    </span>
                    <button
                      onClick={() => setOrderPage(p => Math.min(orderPagination.totalPages, p + 1))}
                      disabled={orderPage >= orderPagination.totalPages}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            CONTENT TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'content' && (
          <div>
            {/* Filter pills */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'all', label: 'All Posts' },
                { id: 'food', label: `Food (${posts?.food?.length || 0})` },
                { id: 'advertisement', label: `Ads (${posts?.advertisement?.length || 0})` },
              ].map(f => (
                <button key={f.id} onClick={() => setContentFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${contentFilter === f.id ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {f.label}
                </button>
              ))}
              <button onClick={() => navigate('/CreateFood')} className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:shadow-md flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Post
              </button>
            </div>

            {allContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">No content yet</h3>
                <p className="text-sm text-gray-400 mt-1">Create your first food post or advertisement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allContent.map(item => (
                  <div key={item._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-all">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.video ? (
                        <video src={item.video} className="w-full h-full object-cover" muted />
                      ) : item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FileText className="w-6 h-6 text-gray-300" /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name || item.title || 'Untitled'}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          item._type === 'food' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'
                        }`}>{item._type === 'food' ? 'Food' : 'Ad'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {item.price && <span className="font-semibold text-gray-600">₹{item.price}</span>}
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {item.likeCount || item.likes?.length || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {item.commentCount || item.comments?.length || 0}</span>
                        {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => navigate(`/CreateFood?edit=${item._id}&type=${item._type}`)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(item._id, item._type)}
                        disabled={deletingId === item._id}
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                        title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            REVIEWS TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div>
            {reviewsLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Star className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">No reviews yet</h3>
                <p className="text-sm text-gray-400 mt-1">Customer reviews will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-2">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-black text-gray-900">
                        {(reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)}
                      </p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-500">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-gray-400 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Review cards */}
                {reviews.map(review => (
                  <div key={review._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-bold text-sm">
                          {(review.user?.firstName || review.user?.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {review.user?.firstName || review.user?.name || 'Customer'}
                          </p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-300 ml-auto">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {review.title && <p className="text-sm font-medium text-gray-700 mb-0.5">{review.title}</p>}
                        {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}

                        {/* Partner response */}
                        {review.partnerResponse ? (
                          <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
                            <p className="text-xs font-semibold text-orange-600 mb-1">Your Response</p>
                            <p className="text-sm text-gray-700">{review.partnerResponse}</p>
                          </div>
                        ) : (
                          <div className="mt-3">
                            {respondingTo === review._id ? (
                              <div className="flex gap-2">
                                <input type="text" placeholder="Write your response…" value={responseText}
                                  onChange={e => setResponseText(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleRespondToReview(review._id)}
                                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-orange-300" />
                                <button onClick={() => handleRespondToReview(review._id)}
                                  className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition flex items-center gap-1">
                                  <Send className="w-3.5 h-3.5" /> Send
                                </button>
                                <button onClick={() => { setRespondingTo(null); setResponseText('') }}
                                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => { setRespondingTo(review._id); setResponseText('') }}
                                className="text-xs font-semibold text-orange-500 hover:text-orange-700 flex items-center gap-1 mt-1">
                                <MessageCircle className="w-3.5 h-3.5" /> Respond
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <CancelOrderDialog
        open={!!cancelTarget}
        mode="partner"
        cancelling={cancellingOrder}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelOrder}
      />
    </div>
  )
}

export default Dashboard
