import React, { useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

const ReelMediaPlayer = ({ item, index, currentIndex, muted, videoRefs, onTogglePlayPause }) => {
  const isCurrentReel = index === currentIndex
  const isVideo = item.mediaType === 'video'
  const [showOverlay, setShowOverlay] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Track video playing state
  useEffect(() => {
    const video = videoRefs.current[index]
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [index, videoRefs])

  const handleToggle = () => {
    if (onTogglePlayPause) {
      onTogglePlayPause()
    }
    setShowOverlay(true)
    setTimeout(() => setShowOverlay(false), 300)
  }

  return (
    <div className="media-wrapper">
      {isVideo ? (
        <>
          <video
            ref={el => videoRefs.current[index] = el}
            src={item.mediaUrl}
            className=""
            loop
            playsInline
            muted={muted}
            autoPlay={isCurrentReel}
          />
          {/* Play/Pause overlay for current video */}
          {isCurrentReel && onTogglePlayPause && (
            <button
              onClick={handleToggle}
              className="absolute inset-0 z-5 flex items-center justify-center group hover:cursor-pointer"
              aria-label="Toggle play/pause"
            >
              <div
                className={`transition-opacity duration-200 ${
                  showOverlay ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
            </button>
          )}
          
        </>
      ) : (
        <img 
          src={item.mediaUrl} 
          alt={item.title}
          className="object-contain"
        />
      )}
    </div>
  )
}

export default ReelMediaPlayer
