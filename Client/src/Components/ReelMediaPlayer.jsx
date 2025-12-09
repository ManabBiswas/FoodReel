import React from 'react'

const ReelMediaPlayer = ({ item, index, currentIndex, muted, videoRefs }) => {
  return (
    <div className="media-wrapper">
      {item.mediaType === 'video' ? (
        <video
          ref={el => videoRefs.current[index] = el}
          src={item.mediaUrl}
          className=""
          loop
          playsInline
          muted={muted}
          autoPlay={index === currentIndex}
        />
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
