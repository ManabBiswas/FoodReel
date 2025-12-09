import React from 'react'
import { useAuth } from '../Contexts/AuthContext'
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, Star, ShoppingBag, VolumeX, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ReelActionButtons = ({
    item,
    likedPosts,
    savedPosts,
    muted,
    onLike,
    onSave,
    //   onShare,
    onReview,
    onShopToggle,
    onToggleMute,
    formatCount
}) => {
    const { user, isAuthenticated } = useAuth();
    const nevigate = useNavigate();
    // redirect to login if not login act as a middleware
    const redirect = () => {
        if (!isAuthenticated) {
            alert("Please login first");
            setTimeout(() => { nevigate('/login') }, 1000);
            ;
        }

    }

    return (
        <div className="absolute -right-4 sm:right-4 bottom-36 md:bottom-56 sm:bottom-64 flex flex-col gap-3 sm:gap-4 z-10">
            {/* Like Button */}
            <button
                onClick={() => { redirect(); onLike(item._id, item.postSource) }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
            >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all ${likedPosts[item._id] ? 'bg-red-500/30' : ''}`}>
                    <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${likedPosts[item._id] ? 'fill-red-500 text-red-500 animate-scale-in' : 'text-white group-hover:fill-red-500 group-hover:text-red-500'}`} />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                    {formatCount(item.likes)}
                </span>
            </button>

            {/* Review Button */}
            <button
                onClick={() => { redirect(); onReview(item) }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
            >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-all" />
                </div>
            </button>


            {/* Save Button */}
            <button
                onClick={() => { redirect(); onSave(item._id) }}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
            >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all cursor-pointer ${savedPosts[item._id] ? 'bg-orange-500/30' : ''}`}>
                    {savedPosts[item._id] ? (
                        <BookmarkCheck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 fill-orange-400 animate-scale-in" />
                    ) : (
                        <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-white  group-hover:fill-green-400 group-hover:text-green-400 transition-all" />
                    )}
                </div>
            </button>

            {/* Shop Button */}
            {user && item.price && (
                <button
                    onClick={() => { redirect(); onShopToggle(item._id) }}
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