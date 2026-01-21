import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { showSuccess, showError, showWarning } from '../utils/toast'
import axios from 'axios'
import {
  ShoppingBag,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Truck,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  IndianRupee
} from 'lucide-react'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const orderData = location.state?.orderData

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  })

  const [paymentMethod, setPaymentMethod] = useState('cod') // cod, online
  const [errors, setErrors] = useState({})

  // Redirect if no order data
  useEffect(() => {
    if (!orderData) {
      showError('No order data found. Please try again.')
      navigate('/')
    }
  }, [orderData, navigate])

  // Calculate totals
  const itemTotal = orderData?.totalPrice || 0
  const deliveryFee = itemTotal > 500 ? 0 : 40
  const gst = (itemTotal * 0.05).toFixed(2)
  const grandTotal = (parseFloat(itemTotal) + deliveryFee + parseFloat(gst)).toFixed(2)

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setDeliveryInfo(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate delivery info
  const validateDeliveryInfo = () => {
    const newErrors = {}

    if (!deliveryInfo.fullName.trim()) newErrors.fullName = 'Name is required'
    if (!deliveryInfo.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^[6-9]\d{9}$/.test(deliveryInfo.phone)) {
      newErrors.phone = 'Invalid phone number'
    }
    if (!deliveryInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryInfo.email)) {
      newErrors.email = 'Invalid email'
    }
    if (!deliveryInfo.address.trim()) newErrors.address = 'Address is required'
    if (!deliveryInfo.city.trim()) newErrors.city = 'City is required'
    if (!deliveryInfo.state.trim()) newErrors.state = 'State is required'
    if (!deliveryInfo.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(deliveryInfo.pincode)) {
      newErrors.pincode = 'Invalid pincode'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && validateDeliveryInfo()) {
      setCurrentStep(2)
    }
  }

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!validateDeliveryInfo()) {
      showWarning('Please fill all required fields')
      setCurrentStep(1)
      return
    }

    setLoading(true)
    try {
      const orderPayload = {
        items: orderData.items,
        deliveryInfo,
        paymentMethod,
        pricing: {
          itemTotal,
          deliveryFee,
          gst: parseFloat(gst),
          grandTotal: parseFloat(grandTotal)
        }
      }

      const response = await axios.post(
        API_ENDPOINTS.order.create,
        orderPayload,
        axiosConfig
      )

      if (response.data) {
        showSuccess('Order placed successfully!')
        // Navigate to order confirmation page
        navigate('/order/confirmation/' + response.data.orderId, {
          state: { orderId: response.data.orderId }
        });
      } else {
        showError('Failed to place order')
      }
    } catch (error) {
      console.error('Order placement error:', error)
      showError(error.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (!orderData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-600" />
            Checkout
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${currentStep >= 1
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}>
                <MapPin className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Delivery Info</span>
                <span className="font-medium sm:hidden">Address</span>
              </div>
            </div>

            <ChevronRight className={`w-5 h-5 ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-300'}`} />

            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${currentStep >= 2
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}>
                <CreditCard className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Payment</span>
                <span className="font-medium sm:hidden">Pay</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Section - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${currentStep === 1 ? 'ring-2 ring-orange-400' : ''
              }`}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-orange-600" />
                Delivery Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={deliveryInfo.fullName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={deliveryInfo.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="9876543210"
                      maxLength="10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={deliveryInfo.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="john@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={deliveryInfo.address}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      rows="2"
                      placeholder="House/Flat No., Street Name"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Landmark */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={deliveryInfo.landmark}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Near XYZ Mall"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryInfo.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={deliveryInfo.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={deliveryInfo.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.pincode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="400001"
                    maxLength="6"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                  )}
                </div>
              </div>

              {currentStep === 1 && (
                <button
                  onClick={handleNextStep}
                  className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Payment Method */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${currentStep === 2 ? 'ring-2 ring-orange-400' : 'opacity-50 pointer-events-none'
              }`}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-orange-600" />
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-orange-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-800">Cash on Delivery</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Pay when you receive your order</p>
                  </div>
                  <CheckCircle className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-orange-600' : 'text-gray-300'
                    }`} />
                </label>

                {/* Online Payment */}
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === 'online'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-orange-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-800">Online Payment</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">UPI, Cards, Net Banking</p>
                  </div>
                  <CheckCircle className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-orange-600' : 'text-gray-300'
                    }`} />
                </label>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Delivery Info
              </button>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

              {/* Order Items */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                {orderData.items?.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-food.png'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-orange-600">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4 pb-4 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Item Total</span>
                  <span>₹{itemTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                {deliveryFee === 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Free delivery on orders above ₹500
                  </p>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-lg font-bold text-gray-800 mb-4">
                <span>Total Amount</span>
                <span className="text-orange-600 flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  {grandTotal}
                </span>
              </div>

              {/* Delivery Time */}
              <div className="bg-orange-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Estimated Delivery: 30-45 mins</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || currentStep !== 2}
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${loading || currentStep !== 2
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              {currentStep === 1 && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Complete delivery info to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout