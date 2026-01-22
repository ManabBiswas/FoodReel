import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { showSuccess, showError } from '../utils/toast'
import { X, MapPin, Phone, User, MessageCircle, CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

const QuickOrderModal = ({ food, isOpen, onClose }) => {
  const [step, setStep] = useState(1) // 1: Address, 2: Payment
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (food) {
     
      const basePrice = Math.round(food.price * 100) / 100
      const deliveryFee = 0 // default deliveryDistance=0 in backend calculatePricing
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
  }, [food])

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

  const handlePlaceOrder = async () => {
    try {
      setLoading(true)

      // Step 1: Create the order first
      const orderResponse = await axios.post(
        API_ENDPOINTS.order.create,
        {
          items: [
            {
              foodItemId: food._id,
              quantity: 1
            }
          ],
          deliveryAddress: address,
          orderNotes: orderNotes,
          orderSource: 'modal',
          paymentMethod: 'razorpay'
        },
        axiosConfig
      )

      if (!orderResponse.data.order || !orderResponse.data.order._id) {
        showError('Failed to create order')
        return
      }

      const orderId = orderResponse.data.order._id

      // Step 2: Create payment order with the order ID
      const paymentResponse = await axios.post(
        API_ENDPOINTS.payment.createOrder,
        {
          orderId: orderId
        },
        axiosConfig
      )

      if (paymentResponse.data.success) {
        // Step 3: Open Razorpay
        // Convert amount to paise (1 rupee = 100 paise)
        const amountInPaise = Math.round(paymentResponse.data.amount * 100);
        
        const options = {
          key: paymentResponse.data.keyId,
          amount: amountInPaise,
          currency: paymentResponse.data.currency,
          name: 'FoodReel',
          description: food.title,
          order_id: paymentResponse.data.razorpayOrderId,
          handler: async function (razorpayResponse) {
            // Verify payment
            await verifyPayment(
              orderId,
              razorpayResponse
            )
          },
          prefill: {
            name: address.fullName,
            contact: address.phone
          },
          theme: {
            color: '#FACC15'
          }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error('Order error:', error)
      showError(error.response?.data?.message || error.response?.data?.error || 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId, razorpayResponse) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.payment.verify,
        {
          orderId,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature
        },
        axiosConfig
      )

      if (response.data.success) {
        // Show success and navigate
        showSuccess('Order placed successfully!')
        onClose()
        window.location.href = `/order/${orderId}`
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      showError('Payment verification failed')
    }
  }

  if (!isOpen || !food) return null

  return (
    <div className="fixed mb-16 inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-lg ">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Quick Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Food Summary */}
          <div className="flex gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
            <img
              src={food.foodImageUrl || food.mediaUrl}
              alt={food.title}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{food.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{food.description}</p>
              <p className="text-lg font-bold text-green-600 mt-1">₹{food.price}</p>
            </div>
          </div>

          {/* Step 1: Delivery Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </h3>

              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={address.fullName}
                onChange={handleAddressChange}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={address.phone}
                onChange={handleAddressChange}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              />

              <textarea
                name="addressLine1"
                placeholder="House No., Building Name"
                value={address.addressLine1}
                onChange={handleAddressChange}
                rows={2}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
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
                  placeholder="City"
                  value={address.city}
                  onChange={handleAddressChange}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={address.state}
                  onChange={handleAddressChange}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={address.pincode}
                onChange={handleAddressChange}
                maxLength={6}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              />

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
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Order Summary
              </h3>

              {/* Price Breakdown */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span>Item Price</span>
                  <span>₹{pricing.itemPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>₹{pricing.deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>₹{pricing.platformFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (5%)</span>
                  <span>₹{pricing.gst}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">₹{pricing.total}</span>
                </div>
              </div>

              {/* Delivery Address Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">Delivering to:</h4>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  {address.fullName}<br />
                  {address.phone}<br />
                  {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                  {address.city}, {address.state} - {address.pincode}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-white sticky bottom-0">
          {step === 1 ? (
            <button
              onClick={handleContinueToPayment}
              disabled={!isAddressValid()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all text-sm sm:text-base md:text-lg"
            >
              Continue to Payment
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base md:text-lg "
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Place Order - ₹{pricing.total}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickOrderModal