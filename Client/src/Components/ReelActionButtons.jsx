import { useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, Star, ShoppingBag, VolumeX, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ReelActionButtons = ({
    item,
    likedPosts,
    savedPosts,
    muted,
    onLike,
    onSave,
    onReview,
    onComment,
    onShopToggle,
    onToggleMute,
    formatCount
}) => {
    const { isAuthenticated, authType } = useAuth();
    const navigate = useNavigate();

    // Like/save/review/comment/cart/order endpoints are all user-only on the
    // server (isLoggedin), so surface them only to user sessions.
    const canActAsUser = isAuthenticated && authType === 'user';

    // Centralized authentication handler
    const handleAuthenticatedAction = useCallback((action) => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    message: 'Please login first',
                    from: window.location.pathname
                }
            });
            return;
        }
        if (authType !== 'user') {
            navigate(authType === 'partner' ? '/partner-dashboard' : '/admin/dashboard');
            return;
        }
        action();
    }, [isAuthenticated, authType, navigate]);

    // Memoized handlers
    const handleLike = useCallback(() => {
        handleAuthenticatedAction(() => onLike(item._id, item.postSource));
    }, [handleAuthenticatedAction, onLike, item._id, item.postSource]);

    const handleReview = useCallback(() => {
        handleAuthenticatedAction(() => onReview(item));
    }, [handleAuthenticatedAction, onReview, item]);

    const handleComment = useCallback(() => {
        handleAuthenticatedAction(() => onComment(item));
    }, [handleAuthenticatedAction, onComment, item]);

    const handleSave = useCallback(() => {
        handleAuthenticatedAction(() => onSave(item._id));
    }, [handleAuthenticatedAction, onSave, item._id]);

    const handleShopToggle = useCallback(() => {
        handleAuthenticatedAction(() => onShopToggle(item._id));
    }, [handleAuthenticatedAction, onShopToggle, item._id]);

    // Shared styles
    const buttonContainer = "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all";
    // const iconSize = "w-5 h-5 sm:w-6 sm:h-6";
    const textSize = "text-white font-semibold text-xs sm:text-sm md:text-base";

    return (
       <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-4 z-10">
  {/* Like Button */}
  {canActAsUser && (
  <button
    onClick={handleLike}
    className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
    aria-label={likedPosts[item._id] ? "Unlike post" : "Like post"}
  >
    <div className={`${buttonContainer} ${likedPosts[item._id] ? 'bg-red-500/30' : ''}`}>
      <Heart
        className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-all ${
          likedPosts[item._id]
            ? 'fill-red-500 text-red-500 animate-scale-in'
            : 'text-white group-hover:fill-red-500 group-hover:text-red-500'
        }`}
      />
    </div>
    <span className={textSize}>
      {formatCount(item.likeCount || 0)}
    </span>
  </button>
  )}

  {/* Review Button - Only for tagged food posts */}
  {canActAsUser && item.foodId && (
    <button
      onClick={handleReview}
      className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      aria-label="Review post"
    >
      <div className={buttonContainer}>
        <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-all" />
      </div>
    </button>
  )}

  {/* Comment Button - Only for regular user posts without food tag */}
  {canActAsUser && !item.foodId && item.postSource === 'user' && (
    <button
      onClick={handleComment}
      className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      aria-label="Comment on post"
    >
      <div className={buttonContainer}>
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white group-hover:fill-blue-400 group-hover:text-blue-400 transition-all" />
      </div>
      <span className={textSize}>
        {formatCount(item.comments || 0)}
      </span>
    </button>
  )}

  {/* Save Button */}
  {canActAsUser && (
  <button
    onClick={handleSave}
    className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
    aria-label={savedPosts[item._id] ? "Unsave post" : "Save post"}
  >
    <div className={`${buttonContainer} ${savedPosts[item._id] ? 'bg-orange-500/30' : ''}`}>
      {savedPosts[item._id] ? (
        <BookmarkCheck className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-400 fill-orange-400 animate-scale-in" />
      ) : (
        <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white group-hover:fill-green-400 group-hover:text-green-400 transition-all" />
      )}
    </div>
  </button>
  )}

  {/* Shop Button - Only show for user sessions when the item has a price */}
  {canActAsUser && item.price && (
    <button
      onClick={handleShopToggle}
      className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
      aria-label="Shop this item"
    >
      <div className={buttonContainer}>
        <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white group-hover:text-green-400 transition-all" />
      </div>
    </button>
  )}

  {/* Mute/Unmute for videos */}
  {item.mediaType === 'video' && (
    <button
      onClick={onToggleMute}
      className={`${buttonContainer} hover:bg-white/20`}
      aria-label={muted ? "Unmute video" : "Mute video"}
    >
      {muted ? (
        <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
      ) : (
        <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
      )}
    </button>
  )}
</div>
    )
}

export default ReelActionButtons