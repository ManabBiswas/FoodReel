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

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')

  const statusFlow = [
    { key: 'pending', label: 'Order Placed', icon: Package, color: 'blue' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'green' },
    { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'yellow' },
    { key: 'ready', label: 'Ready for Pickup', icon: Clock, color: 'purple' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'indigo' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green' }
  ]

  const fetchOrderDetails = useCallback(async () => {
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
      setOrder(response.data.order)
      setError('')
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err.response?.data?.message || 'Failed to load order details')
      showError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Effect to fetch order details and set up polling
  useEffect(() => {
    fetchOrderDetails()

    // Set up polling interval to refresh order status every 3 minutes
    // But only if order is not already cancelled or delivered
    const intervalId = setInterval(() => {
      fetchOrderDetails()
    }, 5*60*1000)

    return () => clearInterval(intervalId)
  }, [orderId, fetchOrderDetails])

  // Calculate estimated delivery time based on food preparation time
  const getEstimatedDeliveryTime = () => {
    if (!order || !order.createdAt) return 'Calculating...'
    
    // Get MAX preparation time from all food items (not sum)
    let maxPrepTime = 20 // default
    if (order.items && order.items.length > 0) {
      const prepTimes = order.items.map(item => item.foodItem?.preparationTime || 20)
      maxPrepTime = Math.max(...prepTimes)
    }
    
    const deliveryBuffer = 30 // 30 minutes delivery time
    
    const orderTime = new Date(order.createdAt)
    const estimatedTime = new Date(orderTime.getTime() + (maxPrepTime + deliveryBuffer) * 60000)
    
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

  // Get current status index in the flow
  const getCurrentStatusIndex = () => {
    if (!order || !order.status) return 0
    const index = statusFlow.findIndex(s => s.key === order.status)
    return index >= 0 ? index : 0
  }

  // Check if order can be cancelled
  const canCancelOrder = () => {
    if (!order) return false
    // Can cancel only if order status is 'pending' or 'confirmed'
    // Cannot cancel if it's preparing, ready, out_for_delivery, or delivered
    const isCancelled = order.cancellation?.isCancelled
    const cancellableStatuses = ['pending', 'confirmed']
    return !isCancelled && cancellableStatuses.includes(order.status)
  }

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!orderId) return
    
    try {
      setCancelLoading(true)
      const response = await axios.post(
        API_ENDPOINTS.order.cancel(orderId),
        {},
        axiosConfig
      )
      
      if (response.data.success) {
        showSuccess('Order cancelled successfully')
        // Update order state to reflect cancellation
        setOrder(prev => ({
          ...prev,
          cancellation: {
            isCancelled: true,
            reason: 'Customer requested'
          }
        }))
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      showError(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelLoading(false)
    }
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
  const isCancelled = order.cancellation?.isCancelled || false
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Order Items ({order.items?.length || 0})
                </h2>
                <div className="space-y-4">
                  {order.items?.map((item, index) => {
                    const foodItem = item.foodItem
                    const isVideo = foodItem?.type === 'video'
                    const mediaUrl = isVideo ? foodItem?.video : foodItem?.image
                    const itemTotal = (item.priceAtOrder * item.quantity).toFixed(2)
                    const prepTime = foodItem?.preparationTime || 20
                    
                    return (
                      <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative">
                          <img
                            src={mediaUrl || '/placeholder-food.png'}
                            alt={foodItem?.name || 'Food item'}
                            className="w-full h-full object-cover"
                          />
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all cursor-pointer">
                              <div className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-orange-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-lg">
                            {foodItem?.name || foodItem?.title || 'Food Item'}
                          </h3>
                          {foodItem?.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {foodItem.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-semibold text-gray-800">{item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-gray-600">{prepTime} mins prep</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-gray-600">Price:</span>
                              <span className="font-semibold text-gray-800">₹{item.priceAtOrder}</span>
                            </div>
                          </div>
                          {item.foodPartner && (
                            <p className="text-xs text-gray-500 mt-2">
                              Partner: {item.foodPartner.businessName || 'N/A'}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">₹{itemTotal}</p>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                    <span>₹{order.pricing?.itemPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{order.pricing?.deliveryFee === 0 ? 'FREE' : `₹${order.pricing?.deliveryFee?.toFixed(2) || '0.00'}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>₹{order.pricing?.platformFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (5%)</span>
                    <span>₹{order.pricing?.taxes?.gst?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold text-gray-800 mb-4">
                  <span>Total Amount</span>
                  <span className="text-orange-600 flex items-center">
                    <IndianRupee className="w-5 h-5" />
                    {order.pricing?.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ordered: {formatDate(order.createdAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment: {order.paymentDetails?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment '}
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
