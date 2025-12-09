import React from 'react'
import ReelPageHeader from './ReelPageheader'
import ReelMediaPlayer from './ReelMediaPlayer'
import ReelActionButtons from './ReelActionButtons'
import ReelBottomInfo from './ReelBottomInfo'
import ReelOrderButton from './ReelOrderButton'

const ReelArea = ({
  item,
  index,
  currentIndex,
  muted,
  videoRefs,
  likedPosts,
  savedPosts,
  followingStatus,
  openShopFor,
  onLike,
  onSave,
  onShare,
  onReview,
  onFollow,
  onShopToggle,
  onToggleMute,
  onOrderClick,
  formatCount
}) => {
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
          currentIndex={currentIndex}
          muted={muted}
          videoRefs={videoRefs}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Header */}
        <ReelPageHeader />

        {/* Right Side Action Buttons - Only for Posts */}
        {item.type === 'post' && (
          <ReelActionButtons
            item={item}
            likedPosts={likedPosts}
            savedPosts={savedPosts}
            muted={muted}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onReview={onReview}
            onShopToggle={onShopToggle}
            onToggleMute={onToggleMute}
            formatCount={formatCount}
          />
        )}

        {/* Order Button for Food Posts */}
        {item.type === 'post' && openShopFor === item._id && (
          <ReelOrderButton 
            food={item} 
            onOrderClick={onOrderClick}
          />
        )}

        {/* Bottom Info Section */}
        <ReelBottomInfo
          item={item}
          followingStatus={followingStatus}
          onFollow={onFollow}
        />
      </div>
    </div>
  )
}

export default ReelArea