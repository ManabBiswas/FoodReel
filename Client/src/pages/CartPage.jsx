import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { showError, showSuccess, showWarning } from '../utils/toast'
import {
  ShoppingCart, Trash2, Plus, Minus, AlertCircle,
  ArrowLeft, Lock, CheckCircle, ChevronRight, Tag
} from 'lucide-react'
import Navbar from '../Components/Navbar'

/* ─── helpers ───────────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toFixed(2)

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, loading, removeItem, updateQuantity, clearCart, validateCart } = useCart()
  const [validating, setValidating] = useState(false)
  const [cartIssues, setCartIssues] = useState([])
  const [appliedRestaurant, setAppliedRestaurant] = useState(null)

  const handleValidateCart = useCallback(async () => {
    setValidating(true)
    const result = await validateCart()
    if (result.cart?.activeRestaurant) setAppliedRestaurant(result.cart.activeRestaurant)
    if (result.issues?.length > 0) {
      setCartIssues(result.issues)
      if (!result.valid) showWarning(`${result.issues.length} item(s) have issues`)
    } else {
      setCartIssues([])
    }
    setValidating(false)
  }, [validateCart])

  useEffect(() => { handleValidateCart() }, [cart, handleValidateCart])

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 0) return
    const result = await updateQuantity(itemId, newQty)
    if (!result.success) showError(result.error)
  }

  const handleRemoveItem = async (itemId) => {
    const result = await removeItem(itemId)
    if (result.success) showSuccess('Item removed from cart')
    else showError(result.error)
  }

  const handleClearCart = async () => {
    if (!window.confirm('Clear your entire cart?')) return
    const result = await clearCart()
    if (result.success) showSuccess('Cart cleared')
    else showError(result.error)
  }

  const handleCheckout = () => {
    if (!cart?.items?.length) { showError('Your cart is empty'); return }
    if (cartIssues.length > 0) { showError('Please resolve cart issues before checkout'); return }
    const orderData = {
      items: cart.items.map(item => ({
        foodId: item.foodItem._id,
        quantity: item.quantity,
        name: item.foodItem.name,
        price: item.priceAtAdd,
      })),
      totalPrice: cart.totals?.itemsTotal || 0,
      restaurantId: appliedRestaurant,
    }
    navigate('/checkout', { state: { orderData } })
  }

  /* ── loading ─────────────────────────────────────────────────── */
  if (loading && !cart) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full" style={{ border: '3px solid var(--color-border-light)', borderTopColor: 'var(--color-primary)' }} />
            <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>Loading your cart…</p>
          </div>
        </div>
      </div>
    )
  }

  const isEmpty = !cart?.items || cart.items.length === 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          {/* ── Page header ────────────────────────────────────── */}
          <div className="mb-8">
            <button onClick={() => navigate('/order/history')} className="mb-4 flex items-center gap-2 text-sm font-medium font-sans transition-colors py-2 px-4 border-2 rounded-full cursor-pointer" style={{ color: 'var(--color-text-muted);' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                        >
                          <ArrowLeft className="h-4 w-4" /> Back to Orders
                        </button>
            <h1 className="font-serif text-5xl font-bold" style={{ color: 'var(--color-text-base)' }}>
              My Cart
            </h1>
            {!isEmpty && (
              <p className="mt-1 font-sans text-base" style={{ color: 'var(--color-text-muted)' }}>
                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                {appliedRestaurant && ` from ${typeof appliedRestaurant === 'object' ? appliedRestaurant.companyName : 'Restaurant'}`}
              </p>
            )}
          </div>

          {/* ── Empty state ─────────────────────────────────────── */}
          {isEmpty ? (
            <div
              className="flex flex-col items-center justify-center rounded-3xl py-24 text-center"
              style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'var(--color-surface-muted)' }}>
                <ShoppingCart className="h-10 w-10" style={{ color: 'var(--color-text-faint)' }} />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--color-text-base)' }}>Your cart is empty</h2>
              <p className="mb-6 font-sans" style={{ color: 'var(--color-text-muted)' }}>Start adding some delicious items!</p>
              <button
                onClick={() => navigate('/')}
                className="rounded-xl px-8 py-3 font-bold font-sans transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Explore Reels
              </button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">

              {/* ── Items column ──────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-4">

                {/* Restaurant context */}
                {appliedRestaurant && (
                  <div
                    className="flex items-center gap-4 rounded-2xl p-4"
                    style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
                  >
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: 'var(--color-background-white)' }}
                    >
                      🍽️
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
                        {typeof appliedRestaurant === 'object' ? appliedRestaurant.companyName : 'Restaurant'}
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-widest font-sans" style={{ color: 'var(--color-text-muted)' }}>
                        Active restaurant
                      </p>
                    </div>
                    <button
                      onClick={handleClearCart}
                      className="flex items-center gap-1.5 text-sm font-medium font-sans transition-colors cursor-pointer"
                      style={{ color: 'var(--color-text-faint)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-faint)'}
                    >
                      <Trash2 className="h-4 w-4" /> Clear
                    </button>
                  </div>
                )}

                {/* Issues banner */}
                {cartIssues.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                      <div>
                        <p className="font-bold font-sans text-red-800 mb-1">Cart issues</p>
                        <ul className="space-y-1">
                          {cartIssues.map((issue, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-red-700 font-sans">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const issue = cartIssues.find(i => i.itemId === item._id)

                    return (
                      <div
                        key={item._id}
                        className="group flex flex-col gap-4 rounded-2xl p-5 transition-all sm:flex-row sm:items-center"
                        style={{
                          background: issue ? '#FEF2F2' : 'var(--color-background-white)',
                          border: issue ? '1.5px solid #FECACA' : '1px solid var(--color-border-light)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* Food image */}
                        {item.foodItem?.image && (
                          <div className="h-28 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-28 flex-shrink-0">
                            <img src={item.foodItem.image} alt={item.foodItem.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold font-sans text-lg leading-tight" style={{ color: 'var(--color-text-base)' }}>
                              {item.foodItem?.name}
                            </h3>
                            <p className="font-bold font-sans text-lg flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                              ₹{item.priceAtAdd}
                            </p>
                          </div>

                          {item.foodItem?.description && (
                            <p className="mt-1 text-sm font-sans line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                              {item.foodItem.description}
                            </p>
                          )}

                          {item.specialInstructions && (
                            <p className="mt-1 text-xs italic font-sans" style={{ color: 'var(--color-text-faint)' }}>
                              "{item.specialInstructions}"
                            </p>
                          )}

                          {issue && (
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold font-sans bg-red-100 text-red-700">
                              <AlertCircle className="h-3 w-3" />
                              {issue.type === 'UNAVAILABLE' && 'Currently unavailable'}
                              {issue.type === 'PRICE_CHANGE' && `Price changed: ₹${issue.oldPrice} → ₹${issue.newPrice}`}
                              {issue.type === 'NOT_FOUND' && 'Item removed'}
                            </span>
                          )}

                          <div className="mt-4 flex items-center justify-between">
                            {/* Qty */}
                            <div
                              className="flex items-center gap-3 rounded-full px-3 py-1.5"
                              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}
                            >
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || loading}
                                className="transition-colors disabled:opacity-40 cursor-pointer"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="min-w-[1.5rem] text-center font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                disabled={item.quantity >= 99 || loading}
                                className="transition-colors disabled:opacity-40 cursor-pointer"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <p className="font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>
                                ₹{fmt(item.priceAtAdd * item.quantity)}
                              </p>
                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                disabled={loading}
                                className="flex items-center gap-1 text-sm font-medium font-sans transition-colors disabled:opacity-40 cursor-pointer"
                                style={{ color: 'var(--color-text-faint)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-faint)'}
                              >
                                <Trash2 className="h-4 w-4" /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bottom row */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate('/reels')}
                    className="rounded-xl border-2 px-8 py-3 font-bold font-sans transition-all hover:opacity-80 cursor-pointer"
                    style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>

              {/* ── Summary sidebar ────────────────────────────────── */}
              <div className="lg:col-span-1">
                <div
                  className="sticky top-24 rounded-3xl p-8"
                  style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-lg)' }}
                >
                  <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: 'var(--color-text-base)' }}>
                    Order Summary
                  </h2>

                  {/* Pricing */}
                  <div className="space-y-3 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    {[
                      { label: 'Items total', val: fmt(cart.totals?.itemsTotal), color: 'var(--color-text-muted)' },
                      cart.totals?.deliveryFee > 0
                        ? { label: 'Delivery fee', val: fmt(cart.totals.deliveryFee), color: 'var(--color-text-muted)' }
                        : { label: 'Delivery fee', val: 'FREE', color: '#16a34a' },
                      cart.totals?.platformFee > 0
                      && { label: 'Platform fee', val: fmt(cart.totals.platformFee), color: 'var(--color-text-muted)' },
                      cart.totals?.taxes > 0
                      && { label: 'Taxes (GST)', val: fmt(cart.totals.taxes), color: 'var(--color-text-muted)' },
                      cart.totals?.discount > 0
                      && { label: 'Discount', val: `-₹${fmt(cart.totals.discount)}`, color: '#16a34a' },
                    ].filter(Boolean).map(({ label, val, color }) => (
                      <div key={label} className="flex justify-between font-sans">
                        <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                        <span className="font-medium" style={{ color }}>{val.startsWith('₹') || val === 'FREE' || val.startsWith('-') ? val : `₹${val}`}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grand total */}
                  <div className="mb-6 rounded-2xl p-5" style={{ background: 'var(--color-background-dark)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest font-sans mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Grand Total</p>
                    <p className="font-serif text-4xl font-bold text-white tracking-tight">
                      ₹{fmt(cart.totals?.grandTotal)}
                    </p>
                  </div>

                  {/* Promo */}
                  {cart.totals?.discount > 0 && (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(255,184,0,0.08)', border: '1px dashed rgba(255,184,0,0.4)' }}>
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--color-accent)' }}>
                        <Tag className="h-4 w-4" style={{ color: 'var(--color-background-dark)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>Promo applied!</p>
                        <p className="text-xs font-sans" style={{ color: 'var(--color-text-muted)' }}>You saved ₹{fmt(cart.totals.discount)}</p>
                      </div>
                    </div>
                  )}

                  {cartIssues.length > 0 && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl p-3 font-sans" style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-700" />
                      <p className="text-xs text-yellow-700">Resolve cart issues before checkout</p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isEmpty || cartIssues.length > 0 || loading || validating}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold font-sans text-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
                  >
                    Proceed to Checkout
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="flex items-center justify-center gap-2 font-sans" style={{ color: 'var(--color-text-faint)' }}>
                    <Lock className="h-4 w-4" />
                    <span className="text-xs">Safe &amp; Secure Payments</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default CartPage