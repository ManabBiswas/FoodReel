import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { CartContext } from './CartContextBase'
import { useAuth } from '../hooks/useAuth'
import { newIdempotencyKey } from '../utils/idempotencyKey'

export const CartProvider = ({ children }) => {
  const { isAuthenticated, authType } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(API_ENDPOINTS.cart.get, axiosConfig)
      if (response.data?.cart) {
        setCart(response.data.cart)
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setCart(null)
        return
      }
      console.error('Error fetching cart:', err)
      setError(err.response?.data?.error || 'Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // The cart is per-account: load it when a user session exists, and drop the
  // previous session's cart on logout/login so data never leaks between accounts.
  useEffect(() => {
    if (authType === 'user' && isAuthenticated) {
      fetchCart()
    } else {
      setCart(null)
      setError(null)
    }
  }, [authType, isAuthenticated, fetchCart])

  // NOTE: addToCart is defined below clearCart, because it depends on it and a
  // useCallback dep array is evaluated at render time — referencing clearCart
  // before its `const` is initialised would throw on every render.

  // Update item quantity
  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.put(
        API_ENDPOINTS.cart.update(itemId),
        { quantity },
        axiosConfig
      )
      if (response.data?.cart) {
        setCart(response.data.cart)
        return { success: true }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  // Remove item from cart
  const removeItem = useCallback(async (itemId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.delete(
        API_ENDPOINTS.cart.remove(itemId),
        axiosConfig
      )
      if (response.data?.cart) {
        setCart(response.data.cart)
        return { success: true }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.delete(API_ENDPOINTS.cart.clear, axiosConfig)
      if (response.data?.cart) {
        setCart(response.data.cart)
        return { success: true }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  // Add item to cart
  // Defined after clearCart (see the note above) because it depends on it.
  const addToCart = useCallback(async (foodItemId, quantity = 1, specialInstructions = '') => {
    const send = () => axios.post(
      API_ENDPOINTS.cart.add,
      { foodItemId, quantity, specialInstructions },
      axiosConfig
    )

    try {
      setLoading(true)
      setError(null)
      let response
      try {
        response = await send()
      } catch (err) {
        // One restaurant per cart is a hard rule server-side. The backend asks the
        // question for us; without handling it the user just saw a red toast with
        // no way out, which also broke "Reorder" on a past order from elsewhere.
        if (err.response?.data?.code !== 'DIFFERENT_RESTAURANT') throw err
        if (!window.confirm(err.response.data.message)) {
          setError('Cart not changed.')
          return { success: false, error: 'Cart not changed.' }
        }
        await clearCart()
        response = await send()
      }
      if (response.data?.cart) {
        setCart(response.data.cart)
        return { success: true, message: response.data.message }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [clearCart])

  // Validate cart
  const validateCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(API_ENDPOINTS.cart.validate, axiosConfig)
      if (response.data?.cart) {
        setCart(response.data.cart)
      }
      return {
        success: response.data?.success || false,
        valid: response.data?.valid || false,
        issues: response.data?.issues || [],
        cart: response.data?.cart
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      return { success: false, valid: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  // Checkout
  // One key per LOGICAL checkout attempt.
//
// Note: nothing in Client/src currently calls this `checkout` — CartPage
// navigates to /checkout and Checkout.jsx posts to /orders with its own
// ref-held key. So this is defence-in-depth for the /cart/checkout endpoint
// rather than the path a user actually takes today. The ref (not a key minted
// per call) is what makes a retry reuse the order instead of creating another.
const checkoutKeyRef = useRef(null)

  const checkout = useCallback(async (deliveryAddress, paymentMethod = 'cod', specialInstructions = '') => {
    if (!checkoutKeyRef.current) checkoutKeyRef.current = newIdempotencyKey()
    const idempotencyKey = checkoutKeyRef.current

    try {
      setLoading(true)
      setError(null)
      const response = await axios.post(
        API_ENDPOINTS.cart.checkout,
        { deliveryAddress, paymentMethod, specialInstructions },
        { ...axiosConfig, headers: { ...axiosConfig.headers, 'Idempotency-Key': idempotencyKey } }
      )
      if (response.data?.order) {
        // Clear cart after successful checkout
        setCart(null)
        checkoutKeyRef.current = null
        return { success: true, order: response.data.order, orderId: response.data.orderId }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  const itemCount = useMemo(
    () => (cart?.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    [cart]
  )

  const value = useMemo(() => ({
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
    checkout,
    itemCount,
    totals: cart?.totals || null
  }), [
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
    checkout,
    itemCount
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
