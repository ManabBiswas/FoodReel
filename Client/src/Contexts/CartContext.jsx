import React, { useState, useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { CartContext } from './CartContextBase'
import { useAuth } from '../hooks/useAuth'

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

  // Add item to cart
  const addToCart = useCallback(async (foodItemId, quantity = 1, specialInstructions = '') => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.post(
        API_ENDPOINTS.cart.add,
        { foodItemId, quantity, specialInstructions },
        axiosConfig
      )
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
  }, [])

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
  const checkout = useCallback(async (deliveryAddress, paymentMethod = 'cod', specialInstructions = '') => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.post(
        API_ENDPOINTS.cart.checkout,
        { deliveryAddress, paymentMethod, specialInstructions },
        axiosConfig
      )
      if (response.data?.order) {
        // Clear cart after successful checkout
        setCart(null)
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

  const value = {
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
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
