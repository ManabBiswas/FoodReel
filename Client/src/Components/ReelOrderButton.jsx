import React from 'react'
import { ShoppingCart, Clock } from 'lucide-react'

const ReelOrderButton = ({ food, onOrderClick }) => {
  if (!food || food.type !== 'post' || !food.price) return null

  return (
    <div className="absolute bottom-32 left-4 right-20 z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        {/* Price and Info */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{food.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {food.preparationTime && (
                <>
                  <Clock className="w-4 h-4" />
                  <span>{food.preparationTime} mins</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ₹{food.price}
            </div>
            {food.originalPrice && food.originalPrice > food.price && (
              <div className="text-sm text-gray-500 line-through">
                ₹{food.originalPrice}
              </div>
            )}
          </div>
        </div>

        {/* Order Button */}
        <button
          onClick={() => onOrderClick(food)}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          Order Now
        </button>
      </div>
    </div>
  )
}

export default ReelOrderButton