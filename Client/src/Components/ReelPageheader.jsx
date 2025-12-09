import React from 'react'
import { TrendingUp, MoreVertical } from 'lucide-react'

const ReelPageHeader = () => {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        <span className="text-white font-semibold text-sm sm:text-base">FoodReels</span>
      </div>
      <button className="text-white p-1 hover:bg-white/10 rounded-full transition-colors">
        <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  )
}

export default ReelPageHeader