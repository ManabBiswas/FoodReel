import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  FileText, 
  Settings, 
  LogOut,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Menu,
  X,
  IndianRupee,
  RefreshCw
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [statsRes, ordersRes] = await Promise.all([
        axios.get(API_ENDPOINTS.admin.dashboard, axiosConfig),
        axios.get(`${API_ENDPOINTS.admin.orders}?limit=5&page=1`, axiosConfig)
      ])
      setDashboardStats(statsRes.data.stats)
      setRecentOrders(ordersRes.data.orders || [])
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin-login')
      } else {
        setError('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleLogout = async () => {
    try {
      await axios.post(API_ENDPOINTS.auth.adminLogout, {}, axiosConfig)
    } catch {
      // clear cookie even if request fails
    }
    navigate('/admin-login')
  }

  const stats = dashboardStats ? [
    { 
      title: 'Total Users', 
      value: dashboardStats.totalUsers?.toLocaleString() ?? '—', 
      change: '+users', 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Food Partners', 
      value: dashboardStats.totalPartners?.toLocaleString() ?? '—', 
      change: '+partners', 
      icon: Store, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Total Orders', 
      value: dashboardStats.totalOrders?.toLocaleString() ?? '—', 
      change: '+orders', 
      icon: ShoppingBag, 
      color: 'bg-purple-500' 
    },
    { 
      title: 'Food Items', 
      value: dashboardStats.totalFoodItems?.toLocaleString() ?? '—', 
      change: '+items', 
      icon: FileText, 
      color: 'bg-orange-500' 
    }
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-sans antialiased">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 shadow-lg hover:shadow-xl transition"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 text-white p-6 z-40 transform transition-transform duration-300 shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent drop-shadow-sm ">FoodReel Admin</h1>
          <p className="text-indigo-200 text-xs mt-1 font-medium uppercase tracking-wider">Dashboard</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium tracking-wide">Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium tracking-wide">Users</span>
          </button>

          <button
            onClick={() => { setActiveTab('partners'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'partners' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="font-medium tracking-wide">Food Partners</span>
          </button>

          <button
            onClick={() => { setActiveTab('posts'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'posts' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium tracking-wide">Posts & Reels</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                : 'hover:bg-white/10'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium tracking-wide">Settings</span>
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500 transition-colors mt-auto absolute bottom-6 left-6 right-6"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Logout</span>
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Main Content */}
      <main className="lg:mr-72 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8 mt-16 lg:mt-0 flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard Overview</h2>
            <p className="text-gray-500 mt-2 font-medium text-base">Welcome back, Admin 👋</p>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2 w-24" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg shadow-md`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</h3>
                <p className="text-3xl font-black tracking-tight bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">{stat.value}</p>
              </div>
            ))
          )}
        </div>

        {/* Revenue Card */}
        {dashboardStats && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <IndianRupee className="w-6 h-6" />
              <h3 className="text-lg font-bold">Total Revenue</h3>
            </div>
            <p className="text-4xl font-black">
              ₹{(dashboardStats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">Recent Orders</h3>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold tracking-wide transition-colors"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-gray-800 text-sm font-semibold">
                        Order #{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      ₹{(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}
                    </p>
                    <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-600' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold tracking-tight mb-2">Analytics</h4>
            <p className="text-purple-100 text-sm mb-4 font-medium leading-relaxed">View detailed analytics and reports</p>
            <button className="bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:shadow-md transition-all">
              View Reports
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 text-white">
            <Users className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold tracking-tight mb-2">Manage Users</h4>
            <p className="text-blue-100 text-sm mb-4 font-medium leading-relaxed">View and manage all registered users</p>
            <button className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:shadow-md transition-all">
              Manage Users
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 text-white">
            <Store className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold tracking-tight mb-2">Partner Requests</h4>
            <p className="text-green-100 text-sm mb-4 font-medium leading-relaxed">Review pending partner applications</p>
            <button className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:shadow-md transition-all">
              Review Requests
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
