import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  IndianRupee,
  ChevronRight,
  Download,
  Search,
  AlertCircle,
  Loader2,
  Truck
} from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { showError } from '../utils/toast'

const OrderHistory = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        API_ENDPOINTS.order.getAll,
        axiosConfig
      )
      setOrders(response.data.orders || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      showError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ready': return 'bg-green-100 text-green-800 border-green-300'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed': return '✓'
      case 'preparing': return '👨‍🍳'
      case 'ready': return '📦'
      case 'delivered': return '✓✓'
      case 'cancelled': return '✕'
      default: return '•'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">Track and manage all your orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Orders</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'You haven\'t placed any orders yet'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono font-bold text-gray-900 text-sm">{order._id}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Delivery
                      </p>
                      <p className="font-medium text-gray-900 text-sm">
                        {order.deliveryAddress?.city || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {order.deliveryAddress?.fullName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Items</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {order.items?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">item(s)</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Amount</p>
                      <p className="font-bold text-red-500 text-lg">
                        ₹{order.pricing?.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(order.status)}`}>
                        <span>{getStatusIcon(order.status)}</span>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/order/tracking/${order._id}`)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                        >
                          Track Order <Truck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/order/confirmation/${order._id}`, { state: { orderId: order._id } })}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default OrderHistory