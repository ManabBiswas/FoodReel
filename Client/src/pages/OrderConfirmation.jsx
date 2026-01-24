import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CheckCircle,
  MapPin,
  Clock,
  Phone,
  Mail,
  IndianRupee,
  Truck,
  Home,
  AlertCircle,
  Copy,
  Download,
  Store,
  User
} from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { showSuccess, showError, showInfo } from '../utils/toast'

const OrderConfirmation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const orderId = location.state?.orderId

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        API_ENDPOINTS.order.getById(orderId),
        axiosConfig
      )
      setOrder(response.data.order)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details')
      showError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId) {
      setError('Order not found')
      setLoading(false)
      return
    }

    fetchOrderDetails()
  }, [orderId, fetchOrderDetails])

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    showSuccess('Order ID copied!')
  }

  const handleDownloadReceipt = () => {
    showInfo('Downloading receipt...')
  }
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-purple-100 text-purple-800 border-purple-200',
      out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || colors.pending
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      preparing: 'Being Prepared',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Order</h1>
            <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
            <button
              onClick={() => navigate('/orders')}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
            >
              View All Orders
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const deliveryAddress = order.deliveryAddress || {}
  const pricing = order.pricing || {}
  const user = order.user || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">Thank you for your order. We're preparing your delicious food.</p>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${getStatusColor(order.status)}`}>
            <span className="font-semibold text-sm">{getStatusText(order.status)}</span>
          </div>

          <div className="inline-flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Order ID:</span>
            <span className="font-mono font-bold text-lg text-gray-900">{order.id || order._id}</span>
            <button
              onClick={copyOrderId}
              className="text-gray-500 hover:text-gray-700 transition"
              title="Copy Order ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-3">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Delivery Address
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">{deliveryAddress.fullName}</p>
                <p className="text-gray-600 text-sm mb-2">{deliveryAddress.addressLine1}</p>
                {deliveryAddress.addressLine2 && (
                  <p className="text-gray-600 text-sm mb-2">{deliveryAddress.addressLine2}</p>
                )}
                <p className="text-gray-600 text-sm mb-2">
                  {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
                </p>
                {deliveryAddress.landmark && (
                  <p className="text-gray-600 text-sm">Landmark: {deliveryAddress.landmark}</p>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-300">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 text-sm">{deliveryAddress.phone}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>
                {user.email && (
                  <div className="flex items-center gap-3 pl-13">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                )}
                {user.mobile && (
                  <div className="flex items-center gap-3 pl-13">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{user.mobile}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={item.id || item._id || index} className="flex justify-between items-start pb-4 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{item.foodItem?.name || 'Food Item'}</p>
                            {item.foodItem?.description && (
                              <p className="text-sm text-gray-500 mt-1">{item.foodItem.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-600">Qty: {item.quantity || 1}</span>
                              <span className="text-sm text-gray-600">₹{item.priceAtOrder} each</span>
                            </div>
                            {item.foodItem?.preparationTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{item.foodItem.preparationTime} mins prep time</span>
                              </div>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 ml-4">₹{(item.priceAtOrder * item.quantity).toFixed(2)}</p>
                        </div>
                        {item.foodPartner && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <Store className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">{item.foodPartner.companyName}</p>
                              <p className="text-xs text-gray-500">{item.foodPartner.address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Special Instructions</h2>
                <p className="text-gray-600">{order.specialInstructions}</p>
              </div>
            )}

            {/* Delivery Time */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm">Estimated Delivery Time</p>
                    <p className="text-xl font-bold text-gray-900">30-45 mins</p>
                  </div>
                  <Truck className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
                {order.estimatedDeliveryTime && (
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm">Expected By</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(order.estimatedDeliveryTime)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            {order.paymentDetails && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-gray-900 capitalize">{order.paymentDetails.method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.paymentDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.paymentDetails.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {order.paymentDetails.status}
                    </span>
                  </div>
                  {order.paymentDetails.razorpayOrderId && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="font-mono text-gray-700">{order.paymentDetails.razorpayOrderId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h2>
              <div className="space-y-3 mb-4">
                

                {order?.items.map(item => (
                  <div key={item._id} className="flex justify-between text-gray-600">
                    <span>{item.foodItem?.name } {item.quantity}</span>
                    <span>₹{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between font-bold text-gray-800">
                  <span>Subtotal</span>
                  <span>₹{pricing.itemPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={pricing.deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {pricing.deliveryFee === 0 ? 'FREE' : `₹${pricing.deliveryFee?.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>₹{pricing.platformFee?.toFixed(2) || '0.00'}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{pricing.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span>₹{pricing.taxes?.gst?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-red-500">₹{pricing.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <p className="text-xs text-gray-500 text-center pt-2">
                  Currency: {order.currency || 'INR'}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/order/tracking/${order.id || order._id}`)}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  Track Order
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <button
                  onClick={() => navigate('/order/history')}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  View All Orders
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full border border-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            </div>

            {/* Order Source */}
            {order.orderSource && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Order Source:</span> {order.orderSource}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">📞 Need Help?</h3>
          <p className="text-green-800 text-sm">If you have any questions about your order, please contact our customer support team.</p>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default OrderConfirmation