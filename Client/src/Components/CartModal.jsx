import React, { useState } from 'react'
import { X } from 'lucide-react'
import AddToCart from './AddToCart'

const CartModal = ({ isOpen, foodItem, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <AddToCart foodItem={foodItem} onClose={onClose} />
      </div>
    </div>
  )
}

export default CartModal
