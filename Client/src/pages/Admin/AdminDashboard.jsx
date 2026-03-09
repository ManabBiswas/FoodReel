import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import {
  LayoutDashboard, Users, Store, FileText, LogOut, TrendingUp,
  ShoppingBag, AlertCircle, CheckCircle, Menu, X, IndianRupee,
  RefreshCw, Search, Shield, ShieldOff, Ban, Trash2, Eye,
  Star, MessageSquare, BarChart3, ChevronLeft, ChevronRight,
  Package, Clock, XCircle, Megaphone
} from 'lucide-react'

/* ── helpers ─────────────────────────────────────────── */
const fmtCur = n => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)}`
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-violet-100 text-violet-700', ready: 'bg-teal-100 text-teal-700',
  delivered: 'bg-green-100 text-green-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

/* ── reusable tiny components ────────────────────────── */
const Spinner = () => <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" /></div>
const ErrBox = ({ msg, onRetry }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-6">
    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
    <p className="text-red-700 text-sm flex-1">{msg}</p>
    {onRetry && <button onClick={onRetry} className="text-xs font-semibold text-red-600 hover:text-red-800">Retry</button>}
  </div>
)
const Empty = ({ text }) => <p className="text-gray-400 text-sm text-center py-16">{text}</p>
const Pagination = ({ page, pages, setPage }) => pages > 1 && (
  <div className="flex items-center justify-center gap-2 mt-6">
    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
    <span className="text-sm text-gray-600 font-medium px-3">Page {page} of {pages}</span>
    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
  </div>
)
const Confirm = ({ msg, onYes, onNo }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
      <p className="text-gray-800 font-medium mb-5">{msg}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onNo} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
        <button onClick={onYes} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">Confirm</button>
      </div>
    </div>
  </div>
)

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Overview state
  const [dashboardStats, setDashboardStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(true)

  // Shared
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null) // { msg, fn }

  /* ── OVERVIEW fetch ─────────────────────────────────── */
  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true); setError('')
      const [statsRes, ordersRes] = await Promise.all([
        axios.get(API_ENDPOINTS.admin.dashboard, axiosConfig),
        axios.get(`${API_ENDPOINTS.admin.orders}?limit=5&page=1`, axiosConfig)
      ])
      setDashboardStats(statsRes.data.stats)
      setRecentOrders(ordersRes.data.orders || [])
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load dashboard')
    } finally { setOverviewLoading(false) }
  }, [navigate])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  /* ── USERS state & fetch ────────────────────────────── */
  const [users, setUsers] = useState([])
  const [usersPag, setUsersPag] = useState({ page: 1, pages: 1, total: 0 })
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)

  const fetchUsers = useCallback(async (page = 1, search = '') => {
    try {
      setUsersLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.users}?page=${page}&limit=10&search=${encodeURIComponent(search)}`, axiosConfig)
      setUsers(res.data.users || [])
      setUsersPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load users')
    } finally { setUsersLoading(false) }
  }, [navigate])

  useEffect(() => { if (activeTab === 'users') fetchUsers(usersPage, usersSearch) }, [activeTab, usersPage, usersSearch, fetchUsers])

  const handleUserSearch = () => { setUsersPage(1); fetchUsers(1, usersSearch) }
  const toggleUserBlock = async (id) => {
    try {
      await axios.put(API_ENDPOINTS.admin.toggleUserBlock(id), {}, axiosConfig)
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: !u.isBlocked } : u))
    } catch { setError('Failed to update user') }
  }
  const deleteUser = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteUser(id), axiosConfig)
      setUsers(prev => prev.filter(u => u._id !== id))
    } catch { setError('Failed to delete user') }
  }

  /* ── PARTNERS state & fetch ─────────────────────────── */
  const [partners, setPartners] = useState([])
  const [partnersPag, setPartnersPag] = useState({ page: 1, pages: 1, total: 0 })
  const [partnersPage, setPartnersPage] = useState(1)
  const [partnersSearch, setPartnersSearch] = useState('')
  const [partnersLoading, setPartnersLoading] = useState(false)

  const fetchPartners = useCallback(async (page = 1, search = '') => {
    try {
      setPartnersLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.partners}?page=${page}&limit=10&search=${encodeURIComponent(search)}`, axiosConfig)
      setPartners(res.data.partners || [])
      setPartnersPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load partners')
    } finally { setPartnersLoading(false) }
  }, [navigate])

  useEffect(() => { if (activeTab === 'partners') fetchPartners(partnersPage, partnersSearch) }, [activeTab, partnersPage, partnersSearch, fetchPartners])

  const handlePartnerSearch = () => { setPartnersPage(1); fetchPartners(1, partnersSearch) }
  const togglePartnerVerify = async (id) => {
    try {
      await axios.put(API_ENDPOINTS.admin.togglePartnerVerify(id), {}, axiosConfig)
      setPartners(prev => prev.map(p => p._id === id ? { ...p, verified: !p.verified } : p))
    } catch { setError('Failed to update partner') }
  }
  const togglePartnerBlock = async (id) => {
    try {
      await axios.put(API_ENDPOINTS.admin.togglePartnerBlock(id), {}, axiosConfig)
      setPartners(prev => prev.map(p => p._id === id ? { ...p, isBlocked: !p.isBlocked } : p))
    } catch { setError('Failed to update partner') }
  }
  const deletePartner = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deletePartner(id), axiosConfig)
      setPartners(prev => prev.filter(p => p._id !== id))
    } catch { setError('Failed to delete partner') }
  }

  /* ── FOOD ITEMS state & fetch ───────────────────────── */
  const [foodItems, setFoodItems] = useState([])
  const [foodPag, setFoodPag] = useState({ page: 1, pages: 1, total: 0 })
  const [foodPage, setFoodPage] = useState(1)
  const [foodLoading, setFoodLoading] = useState(false)

  const fetchFood = useCallback(async (page = 1) => {
    try {
      setFoodLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.foodItems}?page=${page}&limit=10`, axiosConfig)
      setFoodItems(res.data.foodItems || [])
      setFoodPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load food items')
    } finally { setFoodLoading(false) }
  }, [navigate])

  /* ── ADS state & fetch ──────────────────────────────── */
  const [ads, setAds] = useState([])
  const [adsPag, setAdsPag] = useState({ page: 1, pages: 1, total: 0 })
  const [adsPage, setAdsPage] = useState(1)
  const [adsLoading, setAdsLoading] = useState(false)

  const fetchAds = useCallback(async (page = 1) => {
    try {
      setAdsLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.advertisements}?page=${page}&limit=10`, axiosConfig)
      setAds(res.data.advertisements || [])
      setAdsPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load advertisements')
    } finally { setAdsLoading(false) }
  }, [navigate])

  const [contentSubTab, setContentSubTab] = useState('food')
  useEffect(() => {
    if (activeTab === 'content') {
      if (contentSubTab === 'food') fetchFood(foodPage)
      else fetchAds(adsPage)
    }
  }, [activeTab, contentSubTab, foodPage, adsPage, fetchFood, fetchAds])

  const approveFoodItem = async (id, approve) => {
    try {
      await axios.put(API_ENDPOINTS.admin.approveFoodItem(id), { approve }, axiosConfig)
      setFoodItems(prev => prev.map(f => f._id === id ? { ...f, isActive: approve } : f))
    } catch { setError('Failed to update food item') }
  }
  const deleteFoodItem = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteFoodItem(id), axiosConfig)
      setFoodItems(prev => prev.filter(f => f._id !== id))
    } catch { setError('Failed to delete food item') }
  }
  const approveAd = async (id, approve) => {
    try {
      await axios.put(API_ENDPOINTS.admin.approveAdvertisement(id), { approve }, axiosConfig)
      setAds(prev => prev.map(a => a._id === id ? { ...a, isActive: approve } : a))
    } catch { setError('Failed to update advertisement') }
  }
  const deleteAd = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteAdvertisement(id), axiosConfig)
      setAds(prev => prev.filter(a => a._id !== id))
    } catch { setError('Failed to delete advertisement') }
  }

  /* ── ORDERS state & fetch ───────────────────────────── */
  const [allOrders, setAllOrders] = useState([])
  const [ordersPag, setOrdersPag] = useState({ page: 1, pages: 1, total: 0 })
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersStatus, setOrdersStatus] = useState('all')
  const [ordersLoading, setOrdersLoading] = useState(false)

  const fetchOrders = useCallback(async (page = 1, status = 'all') => {
    try {
      setOrdersLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.orders}?page=${page}&limit=10&status=${status}`, axiosConfig)
      setAllOrders(res.data.orders || [])
      setOrdersPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load orders')
    } finally { setOrdersLoading(false) }
  }, [navigate])

  useEffect(() => { if (activeTab === 'orders') fetchOrders(ordersPage, ordersStatus) }, [activeTab, ordersPage, ordersStatus, fetchOrders])

  /* ── REVIEWS state & fetch ──────────────────────────── */
  const [reviews, setReviews] = useState([])
  const [reviewsPag, setReviewsPag] = useState({ page: 1, pages: 1, total: 0 })
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setReviewsLoading(true); setError('')
      const res = await axios.get(`${API_ENDPOINTS.admin.reviews}?page=${page}&limit=10`, axiosConfig)
      setReviews(res.data.reviews || [])
      setReviewsPag(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load reviews')
    } finally { setReviewsLoading(false) }
  }, [navigate])

  useEffect(() => { if (activeTab === 'reviews') fetchReviews(reviewsPage) }, [activeTab, reviewsPage, fetchReviews])

  const deleteReview = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.admin.deleteReview(id), axiosConfig)
      setReviews(prev => prev.filter(r => r._id !== id))
    } catch { setError('Failed to delete review') }
  }

  /* ── ANALYTICS state & fetch ────────────────────────── */
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true); setError('')
      const [revRes, userRes, partnerRes] = await Promise.all([
        axios.get(API_ENDPOINTS.admin.revenueAnalytics, axiosConfig),
        axios.get(API_ENDPOINTS.admin.userAnalytics, axiosConfig),
        axios.get(API_ENDPOINTS.admin.partnerAnalytics, axiosConfig),
      ])
      setAnalytics({
        revenue: revRes.data.revenueByMonth || [],
        users: userRes.data.analytics || {},
        partners: partnerRes.data.analytics || {},
      })
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin-login')
      else setError('Failed to load analytics')
    } finally { setAnalyticsLoading(false) }
  }, [navigate])

  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics() }, [activeTab, fetchAnalytics])

  /* ── Logout ─────────────────────────────────────────── */
  const handleLogout = async () => {
    try { await axios.post(API_ENDPOINTS.auth.adminLogout, {}, axiosConfig) } catch { /* ignore */ }
    navigate('/admin-login')
  }

  /* ── Sidebar config ─────────────────────────────────── */
  const TABS = [
    { id: 'overview',  label: 'Overview',       icon: LayoutDashboard },
    { id: 'users',     label: 'Users',          icon: Users },
    { id: 'partners',  label: 'Food Partners',  icon: Store },
    { id: 'content',   label: 'Content',        icon: FileText },
    { id: 'orders',    label: 'Orders',         icon: ShoppingBag },
    { id: 'reviews',   label: 'Reviews',        icon: Star },
    { id: 'analytics', label: 'Analytics',      icon: BarChart3 },
  ]

  const TAB_TITLES = {
    overview: 'Dashboard Overview', users: 'User Management', partners: 'Partner Management',
    content: 'Content Moderation', orders: 'Order Management', reviews: 'Review Moderation',
    analytics: 'Analytics & Reports',
  }

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-sans antialiased">
      {confirmAction && <Confirm msg={confirmAction.msg} onYes={() => { confirmAction.fn(); setConfirmAction(null) }} onNo={() => setConfirmAction(null)} />}

      {/* Mobile toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 shadow-lg" aria-label="Toggle sidebar">
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* ── Sidebar ── */}
      <aside className={`fixed right-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 text-white p-6 z-40 transform transition-transform duration-300 shadow-2xl overflow-y-auto ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">FoodReel Admin</h1>
          <p className="text-indigo-200 text-xs mt-1 font-medium uppercase tracking-wider">Dashboard</p>
        </div>
        <nav className="space-y-1.5">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg font-semibold' : 'hover:bg-white/10 font-medium'}`}>
              <tab.icon className="w-5 h-5" />{tab.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="w-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500 transition-colors absolute bottom-6 left-6 right-6">
          <LogOut className="w-5 h-5" /><span className="font-semibold">Logout</span>
        </button>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}

      {/* ── Main ── */}
      <main className="lg:mr-72 p-4 sm:p-8">
        <div className="mb-8 mt-16 lg:mt-0 flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{TAB_TITLES[activeTab]}</h2>
            <p className="text-gray-500 mt-1 text-sm">Welcome back, Admin</p>
          </div>
          <button onClick={() => {
            if (activeTab === 'overview') fetchOverview()
            else if (activeTab === 'users') fetchUsers(usersPage, usersSearch)
            else if (activeTab === 'partners') fetchPartners(partnersPage, partnersSearch)
            else if (activeTab === 'content') contentSubTab === 'food' ? fetchFood(foodPage) : fetchAds(adsPage)
            else if (activeTab === 'orders') fetchOrders(ordersPage, ordersStatus)
            else if (activeTab === 'reviews') fetchReviews(reviewsPage)
            else if (activeTab === 'analytics') fetchAnalytics()
          }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <ErrBox msg={error} onRetry={() => setError('')} />}

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          overviewLoading ? <Spinner /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                  { title: 'Total Users', val: dashboardStats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-500' },
                  { title: 'Food Partners', val: dashboardStats?.totalPartners ?? 0, icon: Store, color: 'bg-green-500' },
                  { title: 'Total Orders', val: dashboardStats?.totalOrders ?? 0, icon: ShoppingBag, color: 'bg-purple-500' },
                  { title: 'Food Items', val: dashboardStats?.totalFoodItems ?? 0, icon: FileText, color: 'bg-orange-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                    <div className={`${s.color} p-3 rounded-lg shadow-md w-fit mb-4`}><s.icon className="w-6 h-6 text-white" /></div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{s.title}</h3>
                    <p className="text-3xl font-black tracking-tight text-gray-900">{s.val.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {dashboardStats && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 mb-8 text-white">
                  <div className="flex items-center gap-3 mb-2"><IndianRupee className="w-6 h-6" /><h3 className="text-lg font-bold">Total Revenue</h3></div>
                  <p className="text-4xl font-black">{fmtCur(dashboardStats.totalRevenue || 0)}</p>
                  <p className="text-indigo-200 text-sm mt-1">{dashboardStats.totalAds || 0} advertisements running</p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">View All →</button>
                </div>
                {recentOrders.length === 0 ? <Empty text="No orders yet" /> : (
                  <div className="space-y-3">
                    {recentOrders.map(order => (
                      <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-center gap-4">
                          <Package className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                          <div>
                            <p className="text-gray-800 text-sm font-semibold">#{order._id?.slice(-8).toUpperCase()}</p>
                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{fmtCur(order.pricing?.totalAmount || order.totalAmount || 0)}</p>
                          <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick nav cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Manage Users', icon: Users, color: 'from-blue-500 to-blue-700', tab: 'users' },
                  { label: 'Food Partners', icon: Store, color: 'from-green-500 to-green-700', tab: 'partners' },
                  { label: 'Content', icon: FileText, color: 'from-orange-500 to-orange-700', tab: 'content' },
                  { label: 'Analytics', icon: TrendingUp, color: 'from-purple-500 to-purple-700', tab: 'analytics' },
                ].map(c => (
                  <button key={c.tab} onClick={() => setActiveTab(c.tab)} className={`bg-gradient-to-br ${c.color} rounded-xl p-5 text-white text-left hover:shadow-xl transition-all`}>
                    <c.icon className="w-7 h-7 mb-3" />
                    <p className="font-bold">{c.label}</p>
                  </button>
                ))}
              </div>
            </>
          )
        )}

        {/* ═══ USERS TAB ═══ */}
        {activeTab === 'users' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 px-4 py-3 mb-6">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name or email…" value={usersSearch}
                onChange={e => setUsersSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUserSearch()}
                className="flex-1 text-sm outline-none bg-transparent" />
              <button onClick={handleUserSearch} className="px-3 py-1.5 text-xs font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Search</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{usersPag.total} users total</p>
            {usersLoading ? <Spinner /> : users.length === 0 ? <Empty text="No users found" /> : (
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">{(user.firstName || user.name || 'U')[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.firstName || user.name || 'User'} {user.lastName || ''}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.isBlocked && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-medium">Blocked</span>}
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => toggleUserBlock(user._id)} title={user.isBlocked ? 'Unblock' : 'Block'}
                        className={`p-2 rounded-lg border transition ${user.isBlocked ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}>
                        {user.isBlocked ? <Shield className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setConfirmAction({ msg: `Delete ${user.firstName || user.name || 'this user'}?`, fn: () => deleteUser(user._id) })} title="Delete"
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={usersPag.page} pages={usersPag.pages} setPage={setUsersPage} />
          </>
        )}

        {/* ═══ PARTNERS TAB ═══ */}
        {activeTab === 'partners' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 px-4 py-3 mb-6">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by restaurant name…" value={partnersSearch}
                onChange={e => setPartnersSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePartnerSearch()}
                className="flex-1 text-sm outline-none bg-transparent" />
              <button onClick={handlePartnerSearch} className="px-3 py-1.5 text-xs font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Search</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{partnersPag.total} partners total</p>
            {partnersLoading ? <Spinner /> : partners.length === 0 ? <Empty text="No partners found" /> : (
              <div className="space-y-3">
                {partners.map(p => (
                  <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.companyName}</p>
                          {p.verified && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{p.email} · {p.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.isBlocked && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-medium">Blocked</span>}
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${p.verified ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{p.verified ? 'Verified' : 'Unverified'}</span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => togglePartnerVerify(p._id)} title={p.verified ? 'Revoke verification' : 'Verify'}
                        className={`p-2 rounded-lg border transition ${p.verified ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                        {p.verified ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                      <button onClick={() => togglePartnerBlock(p._id)} title={p.isBlocked ? 'Unblock' : 'Block'}
                        className={`p-2 rounded-lg border transition ${p.isBlocked ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}>
                        {p.isBlocked ? <Shield className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setConfirmAction({ msg: `Delete partner "${p.companyName}"?`, fn: () => deletePartner(p._id) })} title="Delete"
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={partnersPag.page} pages={partnersPag.pages} setPage={setPartnersPage} />
          </>
        )}

        {/* ═══ CONTENT TAB ═══ */}
        {activeTab === 'content' && (
          <>
            <div className="flex gap-2 mb-6">
              {['food', 'ads'].map(t => (
                <button key={t} onClick={() => setContentSubTab(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition ${contentSubTab === t ? 'bg-indigo-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {t === 'food' ? 'Food Items' : 'Advertisements'}
                </button>
              ))}
            </div>

            {contentSubTab === 'food' && (
              <>
                <p className="text-xs text-gray-400 mb-4">{foodPag.total} food items</p>
                {foodLoading ? <Spinner /> : foodItems.length === 0 ? <Empty text="No food items" /> : (
                  <div className="space-y-3">
                    {foodItems.map(f => (
                      <div key={f._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition">
                        {(f.image || f.video) && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {f.video ? <video src={f.video} className="w-full h-full object-cover" muted /> : <img src={f.image} alt="" className="w-full h-full object-cover" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{f.name || 'Untitled'}</p>
                          <p className="text-xs text-gray-400 truncate">{f.foodPartner?.companyName || 'Unknown partner'} · {f.price ? fmtCur(f.price) : 'No price'}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium flex-shrink-0 ${f.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {f.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex gap-2 flex-shrink-0">
                          {f.isActive ? (
                            <button onClick={() => approveFoodItem(f._id, false)} className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 border border-amber-200">Deactivate</button>
                          ) : (
                            <button onClick={() => approveFoodItem(f._id, true)} className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200">Approve</button>
                          )}
                          <button onClick={() => setConfirmAction({ msg: `Delete "${f.name || 'this item'}"?`, fn: () => deleteFoodItem(f._id) })}
                            className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Pagination page={foodPag.page} pages={foodPag.pages} setPage={setFoodPage} />
              </>
            )}

            {contentSubTab === 'ads' && (
              <>
                <p className="text-xs text-gray-400 mb-4">{adsPag.total} advertisements</p>
                {adsLoading ? <Spinner /> : ads.length === 0 ? <Empty text="No advertisements" /> : (
                  <div className="space-y-3">
                    {ads.map(a => (
                      <div key={a._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition">
                        {a.file && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {a.type === 'video' ? <video src={a.file} className="w-full h-full object-cover" muted /> : <img src={a.file} alt="" className="w-full h-full object-cover" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-violet-500 flex-shrink-0" />
                            <p className="text-sm font-semibold text-gray-800 truncate">{a.name || a.title || 'Ad'}</p>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{a.partnerId?.companyName || 'Unknown'} · {a.promoType || 'Standard'}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium flex-shrink-0 ${a.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex gap-2 flex-shrink-0">
                          {a.isActive ? (
                            <button onClick={() => approveAd(a._id, false)} className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 border border-amber-200">Deactivate</button>
                          ) : (
                            <button onClick={() => approveAd(a._id, true)} className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200">Approve</button>
                          )}
                          <button onClick={() => setConfirmAction({ msg: `Delete this advertisement?`, fn: () => deleteAd(a._id) })}
                            className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Pagination page={adsPag.page} pages={adsPag.pages} setPage={setAdsPage} />
              </>
            )}
          </>
        )}

        {/* ═══ ORDERS TAB ═══ */}
        {activeTab === 'orders' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
                <button key={s} onClick={() => { setOrdersStatus(s); setOrdersPage(1) }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition ${ordersStatus === s ? 'bg-indigo-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-4">{ordersPag.total} orders</p>
            {ordersLoading ? <Spinner /> : allOrders.length === 0 ? <Empty text="No orders found" /> : (
              <div className="space-y-3">
                {allOrders.map(o => (
                  <div key={o._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-mono font-bold text-gray-700">#{o._id?.slice(-8).toUpperCase()}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium capitalize rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {o.user?.name || o.user?.email || 'Unknown user'} → {o.foodPartner?.companyName || 'Unknown partner'}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">{new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{fmtCur(o.pricing?.totalAmount || o.pricing?.grandTotal || o.totalAmount || 0)}</p>
                      <p className="text-xs text-gray-400">{o.items?.length || 0} items</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={ordersPag.page} pages={ordersPag.pages} setPage={setOrdersPage} />
          </>
        )}

        {/* ═══ REVIEWS TAB ═══ */}
        {activeTab === 'reviews' && (
          <>
            <p className="text-xs text-gray-400 mb-4">{reviewsPag.total} reviews</p>
            {reviewsLoading ? <Spinner /> : reviews.length === 0 ? <Empty text="No reviews" /> : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r._id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{r.user?.name || r.user?.email || 'Anonymous'}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < (r.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mb-1">{r.comment}</p>}
                        {r.title && <p className="text-xs text-gray-500 italic">"{r.title}"</p>}
                        <p className="text-xs text-gray-300 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <button onClick={() => setConfirmAction({ msg: 'Delete this review?', fn: () => deleteReview(r._id) })}
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={reviewsPag.page} pages={reviewsPag.pages} setPage={setReviewsPage} />
          </>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {activeTab === 'analytics' && (
          analyticsLoading ? <Spinner /> : !analytics ? <Empty text="No analytics data" /> : (
            <div className="space-y-8">
              {/* User & Partner analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> User Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Users', val: analytics.users.totalUsers ?? 0, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Active Users', val: analytics.users.activeUsers ?? 0, color: 'text-green-600 bg-green-50' },
                      { label: 'New This Month', val: analytics.users.newUsersThisMonth ?? 0, color: 'text-indigo-600 bg-indigo-50' },
                      { label: 'Blocked', val: analytics.users.blockedUsers ?? 0, color: 'text-red-600 bg-red-50' },
                    ].map((s, i) => (
                      <div key={i} className={`rounded-xl p-4 ${s.color.split(' ')[1]}`}>
                        <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color.split(' ')[0]}`}>{s.val.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-green-500" /> Partner Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Partners', val: analytics.partners.totalPartners ?? 0, color: 'text-green-600 bg-green-50' },
                      { label: 'Verified', val: analytics.partners.verifiedPartners ?? 0, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Unverified', val: analytics.partners.unverifiedPartners ?? 0, color: 'text-amber-600 bg-amber-50' },
                      { label: 'Blocked', val: analytics.partners.blockedPartners ?? 0, color: 'text-red-600 bg-red-50' },
                    ].map((s, i) => (
                      <div key={i} className={`rounded-xl p-4 ${s.color.split(' ')[1]}`}>
                        <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color.split(' ')[0]}`}>{s.val.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue by month */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-purple-500" /> Monthly Revenue</h3>
                {analytics.revenue.length === 0 ? <Empty text="No revenue data yet" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase">Month</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-semibold text-xs uppercase">Revenue</th>
                          <th className="text-right py-3 px-4 text-gray-500 font-semibold text-xs uppercase">Orders</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase">Bar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.revenue.map((r, i) => {
                          const maxRev = Math.max(...analytics.revenue.map(x => x.revenue || 0), 1)
                          return (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium text-gray-800">{r._id}</td>
                              <td className="py-3 px-4 text-right font-bold text-gray-800">{fmtCur(r.revenue || 0)}</td>
                              <td className="py-3 px-4 text-right text-gray-600">{r.orders || 0}</td>
                              <td className="py-3 px-4">
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${((r.revenue || 0) / maxRev * 100)}%` }} />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}

      </main>
    </div>
  )
}

export default AdminDashboard
