import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { showError, showSuccess } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import {
  Plus,
  ShoppingBag,
  Megaphone,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  IndianRupee,
  Loader2,
  AlertCircle,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  Download,
  TrendingDown
} from 'lucide-react'

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend }) => {
  if (!Icon) {
    return null;
  }
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

// Order Card Component
const OrderCard = ({ order, onViewDetails, onStatusUpdate, onCancelOrder, updating }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      preparing: {
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      ready: {
        icon: CheckCircle,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200'
      },
      delivered: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      completed: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      cancelled: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }
    return configs[status] || configs.pending
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        {/* Order ID */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
          <p className="text-sm font-mono font-semibold text-gray-900 truncate">
            #{order._id?.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Date & Time */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</p>
          <p className="text-sm text-gray-900">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Items Count */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Items</p>
          <p className="text-sm font-semibold text-gray-900">
            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Amount */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Amount</p>
          <p className="text-lg font-bold text-green-600 flex items-center gap-1">
            <IndianRupee className="w-4 h-4" />
            {(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}
          </p>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
            <span className={`text-sm font-medium ${statusConfig.color} capitalize`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={() => onViewDetails(order._id)}
            className="w-full px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            View Details
          </button>
          {order.status === 'pending' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'confirmed')}
              disabled={updating}
              className="w-full px-3 py-1.5 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {updating ? '...' : 'Confirm'}
            </button>
          )}
          {order.status === 'confirmed' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'preparing')}
              disabled={updating}
              className="w-full px-3 py-1.5 text-sm font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {updating ? '...' : 'Start Preparing'}
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => onStatusUpdate(order._id, 'ready')}
              disabled={updating}
              className="w-full px-3 py-1.5 text-sm font-semibold bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {updating ? '...' : 'Mark Ready'}
            </button>
          )}
          {['pending', 'confirmed', 'preparing'].includes(order.status) && (
            <button
              onClick={() => onCancelOrder(order._id)}
              disabled={updating}
              className="w-full px-3 py-1.5 text-sm font-semibold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {updating ? '...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
      <Package className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
    <p className="text-gray-600 max-w-md mx-auto">
      Orders from customers will appear here. Make sure your food items are active and available.
    </p>
  </div>
)

// Filter Component
const FilterBar = ({ statusFilter, setStatusFilter, searchTerm, setSearchTerm }) => {
  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === status.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState(null)

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')

      const [authResponse, foodResponse, adResponse, ordersResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig),
        axios.get(API_ENDPOINTS.food.myPosts, axiosConfig),
        axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig),
        axios.get(API_ENDPOINTS.order.partner, axiosConfig).catch(() => ({ data: { data: [] } }))
      ])

      const currentPartner = authResponse.data?.foodPartner
      const currentPartnerId = currentPartner?._id

      // Process food posts
      const groupedFoods = foodResponse.data?.foods || {}
      const foodPostsRaw = groupedFoods.all || groupedFoods.food || []
      const foodPosts = foodPostsRaw.map((post) => ({
        ...post,
        likeCount: post.likeCount || post.likes?.length || 0,
        commentCount: post.commentCount || post.comments?.length || 0,
        savesCount: post.savesCount || post.saves?.length || 0
      }))

      // Process advertisements
      const advertisementsRaw = adResponse.data?.data || []
      const myAds = (currentPartnerId
        ? advertisementsRaw.filter(
            (ad) => ad.partnerId?._id === currentPartnerId || ad.partnerId === currentPartnerId
          )
        : advertisementsRaw
      ).map((ad) => ({
        ...ad,
        likeCount: ad.likeCount || ad.likes?.length || 0,
        commentCount: ad.commentCount || ad.comments?.length || 0
      }))

      // Process orders
      const ordersData = ordersResponse.data?.data || []
      setOrders(ordersData)

      // Calculate statistics
      const stats = {
        food: {
          count: foodPosts.length,
          totalLikes: foodPosts.reduce((sum, post) => sum + post.likeCount, 0),
          totalReviews: foodPosts.reduce((sum, post) => sum + post.commentCount, 0),
          totalSaves: foodPosts.reduce((sum, post) => sum + post.savesCount, 0)
        },
        advertisement: {
          count: myAds.length,
          totalLikes: myAds.reduce((sum, ad) => sum + ad.likeCount, 0),
          totalComments: myAds.reduce((sum, ad) => sum + ad.commentCount, 0)
        },
        orders: {
          total: ordersData.length,
          pending: ordersData.filter((o) => o.status === 'pending').length,
          confirmed: ordersData.filter((o) => o.status === 'confirmed').length,
          completed: ordersData.filter((o) => o.status === 'completed').length,
          cancelled: ordersData.filter((o) => o.status === 'cancelled').length,
          revenue: ordersData
            .filter((o) => o.status === 'completed' || o.status === 'delivered')
            .reduce((sum, o) => sum + (o.pricing?.totalAmount || o.totalAmount || 0), 0),
          totalRevenue: ordersData.reduce((sum, o) => sum + (o.pricing?.totalAmount || o.totalAmount || 0), 0)
        },
        total: {
          totalLikes: 0,
          totalComments: 0,
          totalSaves: 0
        }
      }

      stats.total.totalLikes = stats.food.totalLikes + stats.advertisement.totalLikes
      stats.total.totalComments = stats.food.totalReviews + stats.advertisement.totalComments
      stats.total.totalSaves = stats.food.totalSaves

      setStatistics(stats)

      if (isRefresh) {
        showSuccess('Dashboard refreshed successfully')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (error.response?.status === 401) {
        showError('Session expired. Please login again.')
        setTimeout(() => navigate('/partner-login'), 2000)
      } else {
        const message = error.response?.data?.message || 'Failed to load dashboard data'
        setError(message)
        showError(message)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = useCallback(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      await axios.put(API_ENDPOINTS.order.updateStatus(orderId), { status: newStatus }, axiosConfig)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)))
      showSuccess(`Order marked as ${newStatus}`)
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }, [])

  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      setUpdatingOrder(orderId)
      await axios.post(API_ENDPOINTS.order.partnerCancel(orderId), {}, axiosConfig)
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o)))
      showSuccess('Order cancelled')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setUpdatingOrder(null)
    }
  }, [])

  const handleViewDetails = useCallback(
    (orderId) => {
      navigate(`/order/${orderId}`)
    },
    [navigate]
  )

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Search by order ID
    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders, statusFilter, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your orders and business performance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate('/CreateFood')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create New Post</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error loading dashboard</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Business Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={ShoppingBag}
              title="Food Items"
              value={statistics.food.count}
              subtitle={`${statistics.food.totalLikes} likes · ${statistics.food.totalReviews} reviews`}
              color="green"
            />
            <StatCard
              icon={Megaphone}
              title="Advertisements"
              value={statistics.advertisement.count}
              subtitle={`${statistics.advertisement.totalLikes} likes · ${statistics.advertisement.totalComments} comments`}
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              title="Total Engagement"
              value={statistics.total.totalLikes + statistics.total.totalComments + statistics.total.totalSaves}
              subtitle="Total reach across all posts"
              color="blue"
            />
          </div>
        )}

        {/* Orders Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders Overview</h2>

          {/* Order Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard
                icon={Package}
                title="Total Orders"
                value={statistics.orders.total}
                color="blue"
              />
              <StatCard
                icon={Clock}
                title="Pending"
                value={statistics.orders.pending}
                color="orange"
              />
              <StatCard
                icon={CheckCircle}
                title="Confirmed"
                value={statistics.orders.confirmed}
                color="blue"
              />
              <StatCard
                icon={CheckCircle}
                title="Completed"
                value={statistics.orders.completed}
                color="green"
              />
              <StatCard
                icon={IndianRupee}
                title="Revenue"
                value={`₹${statistics.orders.revenue.toFixed(2)}`}
                subtitle={`Total: ₹${statistics.orders.totalRevenue.toFixed(2)}`}
                color="green"
              />
            </div>
          )}

          {/* Filter Bar */}
          <FilterBar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            orders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders match your filters</p>
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setSearchTerm('')
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
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
      </div>
    </div>
  )
}

export default Dashboard