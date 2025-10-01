import React, { useState } from 'react'
import { 
  X, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  User,
  CheckCircle
} from 'lucide-react'

const FoodDetailModal = ({ food, isOpen, onClose, partnerData }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [comment, setComment] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  if (!isOpen || !food) return null

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  const handleVideoControl = (videoElement) => {
    if (isPlaying) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = (videoElement) => {
    videoElement.muted = !videoElement.muted
    setIsMuted(videoElement.muted)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex overflow-hidden">
        {/* Media Section */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {food.type === 'video' && food.video ? (
            <div className="relative w-full h-full">
              <video
                ref={(el) => {
                  if (el) {
                    el.addEventListener('play', () => setIsPlaying(true))
                    el.addEventListener('pause', () => setIsPlaying(false))
                  }
                }}
                src={food.video}
                className="w-full h-full object-contain"
                muted={isMuted}
                loop
                onClick={(e) => handleVideoControl(e.target)}
              />
              
              {/* Video Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMute(e.target.closest('div').previousElementSibling)
                  }}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Play/Pause Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={(e) => handleVideoControl(e.target.closest('div').previousElementSibling)}
                    className="bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                </div>
              )}
            </div>
          ) : food.type === 'image' && food.image ? (
            <img
              src={food.image}
              alt={food.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-white text-center">
              <p>Media not available</p>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{partnerData?.companyName}</span>
                {partnerData?.verified && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description and Details */}
          <div className="flex-1 overflow-y-auto">
            {/* Food Details */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">{partnerData?.companyName}</span>
                <span className="text-sm text-gray-900">{food.name}</span>
              </div>
              {food.description && (
                <p className="text-sm text-gray-700 mb-3">{food.description}</p>
              )}
              
              {/* Tags */}
              {food.tags && food.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {food.tags.map((tag, index) => (
                    <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Type and Duration */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="capitalize">{food.type} post</span>
                {food.duration && <span>{food.duration}</span>}
                <span>{food.createdAt ? new Date(food.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="border-t p-4 space-y-3">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike}
                  className={`transition-colors ${isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button className="text-gray-700 hover:text-gray-900 transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-gray-700 hover:text-gray-900 transition-colors">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button 
                onClick={handleSave}
                className={`transition-colors ${isSaved ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Likes Count */}
            <div className="text-sm font-semibold">
              {(food.likeCount || 0) + (isLiked ? 1 : 0)} likes
            </div>

            {/* Comment Input */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 text-sm outline-none"
              />
              {comment && (
                <button 
                  onClick={() => setComment('')}
                  className="text-blue-500 text-sm font-semibold hover:text-blue-700"
                >
                  Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoodDetailModal