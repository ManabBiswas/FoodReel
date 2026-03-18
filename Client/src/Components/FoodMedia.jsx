import React, { useState } from 'react'
import { Play } from 'lucide-react'
import { getFoodMedia } from '../utils/imagekit.utils'

/**
 * FoodMedia
 *
 * Renders a food item's image or a video thumbnail with a play badge.
 * Handles ImageKit's /ik-thumbnail.jpg transformation automatically.
 *
 * Props:
 *   foodItem   — the food/foodItem object (has .image and/or .video fields)
 *   className  — extra CSS classes for the wrapper div
 *   imgClass   — extra CSS classes for the <img> element
 *   thumbSecond — which second of the video to capture (default 0)
 *   showPlay   — whether to show the play badge overlay (default true)
 *   alt        — img alt text
 *   placeholderClass — class for the fallback coloured square
 */
const FoodMedia = ({
  foodItem,
  className      = '',
  imgClass       = 'h-full w-full object-cover',
  thumbSecond    = 0,
  showPlay       = true,
  alt,
  placeholderClass = '',
  style          = {},
}) => {
  const [imgError, setImgError] = useState(false)
  const { src, isVideo } = getFoodMedia(foodItem, thumbSecond)

  const displaySrc = !imgError ? src : null
  const altText    = alt || foodItem?.name || 'Food'

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {displaySrc ? (
        <>
          <img
            src={displaySrc}
            alt={altText}
            className={imgClass}
            onError={() => setImgError(true)}
          />

          {/* Play badge — only for videos */}
          {isVideo && showPlay && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
              >
                <Play
                  className="h-5 w-5 fill-white text-white"
                  style={{ marginLeft: 2 }}
                />
              </div>
            </div>
          )}

          {/* Video label badge — small pill in corner */}
          {isVideo && (
            <div
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 font-sans"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            >
              <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-[9px] font-bold text-white uppercase tracking-wide">Video</span>
            </div>
          )}
        </>
      ) : (
        /* Coloured gradient fallback */
        <div
          className={`h-full w-full flex items-center justify-center ${placeholderClass}`}
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            ...(!placeholderClass && {}),
          }}
        >
          <span className="text-3xl select-none" aria-hidden>🍽️</span>
        </div>
      )}
    </div>
  )
}

export default FoodMedia
