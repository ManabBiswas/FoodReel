import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import FoodMedia from '../Components/FoodMedia'
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
  IndianRupee,
  Asterisk,
  Loader2,
  Plus
} from 'lucide-react'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearCart } = useCart()
  const { user } = useAuth()
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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [useSavedAddress, setUseSavedAddress] = useState(true)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  // Map a saved address record onto the checkout form shape. The address
  // subdocument uses addressLine1/pincode, the manual form uses address/pincode.
  // A saved address only stores street/city/state/pincode, so name, phone and
  // email fall back to the signed-in profile.
  const applySavedAddress = (addr) => {
    const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    setDeliveryInfo(prev => ({
      fullName: addr.fullName || profileName || prev.fullName || '',
      phone: addr.phone || user?.mobile || user?.phone || prev.phone || '',
      email: addr.email || prev.email || user?.email || '',
      address: addr.addressLine1 || addr.street || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || addr.pinCode || ''
    }))
    setErrors({})
  }

  // Load addresses saved from Profile Settings
  useEffect(() => {
    let cancelled = false
    const loadAddresses = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.user.address, axiosConfig)
        if (cancelled) return
        const list = res.data?.addresses || []
        setSavedAddresses(list)
        const preferred = list.find(a => a.isDefault) || list[0]
        if (preferred) {
          setSelectedAddressId(preferred._id)
          setUseSavedAddress(true)
          applySavedAddress(preferred)
        } else {
          setUseSavedAddress(false)
        }
      } catch {
        if (!cancelled) setUseSavedAddress(false)
      } finally {
        if (!cancelled) setLoadingAddresses(false)
      }
    }
    loadAddresses()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Email is required but not part of a saved address, so seed it from the
  // account — otherwise "Continue to payment" fails on an empty field.
  useEffect(() => {
    if (!user) return
    const profileName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    setDeliveryInfo(prev => ({
      email: prev.email || user.email || '',
      fullName: prev.fullName || profileName,
      phone: prev.phone || user.mobile || user.phone || ''
    }))
  }, [user?.email, user?.firstName, user?.lastName, user?.mobile])

  // Check if Razorpay is loaded
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true)
    } else {
      console.warn('Razorpay not loaded. Online payment will not be available.')
    }
  }, [])

  // Redirect if no order data
  useEffect(() => {
    if (!orderData) {
      showError('No order data found. Please try again.')
      navigate('/')
    }
  }, [orderData, navigate])

  // Calculate totals
  const itemTotal = orderData?.totalPrice || 0
  // const deliveryFee = itemTotal > 500 ? 0 : 40
  const deliveryFee = 0
  const platformFee = Math.round(itemTotal * 0.03 * 100) / 100
  const subtotal = itemTotal + deliveryFee + platformFee
  const gst = Math.round(subtotal * 0.05 * 100) / 100
  const grandTotal = (subtotal + parseFloat(gst)).toFixed(2)

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

  // Validate delivery info — returns the error map so callers don't read stale state
  const validateDeliveryInfo = () => {
    const newErrors = {}
    const d = deliveryInfo || {}

    if (!d.fullName?.trim()) newErrors.fullName = 'Name is required'
    if (!d.phone?.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^[6-9]\d{9}$/.test(d.phone.trim())) {
      newErrors.phone = 'Invalid phone number'
    }
    if (!d.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
      newErrors.email = 'Invalid email'
    }
    if (!d.address?.trim()) newErrors.address = 'Address is required'
    if (!d.city?.trim()) newErrors.city = 'City is required'
    if (!d.state?.trim()) newErrors.state = 'State is required'
    if (!d.pincode?.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(d.pincode.trim())) {
      newErrors.pincode = 'Invalid pincode'
    }

    setErrors(newErrors)
    return newErrors
  }

  // Handle next step
  const handleNextStep = () => {
    if (currentStep !== 1) return

    const newErrors = validateDeliveryInfo()
    const missing = Object.keys(newErrors)

    if (missing.length > 0) {
      // Fields are visible, so inline errors show; toast for a fast read.
      showError(`Please complete: ${missing.join(', ')}`)
      return
    }

    setCurrentStep(2)
  }

  // Handle Razorpay Payment
  const handleRazorpayPayment = async (orderId) => {
    // Ad-blockers leave window.Razorpay undefined — bail with a clear message
    // before creating a Razorpay order we can't open (M24).
    if (typeof window.Razorpay !== 'function') {
      showError('Payment gateway could not load. Please try Cash on Delivery or disable your ad blocker.')
      setLoading(false)
      return
    }
    try {
      // Create payment order via backend using the orderId
      const paymentResponse = await axios.post(
        API_ENDPOINTS.payment.createOrder,
        { orderId },
        axiosConfig
      )

      // Handle response structure
      const { razorpayOrderId, amount, keyId, order } = paymentResponse.data

      // Configure Razorpay options
      const options = {
        key: keyId,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'FoodReel',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Payment successful - verify payment
          try {
            const verifyResponse = await axios.post(
              API_ENDPOINTS.payment.verify,
              {
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              axiosConfig
            )

            if (verifyResponse.data.success) {
              showSuccess('Payment successful! Order confirmed.')
              await clearCart() // Clear cart after successful payment
              navigate(`/order/confirmation/${orderId}`, {
                state: { orderId: orderId }
              })
            } else {
              showError('Payment verification failed')
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError)
            showError('Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: deliveryInfo.fullName,
          email: deliveryInfo.email,
          contact: deliveryInfo.phone
        },
        theme: {
          color: '#ea580c'
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            showWarning('Payment cancelled')
          }
        }
      }

      // Open Razorpay modal
      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        showError('Payment failed: ' + response.error.description)
        setLoading(false)
      })
      razorpay.open()
    } catch (error) {
      console.error('Payment initiation error:', error)
      showError(error.response?.data?.error || error.response?.data?.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  // Handle place order
  const handlePlaceOrder = async () => {
    const newErrors = validateDeliveryInfo()
    if (Object.keys(newErrors).length > 0) {
      showWarning('Please fill all required fields')
      setCurrentStep(1)
      return
    }

    setLoading(true)

    try {
      const orderPayload = {
        items: orderData.items.map(item => ({
          foodItemId: item.foodId,
          quantity: item.quantity
        })),
        deliveryAddress: {
          fullName: deliveryInfo.fullName,
          phone: deliveryInfo.phone,
          addressLine1: deliveryInfo.address,
          landmark: deliveryInfo.landmark,
          city: deliveryInfo.city,
          state: deliveryInfo.state,
          pincode: deliveryInfo.pincode
        },
        paymentMethod,
        orderSource: 'cart'
      }

      // Create order first (for both COD and online payment)
      const response = await axios.post(
        API_ENDPOINTS.order.create,
        orderPayload,
        axiosConfig
      )

      if (!response.data) {
        showError('Failed to place order')
        setLoading(false)
        return
      }

      // Get orderId from response
      const orderId = response.data.orderId || response.data.order?._id
      if (!orderId) {
        console.error('No orderId in response:', response.data)
        showError('Order created but tracking ID not found')
        setLoading(false)
        return
      }

      // If razorpay payment, initiate Razorpay
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(orderId)
        return // Don't set loading to false here, Razorpay handlers will do it
      }

      // For COD, navigate to confirmation page
      showSuccess('Order placed successfully!')
      await clearCart() // Clear cart after successful order
      navigate(`/order/confirmation/${orderId}`, {
        state: { orderId: orderId }
      })
    } catch (error) {
      console.error('Order placement error:', error)
      showError(error.response?.data?.error || error.response?.data?.message || 'Failed to place order')
    } finally {
      if (paymentMethod === 'cod') {
        setLoading(false)
      }
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

              {/* Saved addresses — picker sits above the manual form so the
                  form can collapse entirely when one is selected. */}
              {loadingAddresses ? (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading saved addresses…
                </div>
              ) : savedAddresses.length > 0 ? (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery address
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {savedAddresses.map((addr) => {
                      const active = useSavedAddress && selectedAddressId === addr._id
                      return (
                        <button
                          key={addr._id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(addr._id)
                            setUseSavedAddress(true)
                            applySavedAddress(addr)
                          }}
                          className={`text-left rounded-xl border-2 p-3 transition-all cursor-pointer ${
                            active
                              ? 'border-orange-500 bg-orange-50/60 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="text-sm font-semibold text-gray-900">
                              {addr.label || 'Address'}
                            </span>
                            {addr.isDefault && (
                              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {addr.addressLine1 || addr.street}
                            {addr.landmark ? `, ${addr.landmark}` : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {addr.city}, {addr.state} - {addr.pincode || addr.pinCode}
                          </p>
                          {addr.fullName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {addr.fullName}{addr.phone ? ` · ${addr.phone}` : ''}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUseSavedAddress(false)
                      setSelectedAddressId(null)
                      setDeliveryInfo({
                        fullName: '', phone: '', email: user?.email || '',
                        address: '', addressLine2: '', landmark: '',
                        city: '', state: '', pincode: ''
                      })
                      setErrors({})
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Clear and enter a new address
                  </button>
                </div>
              ) : (
                <p className="mb-5 text-sm text-gray-500">
                  No saved addresses yet — add your delivery details below, or{' '}
                  <Link to="/profile/settings" className="text-orange-600 font-semibold hover:underline">
                    save an address in Profile Settings
                  </Link>{' '}
                  for faster checkout next time.
                </p>
              )}

              {/* The form below is always visible and editable — a saved
                  address simply prefills it. */}
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
                <div className={`md:col-span-2 ${useSavedAddress && selectedAddressId ? 'hidden' : ''}`}>
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
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${
                  !razorpayLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${paymentMethod === 'razorpay'
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={!razorpayLoaded}
                    className="w-5 h-5 text-orange-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-800">Online Payment</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {razorpayLoaded ? 'UPI, Cards, Net Banking' : 'Currently unavailable'}
                    </p>
                  </div>
                  <CheckCircle className={`w-6 h-6 ${paymentMethod === 'razorpay' ? 'text-orange-600' : 'text-gray-300'
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
                    <FoodMedia
                      foodItem={{ image: item.image, video: item.video }}
                      className="w-16 h-16 rounded-lg flex-shrink-0"
                      imgClass="w-full h-full object-cover"
                      thumbSecond={1}
                      showPlay={true}
                      alt={item.name}
                    />
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
                  <span>Platform Fee (3%)</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                {deliveryFee === 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Free delivery on First 5 orders
                  </p>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-lg font-bold text-gray-800 mb-2">
                <span>Total Amount</span>
                <span className="text-orange-600 flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  {grandTotal}
                </span>
              </div>

             {/* Term and Conditions of platform charge */}
              <div className='mb-2 flex flex-row-reverse'>
                 
                <p className="text-[8px] text-gray-500 flex items-center ">
                 <Asterisk className="w-3 h-3 text-rose-800" /> Every order has 3% additional platform charge
                </p>
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
