import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { showSuccess, showError, showWarning } from '../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { useCart } from '../hooks/useCart'
import { copyText } from '../utils/clipboard'
import { Bookmark,Calendar,CheckCircle,Clock,Heart,IndianRupee,Megaphone,Play,ShoppingCart,Sparkles,Star,Tag,User, Volume2,VolumeX,X } from 'lucide-react'

const PROMOTION_LABELS = {
  discount: 'Discount offer',
  bogo: 'Buy one get one',
  combo: 'Combo deal',
  seasonal: 'Seasonal special',
  announcement: 'Announcement'
}

const reviewerName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'User'

const formatPrice = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return value
  return number.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const FoodDetailModal = ({ food, onClose, partnerData: partnerDataProp }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const videoRef = useRef(null)
  const closeButtonRef = useRef(null)

  const isAdvertisement = food?.postType === 'advertisement' || food?._type === 'advertisement'
  const isUnavailable = !isAdvertisement && food?.isAvailable === false
  const foodId = food?.id || food?._id || null

  const getFoodId = useCallback(() => foodId, [foodId])

  const fetchReviews = useCallback(async (idParam) => {
    try {
      const id = idParam || getFoodId()
      if (!id) return
      const response = await axios.get(API_ENDPOINTS.food.reviews(id), axiosConfig)

      // Backend returns { reviews, totalCount, averageRating } — older shape was { data: [...] }
      const payload = response.data
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.reviews)
          ? payload.reviews
          : []
      setReviews(list)
    } catch (err) {
      console.error('Error fetching reviews:', err)
    }
  }, [getFoodId])

  const checkUserAuth = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
      if (response.data?.user) setUser(response.data.user)
    } catch {
      // User not authenticated
    }
  }, [])

  // Reset per-item state when a different card opens in the same modal.
  useEffect(() => {
    setIsLiked(Boolean(food?.isLiked))
    setIsSaved(Boolean(food?.isSaved))
    setIsPlaying(false)
    setComment('')
    setRating(0)
    setReviews([])
  }, [foodId, food?.isLiked, food?.isSaved])

  useEffect(() => {
    if (!foodId || isAdvertisement) return
    fetchReviews(foodId)
    checkUserAuth()
  }, [foodId, isAdvertisement, fetchReviews, checkUserAuth])

  // Escape closes, backdrop clicks close, and the page behind stays put.
  useEffect(() => {
    if (!food) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus({ preventScroll: true })

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [food, onClose])

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    const id = getFoodId()
    if (!id) return

    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    showSuccess(wasLiked ? 'Removed from favorites' : 'Added to favorites')

    try {
      await axios.post(API_ENDPOINTS.food.like(id), {}, axiosConfig)
    } catch (error) {
      console.error('Error liking food:', error)
      setIsLiked(wasLiked)
      showError('Failed to update favorites')
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!comment.trim()) {
      showWarning('Please write a review before submitting')
      return
    }

    if (rating < 1 || rating > 5) {
      showWarning('Please select a star rating')
      return
    }

    const id = getFoodId()
    if (!id) {
      showError('Could not resolve food item')
      return
    }

    try {
      setLoading(true)
      const { data } = await axios.post(
        API_ENDPOINTS.food.review(id),
        { rating, comment },
        axiosConfig
      )
      setComment('')
      setRating(0)
      if (data?.review) {
        setReviews((prev) => [
          data.review,
          ...prev.filter((review) => String(review._id) !== String(data.review._id))
        ])
      }
      showSuccess(data?.updated ? 'Review updated successfully!' : 'Review submitted successfully!')
    } catch (err) {
      console.error('Error submitting review:', err)
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    const id = getFoodId()
    if (!id) return
    if (isUnavailable) {
      showWarning('This item is currently unavailable')
      return
    }
    const result = await addToCart(id, 1)
    if (result?.success) {
      onClose?.()
      navigate('/cart')
    } else {
      showError(result?.error || 'Failed to add item to cart')
    }
  }

  const handleSave = async () => {
    if (!user) return navigate('/login')

    const id = getFoodId()
    if (!id) return

    const wasSaved = isSaved

    try {
      setIsSaved(!wasSaved)
      const { data } = await axios.post(API_ENDPOINTS.food.save(id), {}, axiosConfig)
      if (typeof data?.isSaved === 'boolean') {
        setIsSaved(data.isSaved)
        showSuccess(
          data.isSaved ? 'Food saved to your collection' : 'Food removed from your collection'
        )
      } else {
        showSuccess(!wasSaved ? 'Food saved to your collection' : 'Food removed from your collection')
      }
    } catch (err) {
      console.error('Error saving food:', err)
      setIsSaved(wasSaved)
      showError('Failed to save food')
    }
  }

  const handleCopyPromo = async (code) => {
    const copied = await copyText(code)
    if (copied) showSuccess('Promo code copied')
    else showWarning('Could not copy the code')
  }

  const handleVideoControl = (videoEl) => {
    if (!videoEl) return
    if (videoEl.paused) {
      const playPromise = videoEl.play()
      if (playPromise && typeof playPromise.then === 'function') playPromise.catch(() => {})
      setIsPlaying(true)
    } else {
      videoEl.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev
      if (videoRef.current) videoRef.current.muted = next
      return next
    })
  }

  // Don't render if modal is closed
  if (!food) return null

  const partnerData = food.partnerData || food.partnerId || food.foodPartner || partnerDataProp || {}
  const mediaUrl =
    food.type === 'video' ? food.video || food.file : food.image || food.file
  const hasOriginalPrice = food.prices?.original !== undefined && food.prices?.original !== null
  const hasDiscountedPrice =
    food.prices?.discounted !== undefined && food.prices?.discounted !== null
  const canOrder = !isUnavailable && Number(food.price) > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={food.name || 'Post details'}
        onClick={(event) => event.stopPropagation()}
        className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl md:h-[min(88vh,720px)] md:flex-row"
      >
        {/* Media Section */}
        <div className="relative h-[42vh] shrink-0 bg-black md:h-full md:min-h-0 md:flex-1">
          {food.type === 'video' && mediaUrl ? (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                src={mediaUrl}
                className="h-full w-full object-contain"
                muted={isMuted}
                loop
                playsInline
                onClick={() => handleVideoControl(videoRef.current)}
              />

              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleMute()
                  }}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {!isPlaying && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex rounded-full bg-black/50 p-4 text-white">
                    <Play className="ml-1 h-8 w-8" />
                  </span>
                </div>
              )}
            </div>
          ) : mediaUrl ? (
            <img src={mediaUrl} alt={food.name || 'Post media'} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/70">
              Media not available
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex min-h-0 flex-1 flex-col md:w-96 md:flex-none">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
                <div className="h-full w-full rounded-full bg-white p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {partnerData?.companyName || 'Partner'}
                </span>
                {partnerData?.verified && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" aria-label="Verified partner" />
                )}
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => onClose?.()}
              aria-label="Close details"
              className="shrink-0 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {isAdvertisement ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                    <Megaphone className="h-3.5 w-3.5" />
                    Sponsored
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    Food item
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-gray-900">{food.name}</h2>
              {food.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{food.description}</p>
              )}

              {isAdvertisement ? (
                <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {food.promotionType && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                        <Tag className="h-3.5 w-3.5" />
                        {PROMOTION_LABELS[food.promotionType] || food.promotionType}
                      </span>
                    )}
                    {food.promoCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyPromo(food.promoCode)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-400 bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900 transition-colors hover:bg-amber-100"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {food.promoCode}
                      </button>
                    )}
                  </div>

                  {(hasOriginalPrice || hasDiscountedPrice) && (
                    <div className="flex items-baseline gap-2">
                      {hasDiscountedPrice && (
                        <span className="text-2xl font-bold text-green-700">
                          ₹{formatPrice(food.prices.discounted)}
                        </span>
                      )}
                      {hasOriginalPrice && (
                        <span
                          className={`text-sm ${
                            hasDiscountedPrice
                              ? 'text-gray-400 line-through'
                              : 'font-semibold text-gray-900'
                          }`}
                        >
                          ₹{formatPrice(food.prices.original)}
                        </span>
                      )}
                    </div>
                  )}

                  {food.validUntil && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-900">
                      <Calendar className="h-3.5 w-3.5" />
                      Valid until {new Date(food.validUntil).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {Number(food.price) > 0 && (
                    <span className="inline-flex items-baseline gap-1 text-2xl font-bold text-gray-900">
                      <IndianRupee className="h-5 w-5 self-center" />
                      {formatPrice(food.price)}
                    </span>
                  )}
                  {food.preparationTime !== undefined && food.preparationTime !== null && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {food.preparationTime} min prep
                    </span>
                  )}
                  {isUnavailable && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                      Currently unavailable
                    </span>
                  )}
                </div>
              )}

              {food.tags && food.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
                  {food.tags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="text-sm text-blue-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="capitalize">{food.type} post</span>
                {food.duration && <span>{food.duration}</span>}
                <span>
                  {food.createdAt
                    ? new Date(food.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Reviews are only valid for food items — advertisements live in a
                separate collection and have no review endpoint. */}
            {!isAdvertisement && (
              <div className="space-y-3 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Reviews
                </h3>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review._id || review.id || `${review.user?.id || ''}-${review.createdAt}`}
                      className="flex items-start gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                        {reviewerName(review.user).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {reviewerName(review.user)}
                        </div>
                        <div className="text-sm text-gray-700">
                          {review.comment || review.text || ''}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No reviews yet. Be the first to review this dish!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Interaction Bar — food only. Ads have no cart, like or review API. */}
          {!isAdvertisement && (
            <div className="shrink-0 space-y-3 border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLike}
                    aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                    aria-pressed={isLiked}
                    className={`transition-colors ${
                      isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    aria-label={isSaved ? 'Remove from saved' : 'Save this dish'}
                    aria-pressed={isSaved}
                    className={`transition-colors ${
                      isSaved ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOrder}
                  disabled={!canOrder}
                  className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isUnavailable ? 'Unavailable' : 'Order now'}
                </button>
              </div>

              <div className="text-sm font-semibold text-gray-700">
                {(food.likeCount || 0) + (isLiked ? 1 : 0)} likes
              </div>

              <div className="space-y-2 border-t pt-2">
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      onClick={() => setRating(rating === star ? 0 : star)}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      className="cursor-pointer p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating ? 'fill-current text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && <span className="ml-1 text-xs text-gray-500">{rating}/5</span>}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a review..."
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  {comment && (
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={loading || rating < 1}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? 'Posting...' : 'Post'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodDetailModal
