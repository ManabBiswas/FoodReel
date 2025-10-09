import React from 'react'
import { ShoppingCart, Clock } from 'lucide-react'

const ReelOrderButton = ({ food, onOrderClick }) => {
  if (!food || food.type !== 'post' || !food.price) return null

  return (
    <div className="absolute bottom-24 sm:bottom-28 left-3 right-16 sm:left-4 sm:right-20 z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
        {/* Price and Info */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="font-bold text-sm sm:text-lg text-gray-900 truncate">{food.title}</h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              {food.preparationTime && (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{food.preparationTime} mins</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              ₹{food.price}
            </div>
            {food.originalPrice && food.originalPrice > food.price && (
              <div className="text-xs sm:text-sm text-gray-500 line-through">
                ₹{food.originalPrice}
              </div>
            )}
          </div>
        </div>

        {/* Order Button */}
        <button
          onClick={() => onOrderClick(food)}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg text-sm sm:text-base"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          Order Now
        </button>
      </div>
    </div>
  )
}

export default ReelOrderButton