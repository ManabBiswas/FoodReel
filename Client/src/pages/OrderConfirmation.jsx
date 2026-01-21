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
  Download
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
      setOrder(response.data)
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

  const deliveryInfo = order.deliveryInfo || {}
  const pricing = order.pricing || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">Thank you for your order. We're preparing your delicious food.</p>
          
          <div className="inline-flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Order ID:</span>
            <span className="font-mono font-bold text-lg text-gray-900">{orderId}</span>
            <button
              onClick={copyOrderId}
              className="text-gray-500 hover:text-gray-700 transition"
              title="Copy Order ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Delivery Address
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">{deliveryInfo.fullName}</p>
                <p className="text-gray-600 text-sm mb-2">{deliveryInfo.address}</p>
                <p className="text-gray-600 text-sm mb-2">
                  {deliveryInfo.city}, {deliveryInfo.state} - {deliveryInfo.pincode}
                </p>
                {deliveryInfo.landmark && (
                  <p className="text-gray-600 text-sm">Landmark: {deliveryInfo.landmark}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{deliveryInfo.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{deliveryInfo.email}</span>
                </div>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start pb-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.name || 'Food Item'}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity || 1}</p>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.price?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Expected Delivery
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm">Estimated Delivery Time</p>
                  <p className="text-2xl font-bold text-gray-900">30-45 mins</p>
                </div>
                <Truck className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{pricing.itemTotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{pricing.deliveryFee === 0 ? 'FREE' : `₹${pricing.deliveryFee?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (5%)</span>
                <span>₹{pricing.gst?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span className="text-red-500">₹{pricing.grandTotal?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate(`/order/tracking/${orderId}`)}
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