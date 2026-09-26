import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  ArrowLeft,
  IndianRupee,
  Calendar,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Navbar from '../../Components/Navbar'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { showSuccess, showError } from '../../utils/toast'
import CancelOrderDialog from '../../Components/CancelOrderDialog'

const OrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [error, setError] = useState('')

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || orderId === 'undefined') {
      setError('Order ID not found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(
        API_ENDPOINTS.order.partnerGetById(orderId),
        axiosConfig
      )
      setOrder(response.data.order)
      setError('')
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load order details')
      showError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  const handleStatusUpdate = async (newStatus) => {
    if (!orderId) return

    try {
      setUpdating(true)
      const response = await axios.put(
        API_ENDPOINTS.order.updateStatus(orderId),
        { status: newStatus },
        axiosConfig
      )

      if (response.data.order) {
        showSuccess(`Order status updated to ${newStatus}`)
        setOrder(response.data.order)
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update order status'
      showError(errorMsg)
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelOrder = async (reason) => {
    if (!orderId) return

    try {
      setCancelling(true)
      const response = await axios.post(
        API_ENDPOINTS.order.partnerCancel(orderId),
        { reason },
        axiosConfig
      )

      if (response.data.success || response.status === 200) {
        setShowCancelDialog(false)
        showSuccess('Order cancelled')
        await fetchOrderDetails()
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to cancel order'
      showError(errorMsg)
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
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
      ready: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || colors.pending
  }

  const getAvailableActions = () => {
    if (!order) return []
    
    const isCancelled = order.cancellation?.isCancelled || order.status === 'cancelled'
    if (isCancelled) return []

    const statusActions = {
      pending: ['confirmed', 'cancel'],
      confirmed: ['preparing', 'cancel'],
      preparing: ['ready'],
      ready: ['delivered'],
      delivered: [],
      cancelled: []
    }

    return statusActions[order.status] || []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
            <button
              onClick={() => navigate('/partner-dashboard')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isCancelled = order.cancellation?.isCancelled || order.status === 'cancelled'
  const availableActions = getAvailableActions()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/partner-dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-600" />
                Order Details
              </h1>
              <p className="text-gray-600 mt-1">Order ID: #{orderId.slice(-8).toUpperCase()}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrderDetails}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update Section */}
            {!isCancelled && availableActions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Update Order Status</h2>
                <div className="flex flex-wrap gap-3">
                  {availableActions.map((action) => (
                    action === 'cancel' ? (
                      <button
                        key={action}
                        onClick={() => setShowCancelDialog(true)}
                        disabled={cancelling || updating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {cancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Cancel Order
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        key={action}
                        onClick={() => handleStatusUpdate(action)}
                        disabled={updating || cancelling}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Mark as {action.charAt(0).toUpperCase() + action.slice(1)}
                          </>
                        )}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-1">Order Cancelled</h3>
                    <p className="text-red-700 mb-2">This order has been cancelled and cannot be modified.</p>
                    {order.cancellation?.reason && (
                      <p className="text-sm text-red-600">Reason: {order.cancellation.reason}</p>
                    )}
                    {order.cancellation?.cancelledBy && (
                      <p className="text-sm text-red-600">Cancelled by: {order.cancellation.cancelledBy}</p>
                    )}
                    {order.cancellation?.cancelledAt && (
                      <p className="text-sm text-red-600">Cancelled at: {formatDate(order.cancellation.cancelledAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.foodItem?.image && (
                      <img
                        src={item.foodItem.image}
                        alt={item.foodItem.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.foodItem?.name || 'Unknown Item'}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: ₹{item.priceAtOrder}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {(item.priceAtOrder * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            {order.orderNotes && order.orderNotes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Notes</h2>
                <div className="space-y-3">
                  {order.orderNotes.map((note, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-gray-800">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(note.timestamp)} • By {note.addedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Customer & Delivery Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-800">
                    {order.user?.firstName} {order.user?.lastName}
                  </p>
                </div>
                {order.user?.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <p className="text-gray-800">{order.user.mobile}</p>
                  </div>
                )}
                {order.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <p className="text-gray-800">{order.user.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Delivery Address
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-800">{order.deliveryAddress?.fullName}</p>
                <p className="text-gray-600">{order.deliveryAddress?.addressLine1}</p>
                {order.deliveryAddress?.addressLine2 && (
                  <p className="text-gray-600">{order.deliveryAddress.addressLine2}</p>
                )}
                {order.deliveryAddress?.landmark && (
                  <p className="text-gray-600">Landmark: {order.deliveryAddress.landmark}</p>
                )}
                <p className="text-gray-600">
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                </p>
                {order.deliveryAddress?.phone && (
                  <div className="flex items-center gap-2 mt-3">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <p className="text-gray-800">{order.deliveryAddress.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Price</span>
                  <span className="font-medium">₹{order.pricing?.itemPrice?.toFixed(2)}</span>
                </div>
                {order.pricing?.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₹{order.pricing.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {order.pricing?.platformFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">₹{order.pricing.platformFee.toFixed(2)}</span>
                  </div>
                )}
                {order.pricing?.taxes?.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes</span>
                    <span className="font-medium">₹{order.pricing.taxes.total.toFixed(2)}</span>
                  </div>
                )}
                {order.pricing?.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{order.pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="font-bold text-lg text-green-600 flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" />
                    {order.pricing?.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CancelOrderDialog
        open={showCancelDialog}
        mode="partner"
        cancelling={cancelling}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelOrder}
      />
    </div>
  )
}

export default OrderDetail
