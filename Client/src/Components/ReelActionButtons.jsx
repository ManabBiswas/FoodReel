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
    onShopToggle,
    onToggleMute,
    formatCount
}) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

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
        action();
    }, [isAuthenticated, navigate]);

    // Memoized handlers
    const handleLike = useCallback(() => {
        handleAuthenticatedAction(() => onLike(item._id, item.postSource));
    }, [handleAuthenticatedAction, onLike, item._id, item.postSource]);

    const handleReview = useCallback(() => {
        handleAuthenticatedAction(() => onReview(item));
    }, [handleAuthenticatedAction, onReview, item]);

    const handleSave = useCallback(() => {
        handleAuthenticatedAction(() => onSave(item._id));
    }, [handleAuthenticatedAction, onSave, item._id]);

    const handleShopToggle = useCallback(() => {
        handleAuthenticatedAction(() => onShopToggle(item._id));
    }, [handleAuthenticatedAction, onShopToggle, item._id]);

    // Shared styles
    const buttonContainer = "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all";
    const iconSize = "w-5 h-5 sm:w-6 sm:h-6";
    const textSize = "text-white text-[10px] sm:text-xs font-semibold";

    return (
        <div className="absolute -right-4 sm:right-4 sm:top-36 md:top-42 lg:top-48 flex flex-col gap-3 sm:gap-4 z-10">
            {/* Like Button */}
            <button
                onClick={handleLike}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
                aria-label={likedPosts[item._id] ? "Unlike post" : "Like post"}
            >
                <div className={`${buttonContainer} ${likedPosts[item._id] ? 'bg-red-500/30' : ''}`}>
                    <Heart
                        className={`${iconSize} transition-all ${likedPosts[item._id]
                                ? 'fill-red-500 text-red-500 animate-scale-in'
                                : 'text-white group-hover:fill-red-500 group-hover:text-red-500'
                            }`}
                    />
                </div>
                <span className={textSize}>
                    {formatCount(item.likeCount || 0)}
                </span>
            </button>

            {/* Review Button */}
            <button
                onClick={handleReview}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
                aria-label="Review post"
            >
                <div className={buttonContainer}>
                    <Star className={`${iconSize} text-white group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-all`} />
                </div>
            </button>

            {/* Save Button */}
            <button
                onClick={handleSave}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
                aria-label={savedPosts[item._id] ? "Unsave post" : "Save post"}
            >
                <div className={`${buttonContainer} ${savedPosts[item._id] ? 'bg-orange-500/30' : ''}`}>
                    {savedPosts[item._id] ? (
                        <BookmarkCheck className={`${iconSize} text-orange-400 fill-orange-400 animate-scale-in`} />
                    ) : (
                        <Bookmark className={`${iconSize} text-white group-hover:fill-green-400 group-hover:text-green-400 transition-all`} />
                    )}
                </div>
            </button>

            {/* Shop Button - Only show if authenticated AND has price */}
            {isAuthenticated && item.price && (
                <button
                    onClick={handleShopToggle}
                    className="flex flex-col items-center gap-0.5 sm:gap-1 group cursor-pointer"
                    aria-label="Shop this item"
                >
                    <div className={buttonContainer}>
                        <ShoppingBag className={`${iconSize} text-white group-hover:text-green-400 transition-all`} />
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
                        <VolumeX className={`${iconSize} text-white`} />
                    ) : (
                        <Volume2 className={`${iconSize} text-white`} />
                    )}
                </button>
            )}
        </div>
    )
}

export default ReelActionButtons