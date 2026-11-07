import React from 'react'
import { MoreVertical } from 'lucide-react'
import Logo from '../assets/logo.png'

const ReelPageHeader = () => {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <img
          src={Logo}
          alt="FoodReel"
          className="h-7 w-auto sm:h-8 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
        />
        <span
          className="hidden sm:inline text-white/80 text-xs font-semibold uppercase tracking-[0.18em] font-sans"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          Reels
        </span>
      </div>
      <button
        type="button"
        aria-label="More options"
        className="cursor-pointer text-white p-1 rounded-full transition-colors hover:bg-white/15 active:scale-95"
      >
        <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  )
}

export default ReelPageHeader
