import React, { createContext, useState, useEffect } from 'react'
import { showSuccess, showInfo } from '../utils/toast'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodreel_cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
        localStorage.removeItem('foodreel_cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foodreel_cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Add item to cart
  const addToCart = (food, quantity = 1) => {
    setCartItems(prevItems => {
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex(item => item._id === food._id)
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
        showInfo(`Updated quantity for ${food.name || food.title}`)
        return updatedItems
      } else {
        // Add new item
        showSuccess(`Added ${food.name || food.title} to cart`)
        return [...prevItems, { ...food, quantity }]
      }
    })
  }

  // Remove item from cart
  const removeFromCart = (foodId) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i._id === foodId)
      if (item) {
        showInfo(`Removed ${item.name || item.title} from cart`)
      }
      return prevItems.filter(item => item._id !== foodId)
    })
  }

  // Update item quantity
  const updateQuantity = (foodId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(foodId)
      return
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === foodId ? { ...item, quantity } : item
      )
    )
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    showInfo('Cart cleared')
  }

  // Get total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  }

  // Get total items count
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
