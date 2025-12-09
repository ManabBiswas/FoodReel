import React from 'react'
import { ChefHat, MapPin, UserPlus, UserCheck, Clock } from 'lucide-react'

const ReelBottomInfo = ({ item, followingStatus, onFollow, formatDate }) => {
  if (item.type !== 'post') return null

  return (
    <div className="absolute bottom-6 left-0 right-0 p-3 pb-24 sm:pb-8 z-10">
      <div className="max-w-full pr-16 sm:pr-20">
        {/* Partner Post Content */}
        {item.postSource === 'partner' && item.partnerId && (
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-xs sm:text-sm truncate">
                {item.partnerId.companyName || item.partnerId.email || 'Food Partner'}
              </h4>
              <p className="text-white/70 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="truncate">
                  {item.partnerId.location || item.partnerId.address || 'Location not specified'}
                </span>
              </p>
            </div>
            <button 
              onClick={() => onFollow(item.partnerId._id, 'FoodPartner')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex-shrink-0 flex items-center gap-1 cursor-pointer ${
                followingStatus[item.partnerId._id] 
                  ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {followingStatus[item.partnerId._id] ? (
                <>
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Follow
                </>
              )}
            </button>
          </div>
        )}

        {/* User Post Content */}
        {item.postSource === 'user' && item.postedBy && (
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                {item.postedBy.profileImage ? (
                  <img 
                    src={item.postedBy.profileImage} 
                    alt={item.postedBy.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs sm:text-sm font-bold">
                    {item.postedBy.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-xs sm:text-sm truncate">
                {item.postedBy.name || item.postedBy.email || 'User'}
              </h4>
              {item.taggedPartner && (
                <p className="text-white/70 text-[10px] sm:text-xs truncate">
                  📍 {item.taggedPartner.companyName || 'Restaurant'}
                </p>
              )}
            </div>
            <button 
              onClick={() => onFollow(item.postedBy._id, 'User')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex-shrink-0 flex items-center gap-1 cursor-pointer ${
                followingStatus[item.postedBy._id] 
                  ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {followingStatus[item.postedBy._id] ? (
                <>
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Follow
                </>
              )}
            </button>
          </div>
        )}

        {/* Post Title & Description */}
        <div className="space-y-1">
          <h3 className="text-white font-bold text-sm sm:text-base line-clamp-2">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
              {item.description}
            </p>
          )}
          {/* Post Date */}
          {item.createdAt && formatDate && (
            <p className="text-white/60 text-[10px] sm:text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReelBottomInfo
