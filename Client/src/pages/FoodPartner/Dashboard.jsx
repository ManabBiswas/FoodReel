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
import {
  Plus, ShoppingBag, Megaphone, TrendingUp, TrendingDown,
  IndianRupee, AlertCircle, Package, Clock, ChefHat,
  CheckCircle, XCircle, RefreshCw, Search,
  List, Heart, MessageCircle, Activity, BarChart2
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
              className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50 transition-colors">
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

  const [orders, setOrders]               = useState([])
  const [statistics, setStatistics]       = useState(null)
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [error, setError]                 = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [searchTerm, setSearchTerm]       = useState('')
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [activeTab, setActiveTab]         = useState('overview')

  /* ── fetch data ─────────────────────────────────────────── */
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError('')

      const [authRes, foodRes, ordersRes] = await Promise.all([
        axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig),
        axios.get(API_ENDPOINTS.food.myPosts, axiosConfig),
        axios.get(API_ENDPOINTS.order.partner, axiosConfig).catch(() => ({ data: { orders: [] } }))
      ])

      setPartnerProfile(authRes.data?.foodPartner)

      const grouped = foodRes.data?.foods || {}
      const foodPosts = (grouped.food || []).map((p) => ({
        ...p,
        likeCount: p.likeCount || p.likes?.length || 0,
        commentCount: p.commentCount || p.comments?.length || 0,
        savesCount: p.savesCount || p.saves?.length || 0
      }))
      const myAds = (grouped.advertisement || []).map((a) => ({
        ...a,
        likeCount: a.likeCount || a.likes?.length || 0,
        commentCount: a.commentCount || a.comments?.length || 0
      }))

      const ordersData = ordersRes.data?.orders || []
      setOrders(ordersData)

      const completed = (o) => ['completed', 'delivered'].includes(o.status)
      setStatistics({
        food: {
          count: foodPosts.length,
          totalLikes: foodPosts.reduce((s, p) => s + p.likeCount, 0),
          totalReviews: foodPosts.reduce((s, p) => s + p.commentCount, 0),
          totalSaves: foodPosts.reduce((s, p) => s + p.savesCount, 0)
        },
        advertisement: {
          count: myAds.length,
          totalLikes: myAds.reduce((s, a) => s + a.likeCount, 0),
          totalComments: myAds.reduce((s, a) => s + a.commentCount, 0)
        },
        orders: {
          total: ordersData.length,
          pending: ordersData.filter((o) => o.status === 'pending').length,
          confirmed: ordersData.filter((o) => o.status === 'confirmed').length,
          preparing: ordersData.filter((o) => o.status === 'preparing').length,
          ready: ordersData.filter((o) => o.status === 'ready').length,
          completed: ordersData.filter(completed).length,
          cancelled: ordersData.filter((o) => o.status === 'cancelled').length,
          revenue: ordersData.filter(completed).reduce((s, o) => s + (o.pricing?.totalAmount || o.totalAmount || 0), 0),
          totalRevenue: ordersData.reduce((s, o) => s + (o.pricing?.totalAmount || o.totalAmount || 0), 0)
        }
      })

      if (isRefresh) showSuccess('Dashboard refreshed')
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      if (err.response?.status === 401) {
        showError('Session expired. Please login again.')
        setTimeout(() => navigate('/partner-login'), 2000)
      } else {
        const msg = err.response?.data?.message || 'Failed to load dashboard data'
        setError(msg)
        showError(msg)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  /* ── order action handlers ──────────────────────────────── */
  const handleRefresh = useCallback(() => fetchDashboardData(true), [fetchDashboardData])

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      await axios.put(API_ENDPOINTS.order.updateStatus(orderId), { status: newStatus }, axiosConfig)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)))
      showSuccess(`Order marked as ${newStatus}`)
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update order status')
    } finally { setUpdatingOrder(null) }
  }, [])

  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      setUpdatingOrder(orderId)
      await axios.post(API_ENDPOINTS.order.partnerCancel(orderId), {}, axiosConfig)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o)))
      showSuccess('Order cancelled')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel order')
    } finally { setUpdatingOrder(null) }
  }, [])

  const handleViewDetails = useCallback(
    (orderId) => navigate(`/order/confirmation/${orderId}`),
    [navigate]
  )

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
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        day: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        dateStr: d.toLocaleDateString('en-IN'),
        'Revenue (₹)': 0,
        Orders: 0
      }
    })
    orders.forEach((o) => {
      const slot = days.find((d) => d.dateStr === new Date(o.createdAt).toLocaleDateString('en-IN'))
      if (slot) {
        slot['Revenue (₹)'] += o.pricing?.totalAmount || o.totalAmount || 0
        slot.Orders += 1
      }
    })
    return days
  }, [orders])

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
  if (loading) {
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
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard
