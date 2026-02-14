import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { showSuccess, showError } from '../utils/toast'
import { X, MapPin, Phone, User, MessageCircle, CreditCard, Loader2, CheckCircle, Plus, Minus, ShoppingCart } from 'lucide-react'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useCurrentUser } from '../hooks/useAuth'

const QuickOrderModal = ({ food, isOpen, onClose }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const currentUser = useCurrentUser()
  const [step, setStep] = useState(1) // 1: Address, 2: Payment
  const [loading, setLoading] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  })
  const [orderNotes, setOrderNotes] = useState('')
  const [pricing, setPricing] = useState(null)
  const [quant, setQuant] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('razorpay') // 'razorpay' or 'cod'

  const handleIncrement = () => {
    setQuant(prev => prev + 1)
  }

  const handleDecrement = () => {
    if (quant > 1) {
      setQuant(prev => prev - 1)
    }
  }

  // Fetch saved addresses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSavedAddresses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const response = await axios.get(API_ENDPOINTS.user.address, axiosConfig)
      if (response.data.addresses && response.data.addresses.length > 0) {
        setSavedAddresses(response.data.addresses)
        const defaultAddr = response.data.addresses.find(addr => addr.isDefault)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id)
          populateAddressForm(defaultAddr)
        } else {
          setSelectedAddressId(response.data.addresses[0]._id)
          populateAddressForm(response.data.addresses[0])
        }
      } else {
        setShowNewAddressForm(true)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setShowNewAddressForm(true)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const populateAddressForm = (addr) => {
    setAddress({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || ''
    })
  }

  const handleAddressSelection = (addrId) => {
    setSelectedAddressId(addrId)
    const selectedAddr = savedAddresses.find(addr => addr._id === addrId)
    if (selectedAddr) {
      populateAddressForm(selectedAddr)
    }
  }

  // Recalculate pricing when quantity changes
  useEffect(() => {
    if (food && food.price) {
      const basePrice = Math.round(food.price * quant * 100) / 100
      const deliveryFee = 0
      const platformFee = Math.round(basePrice * 0.03 * 100) / 100
      const subtotal = basePrice + deliveryFee + platformFee
      const gst = Math.round(subtotal * 0.05 * 100) / 100
      const total = Math.round((subtotal + gst) * 100) / 100

      setPricing({
        itemPrice: basePrice,
        deliveryFee,
        platformFee,
        gst,
        total
      })
    }
  }, [food, quant])

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value })
  }

  const isAddressValid = () => {
    return address.fullName && address.phone && address.addressLine1 &&
      address.city && address.state && address.pincode
  }

  const handleContinueToPayment = () => {
    if (isAddressValid()) {
      setStep(2)
    }
  }

  const handleAddToCart = () => {
    addToCart(food, quant);
    showSuccess('Order added to cart!')
    onClose()
  }

  const handlePlaceOrder = async () => {
    try {
      setLoading(true)

      const orderResponse = await axios.post(
        API_ENDPOINTS.order.create,
        {
          items: [
            {
              foodItemId: food._id,
              quantity: quant
            }
          ],
          deliveryAddress: address,
          specialInstructions: orderNotes,
          orderSource: 'reel',
          paymentMethod: paymentMethod
        },
        axiosConfig
      )

      if (!orderResponse.data.order || !orderResponse.data.order._id) {
        showError('Failed to create order')
        return
      }

      const orderId = orderResponse.data.order._id

      // Send order confirmation email
      try {
        const deliveryAddressStr = `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`
        const userEmail = currentUser?.email || address.email
        const userName = currentUser?.firstName || currentUser?.name || address.fullName
        
        if (userEmail) {
          await axios.post(
            API_ENDPOINTS.emails.orderConfirmation,
            {
              email: userEmail,
              userName: userName,
              orderDetails: {
                orderId: orderId,
                items: [{
                  name: food.name || food.title,
                  quantity: quant,
                  price: food.price
                }],
                itemTotal: pricing.itemPrice,
                deliveryFee: pricing.deliveryFee,
                platformFee: pricing.platformFee,
                gst: pricing.gst,
                grandTotal: pricing.total,
                deliveryAddress: deliveryAddressStr,
                estimatedTime: '30 - 45 minutes'
              }
            },
            axiosConfig
          )
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't block order flow if email fails
      }

      if (paymentMethod === 'cod') {
        showSuccess('Order placed successfully!')
        onClose()
        navigate(`/order/confirmation/${orderId}`, { state: { orderId } })
        return
      }

      const paymentResponse = await axios.post(
        API_ENDPOINTS.payment.createOrder,
        { orderId: orderId },
        axiosConfig
      )

      if (paymentResponse.data.success) {
        const amountInPaise = Math.round(paymentResponse.data.amount * 100)
        
        const options = {
          key: paymentResponse.data.keyId,
          amount: amountInPaise,
          currency: paymentResponse.data.currency,
          name: 'FoodReel',
          description: food.title || food.name,
          order_id: paymentResponse.data.razorpayOrderId,
          handler: async function (razorpayResponse) {
            await verifyPayment(orderId, razorpayResponse)
          },
          prefill: {
            name: address.fullName,
            contact: address.phone
          },
          theme: { color: '#16A34A' },
          modal: {
            ondismiss: function() {
              setLoading(false)
            }
          }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error('Order error:', error)
      showError(error.response?.data?.message || error.response?.data?.error || 'Failed to create order. Please try again.')
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId, razorpayResponse) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.payment.verify,
        {
          orderId,
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature
        },
        axiosConfig
      )

      if (response.data.success) {
        showSuccess('Order placed successfully!')
        onClose()
        navigate(`/order/confirmation/${orderId}`, { state: { orderId } })
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      showError('Payment verification failed')
      setLoading(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setQuant(1)
      setOrderNotes('')
      setPaymentMethod('razorpay')
      setSelectedAddressId(null)
      setShowNewAddressForm(false)
      setSavedAddresses([])
      setAddress({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: ''
      })
    }
  }, [isOpen])

  if (!isOpen || !food) return null

  return (
    <div className="fixed mb-16 inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Quick Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Food Summary */}
          <div className="flex gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
            <img
              src={food.foodImageUrl || food.mediaUrl || food.video}
              alt={food.title || food.name}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{food.title || food.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{food.description}</p>
              <p className="text-lg font-bold text-green-600 mt-1">₹{food.price}</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-xs text-gray-600">Quantity</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDecrement}
                  disabled={quant <= 1}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold w-8 text-center">{quant}</span>
                <button
                  onClick={handleIncrement}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded-full transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Step 1: Delivery Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Delivery Address
              </h3>

              {loadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Loading addresses...</span>
                </div>
              ) : (
                <>
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => handleAddressSelection(addr._id)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedAddressId === addr._id
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{addr.fullName}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                              {addr.isDefault && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            {selectedAddressId === addr._id && (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-green-600 hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Address
                      </button>
                    </div>
                  )}

                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div className="space-y-3">
                      {savedAddresses.length > 0 && (
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-sm text-green-600 hover:underline mb-2"
                        >
                          ← Back to saved addresses
                        </button>
                      )}
                      
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name *"
                        value={address.fullName}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        required
                      />

                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number *"
                        value={address.phone}
                        onChange={handleAddressChange}
                        maxLength={11}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        required
                      />

                      <textarea
                        name="addressLine1"
                        placeholder="House No., Building Name *"
                        value={address.addressLine1}
                        onChange={handleAddressChange}
                        rows={2}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                        required
                      />

                      <input
                        type="text"
                        name="addressLine2"
                        placeholder="Road Name, Area, Colony (Optional)"
                        value={address.addressLine2}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                      />

                      <input
                        type="text"
                        name="landmark"
                        placeholder="Landmark (Optional)"
                        value={address.landmark}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="city"
                          placeholder="City *"
                          value={address.city}
                          onChange={handleAddressChange}
                          className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                          required
                        />
                        <input
                          type="text"
                          name="state"
                          placeholder="State *"
                          value={address.state}
                          onChange={handleAddressChange}
                          className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                          required
                        />
                      </div>

                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode *"
                        value={address.pincode}
                        onChange={handleAddressChange}
                        maxLength={6}
                        pattern="[0-9]{6}"
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <textarea
                placeholder="Order notes (Optional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
              />
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && pricing && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Order Summary & Payment
              </h3>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                      paymentMethod === 'razorpay' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-center">Online Payment</p>
                    <p className="text-xs text-gray-500 text-center mt-1">UPI, Card, Net Banking</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <svg 
                      className={`w-6 h-6 mx-auto mb-2 ${
                        paymentMethod === 'cod' ? 'text-green-600' : 'text-gray-400'
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm font-medium text-center">Cash on Delivery</p>
                    <p className="text-xs text-gray-500 text-center mt-1">Pay when delivered</p>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span>Item Price ({quant} × ₹{food.price})</span>
                  <span>₹{pricing.itemPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span className={pricing.deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {pricing.deliveryFee === 0 ? 'FREE' : `₹${pricing.deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee (3%)</span>
                  <span>₹{pricing.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (5%)</span>
                  <span>₹{pricing.gst.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">₹{pricing.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Address Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">Delivering to:</h4>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-green-600 hover:underline font-medium"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>{address.fullName}</strong><br />
                  {address.phone}<br />
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}<br />
                  {address.city}, {address.state} - {address.pincode}
                  {address.landmark && <><br />Landmark: {address.landmark}</>}
                </p>
              </div>

              {orderNotes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h4 className="font-semibold text-sm mb-1">Order Notes:</h4>
                  <p className="text-sm text-gray-700">{orderNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-white sticky bottom-0">
          {step === 1 ? (
            <div className="space-y-2">
              <button
                onClick={handleContinueToPayment}
                disabled={!isAddressValid()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all text-sm sm:text-base"
              >
                Continue to Payment
              </button>
              <button
                onClick={handleAddToCart}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${pricing.total.toFixed(2)}`}
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium py-2 px-6 rounded-xl transition-all text-sm"
              >
                Back to Address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickOrderModal