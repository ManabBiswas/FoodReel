import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Play, 
  Volume2,
  VolumeX,
  User,
  Star,
  ShoppingBag,
  Bookmark,
  UserPlus,
  Check,
  Send,
  X,
  ChevronDown,
  Verified,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'

const Reel = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [likes, setLikes] = useState({})
  const [follows, setFollows] = useState({})
  const [saves, setSaves] = useState({})
  const [showReviewModal, setShowReviewModal] = useState(null)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [reviews, setReviews] = useState({})
  const [showReviewsList, setShowReviewsList] = useState(null)
  const videoRefs = useRef([])
  const observerRef = useRef(null)

  const fetchAllPosts = async () => {
    try {
      setLoading(true)
      const foodResponse = await axios.get('http://localhost:3000/api/food', { withCredentials: true })
      
      // Handle both array and object responses
      const foodData = Array.isArray(foodResponse.data) ? foodResponse.data : (foodResponse.data.foods || [])
      
      console.log('Food data received:', foodData)
      
      const foodPosts = foodData.map(post => ({
        ...post,
        postType: post.postType || 'food',
        mediaUrl: post.video || post.image || post.file,
        mediaType: post.type || (post.video ? 'video' : 'image'),
        author: {
          name: post.foodPartner?.restaurantName || post.foodPartner?.companyName || post.partnerId?.companyName || 'Food Partner',
          username: post.foodPartner?.username || post.partnerId?.username || '@foodpartner',
          avatar: post.foodPartner?.avatar || post.partnerId?.avatar,
          verified: post.foodPartner?.verified || post.partnerId?.verified || false,
          id: post.foodPartner?._id || post.partnerId?._id
        },
        reviews: post.reviews || []
      }))
      
      // Try to fetch advertisements, but don't fail if endpoint doesn't exist
      let adPosts = []
      try {
        const adResponse = await axios.get('http://localhost:3000/api/advertisement', { withCredentials: true })
        const adData = Array.isArray(adResponse.data) ? adResponse.data : (adResponse.data.advertisements || [])
        
        adPosts = adData.map(post => ({
          ...post,
          postType: 'advertisement',
          mediaUrl: post.file || post.video || post.image,
          mediaType: post.type || 'video',
          author: {
            name: post.foodPartner?.restaurantName || post.foodPartner?.companyName || post.partnerId?.companyName || 'Food Partner',
            username: post.foodPartner?.username || post.partnerId?.username || '@foodpartner',
            avatar: post.foodPartner?.avatar || post.partnerId?.avatar,
            verified: post.foodPartner?.verified || post.partnerId?.verified || false,
            id: post.foodPartner?._id || post.partnerId?._id
          },
          reviews: []
        }))
      } catch (adError) {
        console.log('No advertisements found or endpoint not available:', adError.message)
      }
      
      const allPosts = [...foodPosts, ...adPosts].sort(() => Math.random() - 0.5)
      setPosts(allPosts)
      
      const initialLikes = {}
      const initialFollows = {}
      const initialSaves = {}
      const initialReviews = {}
      
      allPosts.forEach(post => {
        initialLikes[post._id] = { count: post.likeCount || 0, isLiked: false }
        initialFollows[post.author.id] = false
        initialSaves[post._id] = false
        initialReviews[post._id] = [] // Reviews will be loaded on demand
      })
      
      setLikes(initialLikes)
      setFollows(initialFollows)
      setSaves(initialSaves)
      setReviews(initialReviews)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllPosts()
  }, [])

  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.7 }
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target
        if (entry.isIntersecting) {
          video.play().catch(err => console.log('Autoplay prevented:', err))
        } else {
          video.pause()
        }
      })
    }, options)

    videoRefs.current.forEach(video => {
      if (video) observerRef.current.observe(video)
    })

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [posts])

  const toggleMute = () => setIsMuted(!isMuted)

  const handleLike = async (postId) => {
    try {
      setLikes(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiked: !prev[postId].isLiked,
          count: prev[postId].isLiked ? prev[postId].count - 1 : prev[postId].count + 1
        }
      }))
      await axios.post(`http://localhost:3000/api/food/${postId}/like`, {}, { withCredentials: true })
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleFollow = async (partnerId) => {
    try {
      setFollows(prev => ({ ...prev, [partnerId]: !prev[partnerId] }))
      await axios.post(`http://localhost:3000/api/foodpartner/${partnerId}/follow`, {}, { withCredentials: true })
    } catch (error) {
      console.error('Error following partner:', error)
    }
  }

  const handleSave = async (postId) => {
    try {
      setSaves(prev => ({ ...prev, [postId]: !prev[postId] }))
      await axios.post(`http://localhost:3000/api/food/${postId}/save`, {}, { withCredentials: true })
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const loadReviews = async (postId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/food/${postId}/reviews`, { withCredentials: true })
      setReviews(prev => ({ ...prev, [postId]: response.data.reviews || [] }))
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const handleAddReview = async (postId) => {
    if (!newReview.comment.trim() || newReview.rating < 1) return
    try {
      const response = await axios.post(`http://localhost:3000/api/food/${postId}/review`, {
        rating: newReview.rating,
        comment: newReview.comment
      }, { withCredentials: true })
      
      // Add the new review to the list
      setReviews(prev => ({ ...prev, [postId]: [response.data.review, ...(prev[postId] || [])] }))
      setNewReview({ rating: 5, comment: '' })
      setShowReviewModal(null)
    } catch (error) {
      console.error('Error adding review:', error)
      alert(error.response?.data?.error || 'Failed to add review')
    }
  }

  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.name || post.title,
          text: post.description,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading reels...</p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-white text-2xl font-semibold mb-2">No Reels Available</h3>
          <p className="text-gray-400 text-lg">Check back later for new content</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {posts.map((post, index) => (
          <div key={post._id} className="relative h-screen w-full snap-start snap-always">
            <div className="absolute inset-0">
              {post.mediaType === 'video' && post.mediaUrl ? (
                <video ref={el => videoRefs.current[index] = el} src={post.mediaUrl} className="w-full h-full object-cover" loop muted={isMuted} playsInline preload="metadata" />
              ) : post.mediaType === 'image' && post.mediaUrl ? (
                <img src={post.mediaUrl} alt={post.name || post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <ImageIcon className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 pt-4 px-4 flex items-center justify-between z-10">
              <div className="text-white text-sm font-semibold">For You</div>
              <button className="text-white"><MoreVertical className="w-6 h-6" /></button>
            </div>
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-800">
                  {post.author.avatar ? (
                    <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-gray-400" /></div>
                  )}
                </div>
                {!follows[post.author.id] && (
                  <button onClick={() => handleFollow(post.author.id)} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
                    <UserPlus className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => handleLike(post._id)} className="mb-1 transition-transform active:scale-125">
                  <Heart className={`w-8 h-8 ${likes[post._id]?.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <span className="text-white text-xs font-semibold">
                  {likes[post._id]?.count > 999 ? `${(likes[post._id]?.count / 1000).toFixed(1)}K` : likes[post._id]?.count}
                </span>
              </div>
              {/* Review Button */}
              <div className="flex flex-col items-center">
                <button onClick={() => setShowReviewModal(showReviewModal === post._id ? null : post._id)} className="mb-1">
                  <MessageCircle className="w-8 h-8 text-white" />
                </button>
                <span className="text-white text-xs font-semibold">{reviews[post._id]?.length || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => handleSave(post._id)} className="mb-1">
                  <Bookmark className={`w-8 h-8 ${saves[post._id] ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
                </button>
                <span className="text-white text-xs font-semibold">{post.savesCount || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => handleShare(post)} className="mb-1">
                  <Share2 className="w-8 h-8 text-white" />
                </button>
              </div>
              {post.mediaType === 'video' && (
                <button onClick={toggleMute} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 pb-20 px-4 z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white font-semibold">{post.author.username}</span>
                {post.author.verified && <Verified className="w-4 h-4 text-blue-400 fill-blue-400" />}
                {!follows[post.author.id] ? (
                  <button onClick={() => handleFollow(post.author.id)} className="ml-2 px-4 py-1 bg-white text-black text-sm font-semibold rounded-md">
                    Follow
                  </button>
                ) : (
                  <span className="ml-2 px-4 py-1 bg-gray-700 text-white text-sm font-semibold rounded-md flex items-center gap-1">
                    <Check className="w-4 h-4" />Following
                  </span>
                )}
              </div>
              <p className="text-white text-sm mb-2 line-clamp-2">{post.description || post.name}</p>
              {post.postType === 'food' && (
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  {post.price && (
                    <div className="flex items-center gap-1 text-white text-sm font-semibold bg-black/40 px-2 py-1 rounded">
                      <ShoppingBag className="w-4 h-4" />₹{post.price}
                    </div>
                  )}
                  {post.preparationTime && (
                    <div className="flex items-center gap-1 text-white text-sm bg-black/40 px-2 py-1 rounded">⏱️ {post.preparationTime} min</div>
                  )}
                                    {post.reviews && post.reviews.length > 0 && (
                    <button onClick={() => {
                      setShowReviewsList(showReviewsList === post._id ? null : post._id);
                      if (showReviewsList !== post._id) loadReviews(post._id);
                    }} className="flex items-center gap-1 text-white text-sm bg-black/40 px-2 py-1 rounded">
                      <Star className="w-4 h-4" />
                      <span>{post.reviews.length} Reviews</span>
                    </button>
                  )}
                </div>
              )}
              {post.postType === 'advertisement' && (
                <div className="inline-flex items-center gap-1 text-white text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-full mb-2">
                  <ShoppingBag className="w-3 h-3" />Sponsored
                </div>
              )}
              {index < posts.length - 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
                  <ChevronDown className="w-6 h-6 text-white/60" />
                </div>
              )}
            </div>
            {showReviewModal === post._id && (
              <div className="absolute inset-0 bg-black/80 z-50 flex flex-col justify-end">
                <div className="bg-gray-900 rounded-t-3xl max-h-[70vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-white font-semibold text-lg">Write Review</h3>
                    <button onClick={() => setShowReviewModal(null)} className="text-gray-400"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Star Rating Selector */}
                    <div className="flex flex-col items-center gap-2 py-4">
                      <p className="text-gray-400 text-sm mb-2">Rate this food</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-10 h-10 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-white text-lg font-semibold">
                        {newReview.rating === 0 ? 'Select Rating' : `${newReview.rating} Star${newReview.rating > 1 ? 's' : ''}`}
                      </p>
                    </div>

                    {/* Review Text Input */}
                    <div className="space-y-2">
                      <label className="text-gray-400 text-sm">Your Review</label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your experience with this food..."
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none"
                        rows="4"
                        maxLength="500"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{newReview.comment.length}/500</span>
                      </div>
                    </div>

                    {/* Existing Reviews */}
                    {reviews[post._id] && reviews[post._id].length > 0 && (
                      <div className="pt-4 border-t border-gray-700">
                        <h4 className="text-white font-semibold mb-3">Recent Reviews</h4>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {reviews[post._id].map((review) => (
                            <div key={review._id} className="flex gap-3 bg-gray-800 p-3 rounded-lg">
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-semibold text-sm">{review.user?.username || 'Anonymous'}</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-300 text-sm">{review.comment}</p>
                                <span className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-700 bg-gray-800">
                    <button
                      onClick={() => handleAddReview(post._id)}
                      disabled={newReview.rating === 0 || !newReview.comment.trim()}
                      className="w-full bg-white text-black py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showReviewsList === post._id && reviews[post._id] && reviews[post._id].length > 0 && (
              <div className="absolute inset-0 bg-black/80 z-50 flex flex-col justify-end">
                <div className="bg-gray-900 rounded-t-3xl max-h-[70vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-white font-semibold text-lg">Reviews ({reviews[post._id].length})</h3>
                    <button onClick={() => setShowReviewsList(null)} className="text-gray-400"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {reviews[post._id].map((review) => (
                      <div key={review._id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{review.user?.username || 'Anonymous'}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}

export default Reel
