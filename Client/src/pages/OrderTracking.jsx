import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  MapPin,
  Phone,
  Mail,
  Home,
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  IndianRupee,
  Calendar,
  User,
  CreditCard
} from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { showSuccess, showError } from '../utils/toast'

const OrderTracking = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()

  // Debug logging
  console.log('OrderTracking - orderId from params:', orderId)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')

  // Order status flow
  const statusFlow = [
    { key: 'pending', label: 'Order Placed', icon: Package, color: 'blue' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'green' },
    { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'yellow' },
    { key: 'ready', label: 'Ready for Pickup', icon: Clock, color: 'purple' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'indigo' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green' }
  ]

  const fetchOrderDetails = useCallback(async () => {
    // Don't fetch if orderId is not available
    if (!orderId || orderId === 'undefined') {
      setError('Order ID not found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(
        API_ENDPOINTS.order.getById(orderId),
        axiosConfig
      )
      setOrder(response.data)
      setError('')
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err.response?.data?.message || 'Failed to load order details')
      showError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Initial fetch
  useEffect(() => {
    if (!orderId || orderId === 'undefined') {
      setError('Order ID not found')
      setLoading(false)
      return
    }
    fetchOrderDetails()
  }, [orderId, fetchOrderDetails])

  // Polling for real-time updates (every 30 seconds)
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') {
      return // Stop polling if order is delivered or cancelled
    }

    const pollInterval = setInterval(() => {
      fetchOrderDetails()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(pollInterval)
  }, [order, fetchOrderDetails])

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    setCancelLoading(true)
    try {
      await axios.put(
        API_ENDPOINTS.order.cancel(orderId),
        { reason: 'Cancelled by user' },
        axiosConfig
      )
      showSuccess('Order cancelled successfully')
      fetchOrderDetails() // Refresh order details
    } catch (err) {
      console.error('Error cancelling order:', err)
      showError(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelLoading(false)
    }
  }

  // Get current status index
  const getCurrentStatusIndex = () => {
    if (!order) return -1
    return statusFlow.findIndex(s => s.key === order.status)
  }

  // Check if order can be cancelled
  const canCancelOrder = () => {
    if (!order) return false
    return ['pending', 'confirmed'].includes(order.status)
  }

  // Calculate estimated delivery time
  const getEstimatedDeliveryTime = () => {
    if (!order || !order.createdAt) return 'Calculating...'
    
    const orderTime = new Date(order.createdAt)
    const estimatedTime = new Date(orderTime.getTime() + 45 * 60000) // 45 minutes
    
    if (order.status === 'delivered') {
      return 'Delivered'
    }
    
    const now = new Date()
    const timeLeft = estimatedTime - now
    
    if (timeLeft <= 0) {
      return 'Any moment now'
    }
    
    const minutesLeft = Math.floor(timeLeft / 60000)
    return `${minutesLeft} mins`
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
            <button
              onClick={() => navigate('/order/history')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              View Order History
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const currentStatusIndex = getCurrentStatusIndex()
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/order/history')}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Orders</span>
            </button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <Package className="w-8 h-8 text-orange-600" />
                  Track Order
                </h1>
                <p className="text-gray-600 mt-1">Order ID: #{orderId}</p>
              </div>
              
              {/* Status Badge */}
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                isCancelled ? 'bg-red-100 text-red-800' :
                isDelivered ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status.toUpperCase().replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Section - Status Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status Timeline */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  Order Status
                </h2>

                {isCancelled ? (
                  <div className="text-center py-8">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Order Cancelled</h3>
                    <p className="text-gray-600">This order has been cancelled</p>
                    {order.cancellation?.reason && (
                      <p className="text-sm text-gray-500 mt-2">Reason: {order.cancellation.reason}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {statusFlow.map((status, index) => {
                      const isComplete = index <= currentStatusIndex
                      const isCurrent = index === currentStatusIndex
                      const StatusIcon = status.icon

                      return (
                        <div key={status.key} className="flex gap-4">
                          {/* Icon */}
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                              isComplete
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}>
                              <StatusIcon className="w-6 h-6" />
                            </div>
                            {index < statusFlow.length - 1 && (
                              <div className={`w-1 h-16 transition-all ${
                                isComplete ? 'bg-orange-600' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-8">
                            <h3 className={`font-semibold mb-1 ${
                              isComplete ? 'text-gray-800' : 'text-gray-400'
                            }`}>
                              {status.label}
                            </h3>
                            {isCurrent && (
                              <p className="text-sm text-orange-600 font-medium">
                                In Progress
                              </p>
                            )}
                            {isComplete && !isCurrent && (
                              <p className="text-sm text-green-600">
                                ✓ Completed
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={item.foodId?.mediaUrl || '/placeholder-food.png'}
                          alt={item.foodId?.name || 'Food item'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {item.foodId?.name || 'Unknown Item'}
                        </h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-orange-600 font-semibold mt-1">
                          ₹{item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-orange-600" />
                  Delivery Address
                </h2>
                <div className="space-y-2 text-gray-600">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {order.deliveryAddress?.fullName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.deliveryAddress?.phone}
                  </p>
                  <p className="flex items-start gap-2">
                    <Home className="w-4 h-4 mt-1" />
                    <span>
                      {order.deliveryAddress?.addressLine1}<br />
                      {order.deliveryAddress?.landmark && `${order.deliveryAddress.landmark}, `}
                      {order.deliveryAddress?.city}, {order.deliveryAddress?.state}<br />
                      {order.deliveryAddress?.pincode}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Order Summary & Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Estimated Delivery Time */}
              {!isCancelled && !isDelivered && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Estimated Delivery</h3>
                  </div>
                  <p className="text-3xl font-bold">{getEstimatedDeliveryTime()}</p>
                  <p className="text-sm opacity-90 mt-1">Your order will arrive soon!</p>
                </div>
              )}

              {isDelivered && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Order Delivered</h3>
                  </div>
                  <p className="text-sm opacity-90">Thank you for your order!</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4 pb-4 border-b">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total</span>
                    <span>₹{order.pricing?.itemTotal || order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{order.pricing?.deliveryFee === 0 ? 'FREE' : `₹${order.pricing?.deliveryFee || 40}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (5%)</span>
                    <span>₹{order.pricing?.gst || 0}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold text-gray-800 mb-4">
                  <span>Total Amount</span>
                  <span className="text-orange-600 flex items-center">
                    <IndianRupee className="w-5 h-5" />
                    {order.pricing?.grandTotal || order.totalAmount}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ordered: {formatDate(order.createdAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Paid'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {canCancelOrder() && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {cancelLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Cancel Order
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/contact-us')}
                    className="w-full border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default OrderTracking
