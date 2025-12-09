import React from 'react'
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, Star, ShoppingBag, VolumeX, Volume2 } from 'lucide-react'

const ReelActionButtons = ({
  item,
  likedPosts,
  savedPosts,
  muted,
  onLike,
  onSave,
  onShare,
  onReview,
  onShopToggle,
  onToggleMute,
  formatCount
}) => {
  return (
    <div className="absolute right-2 sm:right-4 bottom-24 sm:bottom-28 flex flex-col gap-3 sm:gap-4 z-10">
      {/* Like Button */}
      <button 
        onClick={() => onLike(item._id, item.postSource)}
        className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      >
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all ${likedPosts[item._id] ? 'bg-red-500/30' : ''}`}>
          <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${likedPosts[item._id] ? 'fill-red-500 text-red-500 animate-scale-in' : 'text-white group-hover:fill-red-500 group-hover:text-red-500'}`} />
        </div>
        <span className="text-white text-[10px] sm:text-xs font-semibold">
          {formatCount(item.likes)}
        </span>
      </button>

      {/* Comment Button */}
      <button className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <span className="text-white text-[10px] sm:text-xs font-semibold">
          {formatCount(item.comments || 0)}
        </span>
      </button>

      {/* Share Button */}
      <button 
        onClick={() => onShare(item)}
        className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
          <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <span className="text-white text-[10px] sm:text-xs font-semibold">
          {formatCount(item.shares || 0)}
        </span>
      </button>

      {/* Save Button */}
      <button 
        onClick={() => onSave(item._id)}
        className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      >
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all cursor-pointer ${savedPosts[item._id] ? 'bg-orange-500/30' : ''}`}>
          {savedPosts[item._id] ? (
            <BookmarkCheck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 fill-orange-400 animate-scale-in" />
          ) : (
            <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </div>
      </button>

      {/* Review Button */}
      <button 
        onClick={() => onReview(item)}
        className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-all" />
        </div>
      </button>

      {/* Shop Button */}
      {item.price && (
        <button 
          onClick={() => onShopToggle(item._id)}
          className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </button>
      )}

      {/* Mute/Unmute for videos */}
      {item.mediaType === 'video' && (
        <button 
          onClick={onToggleMute}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
        >
          {muted ? (
            <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </button>
      )}
    </div>
  )
}

export default ReelActionButtons