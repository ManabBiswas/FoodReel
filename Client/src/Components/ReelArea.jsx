import React, { memo } from 'react'
import ReelMediaPlayer from './ReelMediaPlayer'
import ReelActionButtons from './ReelActionButtons'
import ReelBottomInfo from './ReelBottomInfo'
import ReelOrderButton from './ReelOrderButton'
import ReelAdContent from './ReelAdContent'

const ReelArea = ({
  item,
  index,
  isActive,
  muted,
  videoRefs,
  isLiked,
  isSaved,
  isFollowing,
  isShopOpen,
  onLike,
  onSave,
  // onShare,
  onReview,
  onComment,
  onFollow,
  onShopToggle,
  onToggleMute,
  onOrderClick,
  onAdClick,
  formatCount,
  formatDate,
  onTogglePlayPause,
}) => {
  const isAd = item.type === 'ad'
  const isPost = item.type === 'post'

  return (
    <div 
      className="reel-container snap-start snap-always"
      data-reel
    >
      <div className="reel-content">
        {/* Media Player */}
        <ReelMediaPlayer 
          item={item}
          index={index}
          isActive={isActive}
          muted={muted}
          onTogglePlayPause={onTogglePlayPause}
          videoRefs={videoRefs}
        />
        
      {/* <ReelPageHeader /> */}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Header - Only for Posts */}

        {/* Ad Content - Only for Ads */}
        {isAd && (
          <ReelAdContent 
            ad={item} 
            onAdClick={onAdClick}
          />
        )}

        {/* Right Side Action Buttons - Only for Posts */}
        {isPost && (
          <ReelActionButtons
            item={item}
            isLiked={isLiked}
            isSaved={isSaved}
            muted={muted}
            onLike={onLike}
            onSave={onSave}
            // onShare={onShare}
            onReview={onReview}
            onComment={onComment}
            onShopToggle={onShopToggle}
            onToggleMute={onToggleMute}
            formatCount={formatCount}
          />
        )}

        {/* Order Button for Food Posts - Only for Posts */}
        {isPost && isShopOpen && (
          <ReelOrderButton 
            food={item} 
            onOrderClick={onOrderClick}
          />
        )}

        {/* Bottom Info Section - Only for Posts */}
        {isPost && (
          <ReelBottomInfo
            item={item}
            isFollowing={isFollowing}
            onFollow={onFollow}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  )
}

export default memo(ReelArea)