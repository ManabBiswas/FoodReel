import React, { createContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
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
      console.error('Error fetching cart:', err)
      setError(err.response?.data?.error || 'Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

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
    itemCount: cart?.items?.length || 0,
    totals: cart?.totals || null
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
