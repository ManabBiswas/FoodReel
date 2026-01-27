import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { showError, showSuccess, showWarning } from '../utils/toast'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  ArrowLeft,
  Info,
  Lock,
  Home,
  MapPin,
  IndianRupee,
  CheckCircle
} from 'lucide-react'

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, loading, removeItem, updateQuantity, clearCart, validateCart } = useCart()
  const [validating, setValidating] = useState(false)
  const [cartIssues, setCartIssues] = useState([])
  const [appliedRestaurant, setAppliedRestaurant] = useState(null)

  const handleValidateCart = useCallback(async () => {
    setValidating(true)
    const result = await validateCart()
    if (result.cart?.activeRestaurant) {
      setAppliedRestaurant(result.cart.activeRestaurant)
    }
    if (result.issues?.length > 0) {
      setCartIssues(result.issues)
      if (!result.valid) {
        showWarning(`${result.issues.length} item(s) have issues`)
      }
    } else {
      setCartIssues([])
    }
    setValidating(false)
  }, [validateCart])

  // Validate cart on load
  useEffect(() => {
    handleValidateCart()
  }, [cart, handleValidateCart])

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 0) return
    const result = await updateQuantity(itemId, newQty)
    if (!result.success) {
      showError(result.error)
    }
  }

  const handleRemoveItem = async (itemId) => {
    const result = await removeItem(itemId)
    if (result.success) {
      showSuccess('Item removed from cart')
    } else {
      showError(result.error)
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      const result = await clearCart()
      if (result.success) {
        showSuccess('Cart cleared')
      } else {
        showError(result.error)
      }
    }
  }

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      showError('Your cart is empty')
      return
    }

    if (cartIssues.length > 0) {
      showError('Please resolve cart issues before checkout')
      return
    }

    // Prepare order data
    const orderData = {
      items: cart.items.map(item => ({
        foodId: item.foodItem._id,
        quantity: item.quantity,
        name: item.foodItem.name,
        price: item.priceAtAdd
      })),
      totalPrice: cart.totals?.itemsTotal || 0,
      restaurantId: appliedRestaurant
    }

    navigate('/checkout', { state: { orderData } })
  }

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-orange-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  const isEmpty = !cart?.items || cart.items.length === 0

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
            <ShoppingCart className="w-8 h-8 text-orange-600" />
            My Cart
          </h1>
        </div>

        {isEmpty ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start adding some delicious items!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Cart Issues Alert */}
              {cartIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Cart Issues</h3>
                      <ul className="space-y-1 text-sm text-red-700">
                        {cartIssues.map((issue, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Header */}
              <div className="flex justify-between items-center bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-800">
                  {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                </h2>
                {cart.items.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                {cart.items.map((item) => {
                  const issue = cartIssues.find(i => i.itemId === item._id)
                  const hasIssue = !!issue

                  return (
                    <div
                      key={item._id}
                      className={`bg-white rounded-xl shadow p-4 transition-all ${
                        hasIssue ? 'border-2 border-red-200 bg-red-50' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        {item.foodItem?.image && (
                          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                            <img
                              src={item.foodItem.image}
                              alt={item.foodItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.foodItem?.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.foodItem?.description?.substring(0, 60)}...
                          </p>

                          {/* Price Info */}
                          <div className="flex items-center gap-4 text-sm">
                            {hasIssue && issue.type === 'PRICE_CHANGE' ? (
                              <>
                                <span className="line-through text-gray-500">
                                  ₹{issue.oldPrice}
                                </span>
                                <span className="font-semibold text-red-600">
                                  ₹{issue.newPrice}
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-gray-800">
                                ₹{item.priceAtAdd}
                              </span>
                            )}
                          </div>

                          {/* Issue Badge */}
                          {hasIssue && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {issue.type === 'UNAVAILABLE' && 'Currently Unavailable'}
                              {issue.type === 'PRICE_CHANGE' && 'Price Changed'}
                              {issue.type === 'NOT_FOUND' && 'Item Removed'}
                            </div>
                          )}
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex flex-col items-end gap-2">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || loading}
                              className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="w-8 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              disabled={item.quantity >= 99 || loading}
                              className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Subtotal</p>
                            <p className="font-bold text-gray-800">
                              ₹{(item.priceAtAdd * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {item.specialInstructions && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Special instructions:</p>
                          <p className="text-sm text-gray-700 italic">"{item.specialInstructions}"</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

                {/* Restaurant Info */}
                {appliedRestaurant && (
                  <div className="mb-6 p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                      From
                    </p>
                    <p className="font-semibold text-gray-800">
                      {typeof appliedRestaurant === 'object'
                        ? appliedRestaurant.companyName
                        : 'Restaurant'}
                    </p>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Total</span>
                    <span className="font-medium">₹{cart.totals?.itemsTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {cart.totals?.deliveryFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span className="font-medium">₹{cart.totals.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {cart.totals?.platformFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Platform Fee</span>
                      <span className="font-medium">₹{cart.totals.platformFee.toFixed(2)}</span>
                    </div>
                  )}
                  {cart.totals?.taxes > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes (GST)</span>
                      <span className="font-medium">₹{cart.totals.taxes.toFixed(2)}</span>
                    </div>
                  )}
                  {cart.totals?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-₹{cart.totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white">
                  <p className="text-sm opacity-90 mb-1">Grand Total</p>
                  <p className="text-3xl font-bold">₹{cart.totals?.grandTotal?.toFixed(2) || '0.00'}</p>
                </div>

                {/* Info Messages */}
                {cartIssues.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      Please review and resolve cart issues before checkout
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isEmpty || cartIssues.length > 0 || loading || validating}
                  className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Proceed to Checkout
                </button>

                {/* Continue Shopping */}
                <button
                  onClick={() => navigate('/reel')}
                  className="w-full mt-3 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage
