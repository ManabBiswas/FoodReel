import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'

const Cart = () => {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart()

  const handleIncrement = (item) => {
    updateQuantity(item._id, item.quantity + 1)
  }

  const handleDecrement = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item._id, item.quantity - 1)
    }
  }

  const handleRemove = (item) => {
    removeFromCart(item._id)
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-16 px-4">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet</p>
            <button
              onClick={() => navigate('/')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Start Shopping
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-orange-600" />
              Shopping Cart
            </h1>
            <p className="text-gray-600 mt-2">{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={item.image || item.video || item.foodImageUrl || item.mediaUrl}
                        alt={item.name || item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg sm:text-xl text-gray-800 truncate">
                            {item.name || item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-2">
                          <button
                            onClick={() => handleDecrement(item)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleIncrement(item)}
                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                          <p className="text-xl font-bold text-orange-600">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              <button
                onClick={clearCart}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                    <span className="font-semibold">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee (2%)</span>
                    <span className="font-semibold">₹{(totalPrice * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (5%)</span>
                    <span className="font-semibold">₹{(totalPrice * 1.02 * 0.05).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-orange-600">
                      ₹{(totalPrice * 1.02 * 1.05).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Cart