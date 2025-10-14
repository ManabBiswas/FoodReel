import React from 'react'
import { ShoppingCart, Clock } from 'lucide-react'

const ReelOrderButton = ({ food, onOrderClick }) => {
  // console.log('ReelOrderButton received:', {
  //   hasFood: !!food,
  //   type: food?.type,
  //   postSource: food?.postSource,
  //   price: food?.price,
  //   shouldShow: food && food.type === 'post' && food.price
  // })

  if (!food || food.type !== 'post' || !food.price) return null

  return (
    <div className="absolute bottom-28 sm:bottom-42 left-4 right-14 sm:left-6 sm:right-18 rounded-2xl z-30 backdrop-blur-2xl">
      <div className="bg-white/75 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
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
            <div className="text-md italic sm:text-xl font-bold text-green-600">
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
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg text-sm sm:text-base cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          Order Now
        </button>
      </div>
    </div>
  )
}

export default ReelOrderButton