import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import API_ENDPOINTS, { axiosConfig } from '../config/Api'
import { X, Heart, ShoppingCart, Star, User, Clock, DollarSign, MessageCircle, Send, Loader2, Play, VolumeX, Volume2, CheckCircle, MoreHorizontal, Bookmark } from 'lucide-react'

const FoodDetailModal = ({ food, onClose }) => {
  const [reviews, setReviews] = useState([])
  // review input stored in `comment` state
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [comment, setComment] = useState('')
  const navigate = useNavigate()
  const videoRef = React.useRef(null)

  const getFoodId = React.useCallback(() => food?.id || food?._id || null, [food])

  const fetchReviews = React.useCallback(async (idParam) => {
    try {
      const id = idParam || getFoodId()
      if (!id) return
      const response = await axios.get(
        API_ENDPOINTS.food.reviews(id),
        axiosConfig
      )
      
      if (response.data && Array.isArray(response.data.data)) {
        setReviews(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    }
  }, [getFoodId])

  const checkUserAuth = React.useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
      if (response.data && response.data.user) {
        setUser(response.data.user)
      }
    } catch {
      // User not authenticated
    }
  }, [])

  useEffect(() => {
    const id = getFoodId()
    if (id) {
      fetchReviews(id)
      checkUserAuth()
    }
  }, [getFoodId, fetchReviews, checkUserAuth])

  const handleLike = async () => {
    if (!user) {
      navigate('/user-login')
      return
    }

    try {
      const id = getFoodId()
      if (!id) return
      await axios.post(
        API_ENDPOINTS.food.like(id),
        {},
        axiosConfig
      )
      setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error liking food:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/user-login')
      return
    }

    if (!comment.trim()) return

    try {
      setLoading(true)
      const id = getFoodId()
      if (!id) return
      await axios.post(
        API_ENDPOINTS.food.review(id),
        { rating: 5, comment },
        axiosConfig
      )
      setComment('')
      await fetchReviews(id)
    } catch (err) {
      console.error('Error submitting review:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = () => {
    if (!user) {
      navigate('/user-login')
      return
    }
    onClose()
    const id = getFoodId()
    navigate(`/order/${id}`)
  }

  // Don't render if modal is closed
  if (!food) return null

  const partnerData = food.partnerData || food.partnerId || food.foodPartner || {}

  const handleVideoControl = (videoEl) => {
    if (!videoEl) return
    if (videoEl.paused) {
      const p = videoEl.play()
      if (p && typeof p.then === 'function') p.catch(() => {})
      setIsPlaying(true)
    } else {
      if (typeof videoEl.pause === 'function') videoEl.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev
      if (videoRef.current) videoRef.current.muted = next
      return next
    })
  }

  const handleSave = async () => {
    if (!user) return navigate('/user-login')
    try {
      const id = getFoodId()
      if (!id) return
      await axios.post(API_ENDPOINTS.food.save(id), {}, axiosConfig)
      setIsSaved(true)
    } catch (err) {
      console.error('Error saving food:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex overflow-hidden">
        {/* Media Section */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {food.type === 'video' && food.video ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={food.video}
                className="w-full h-full object-contain"
                muted={isMuted}
                loop
                onClick={() => handleVideoControl(videoRef.current)}
              />
              
              {/* Video Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMute()
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
                    onClick={() => handleVideoControl(videoRef.current)}
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
              {reviews && reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r._id || r.id || `${r.user?.id || ''}-${r.createdAt}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {r.user?.name?.charAt(0) || (r.user?.email?.charAt(0)) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{r.user?.name || r.user?.email || 'User'}</div>
                      <div className="text-sm text-gray-700">{r.comment || r.text || ''}</div>
                      <div className="text-xs text-gray-400 mt-1">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  No comments yet. Be the first to comment!
                </div>
              )}
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

            {/* Likes Count and Order CTA */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">
                {(food.likeCount || 0) + (isLiked ? 1 : 0)} likes
              </div>
              <div>
                <button
                  onClick={handleOrder}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Order Now
                </button>
              </div>
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
                  onClick={handleSubmitReview}
                  disabled={loading}
                  className="text-blue-500 text-sm font-semibold hover:text-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Posting...' : 'Post'}
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