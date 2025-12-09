import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import API_ENDPOINTS, { axiosConfig } from '../config/Api'
import { useAuth } from '../Contexts/AuthContext'
import ReelArea from '../Components/ReelArea'
import ReelReviewModal from '../Components/ReelReviewModal'
import QuickOrderModal from '../Components/QuickOrderModal'
import MenuBarBottom from '../Components/MenuBarBottom'

const Reel = () => {
  const [combinedContent, setCombinedContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [selectedFoodForOrder, setSelectedFoodForOrder] = useState(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [openShopFor, setOpenShopFor] = useState(null)
  
  // New states for follow and review
  const [followingStatus, setFollowingStatus] = useState({})
  const [savedPosts, setSavedPosts] = useState({})
  const [likedPosts, setLikedPosts] = useState({})
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [currentReviewItem, setCurrentReviewItem] = useState(null)
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
    ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [existingReviews, setExistingReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showReviewsList, setShowReviewsList] = useState(true)
  
  const containerRef = useRef(null)
  const videoRefs = useRef([])
  
  const { isAuthenticated } = useAuth()

    const handleShopToggle = (postId) => {
      setOpenShopFor(prev => (prev === postId ? null : postId))
  }
  // Fetch posts from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch food posts (partner posts)
        const postsResponse = await axios.get(API_ENDPOINTS.food.getAll, axiosConfig)
        console.log('Food Posts API Response:', postsResponse.data)
        
        // Fetch user posts
        const userPostsResponse = await axios.get(API_ENDPOINTS.userPost.getAll, axiosConfig)
        console.log('User Posts API Response:', userPostsResponse.data)
        
        // Fetch advertisements
        const adsResponse = await axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig)
        console.log('Ads API Response:', adsResponse.data)
        
        let mappedPosts = []
        let mappedUserPosts = []
        let mappedAds = []
        
        // Map partner food posts
        if (postsResponse.data.data) {
          mappedPosts = postsResponse.data.data.map(post => ({
            _id: post._id,
            type: 'post',
            postSource: 'partner',
            title: post.name || 'Untitled Post',
            description: post.description || '',
            mediaUrl: post.video || post.image || '',
            mediaType: post.type || 'image',
            partnerId: post.foodPartner || null,
            // For partner posts, prefer image over video for order display
            foodImageUrl: post.image || post.video || '',
            foodId: post._id, // The food item itself
            // Order button shows only if: price exists and item is available
            price: (post.price && post.isAvailable !== false) ? post.price : null,
            preparationTime: post.preparationTime || null,
            isAvailable: post.isAvailable !== false,
            likes: post.likeCount || 0,
            comments: post.commentCount || 0,
            views: post.views || 0,
            shares: post.shares || 0,
            savesCount: post.savesCount || 0,
            createdAt: post.createdAt || new Date().toISOString()
          }))
        }
        
        // Map user posts
        if (userPostsResponse.data.data) {
          mappedUserPosts = userPostsResponse.data.data.map(post => ({
            _id: post._id,
            type: 'post',
            postSource: 'user',
            title: post.title || 'Untitled Post',
            description: post.description || '',
            mediaUrl: post.video || post.image || '',
            mediaType: post.type || 'image',
            postedBy: post.postedBy || null,
            taggedPartner: post.taggedPartner || null,
            taggedFood: post.taggedFood || null,
            // For user posts, prefer image over video for order display
            foodImageUrl: post.taggedFood?.image || post.taggedFood?.video || '',
            foodId: post.taggedFood?._id || null, // The actual food item ID for ordering
            // Order button shows only if: taggedFood exists, has price, and is available
            price: (post.taggedFood?.price && post.taggedFood?.isAvailable !== false) ? post.taggedFood.price : null,
            preparationTime: post.taggedFood?.preparationTime || null,
            isAvailable: post.taggedFood?.isAvailable !== false,
            // Store original food data for ordering
            originalFoodName: post.taggedFood?.name || null,
            originalFoodDescription: post.taggedFood?.description || null,
            likes: post.likeCount || 0,
            comments: post.commentCount || 0,
            views: post.views || 0,
            shares: post.shares || 0,
            createdAt: post.createdAt || new Date().toISOString()
          }))
        }
        
        if (adsResponse.data.data) {
          mappedAds = adsResponse.data.data.map(ad => ({
            _id: ad._id,
            type: 'ad',
            title: ad.name || 'Special Offer',
            description: ad.description || '',
            mediaUrl: ad.file || ad.image || '',
            mediaType: ad.type || 'image',
            ctaText: ad.promoCode ? `Use Code: ${ad.promoCode}` : 'Learn More',
            ctaLink: ad.link || '#',
            businessName: ad.partnerId?.email || ad.businessName || 'Sponsored',
            partnerId: ad.partnerId || null,
            prices: ad.prices || null,
            promotionType: ad.promotionType || null,
            validUntil: ad.validUntil || null,
            promoCode: ad.promoCode || null,
            createdAt: ad.createdAt || new Date().toISOString()
          }))
        }
        
        // Merge partner posts and user posts, then combine with ads
        const allPosts = [...mappedPosts, ...mappedUserPosts].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        
        // Combine posts and ads (insert ad every 3-4 posts)
        const combined = insertAdsIntoPosts(allPosts, mappedAds)
        console.log('Combined content with ads:', combined)
        setCombinedContent(combined)
        
      } catch (error) {
        console.error('Error fetching data:', error)
        console.error('Failed to fetch data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const insertAdsIntoPosts = (posts, ads) => {
    console.log('insertAdsIntoPosts called with:', { postsCount: posts.length, adsCount: ads.length })
    
    if (ads.length === 0) {
      console.log('No ads to insert')
      return posts
    }
    
    const combined = []
    const adFrequency = 2 // Show ad after every 2 posts (changed from 3)
    let adIndex = 0
    
    posts.forEach((post, index) => {
      combined.push(post)
      
      // Insert ad after every adFrequency posts
      if ((index + 1) % adFrequency === 0 && adIndex < ads.length) {
        console.log(`Inserting ad ${adIndex} after post ${index + 1}`)
        combined.push(ads[adIndex])
        adIndex = (adIndex + 1) % ads.length // Cycle through ads
      }
    })
    
    // If we have ads left and very few posts, add at least one ad at the end
    if (combined.length === posts.length && ads.length > 0) {
      console.log('Adding ad at the end since none were inserted')
      combined.push(ads[0])
    }
    
    console.log('Final combined array:', combined.map(item => ({ id: item._id, type: item.type })))
    return combined
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const slides = container.querySelectorAll('[data-reel]')
    if (!slides || slides.length === 0) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Array.from(slides).indexOf(entry.target)
          setCurrentIndex(index)
        }
      })
    }, { root: container, threshold: 0.6 })

    slides.forEach(s => observer.observe(s))

    return () => observer.disconnect()
  }, [combinedContent])

  // Autoplay/pause videos based on currentIndex
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return
      video.muted = muted
      if (idx === currentIndex) {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play was prevented, user needs to interact first
          })
        }
        setPlaying(true)
      } else {
        if (typeof video.pause === 'function') {
          video.pause()
        }
      }
    })
  }, [currentIndex, combinedContent, muted])

  const handleLike = async (postId, postSource) => {
    try {
      const endpoint = postSource === 'user' 
        ? API_ENDPOINTS.userPost.like(postId)
        : API_ENDPOINTS.food.like(postId)
      
      const response = await axios.post(endpoint, {}, axiosConfig)
      console.log('Like response:', response.data)
      
      // Optimistically update UI with animation
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
      
      setCombinedContent(combinedContent.map(item => 
        item._id === postId && item.type === 'post'
          ? { 
              ...item, 
              likes: response.data.liked 
                ? (item.likes || 0) + 1 
                : Math.max(0, (item.likes || 0) - 1)
            }
          : item
      ))
    } catch (error) {
      console.error('Error liking post:', error)
      console.error(error.response?.data?.message || 'Failed to like post. Please login first.')
    }
  }

  const handleSave = async (postId) => {
    try {
      await axios.post(API_ENDPOINTS.food.save(postId), {}, axiosConfig)
      
      // Update saved status with animation
      setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
      
      // Show feedback
      const isSaved = !savedPosts[postId]
      const message = isSaved ? 'Post saved!' : 'Post unsaved'
      
      // Create console notification
      console.log(message)
    } catch (error) {
      console.error('Error saving post:', error)
      console.error(error.response?.data?.message || 'Failed to save post. Please login first.')
    }
  }

  const handleFollow = async (targetId, targetType) => {
    try {
      const isFollowing = followingStatus[targetId]
      
      if (isFollowing) {
        await axios.post(
          API_ENDPOINTS.follow.unfollow,
          { targetId, targetType },
          axiosConfig
        )
      } else {
        await axios.post(
          API_ENDPOINTS.follow.follow,
          { targetId, targetType },
          axiosConfig
        )
      }
      
      // Update following status with animation
      setFollowingStatus(prev => ({ ...prev, [targetId]: !prev[targetId] }))
      
      // Show feedback
      console.log(isFollowing ? 'Unfollowed' : 'Following!')
    } catch (error) {
      console.error('Error toggling follow:', error)
      console.error(error.response?.data?.message || 'Failed to update follow status. Please login first.')
    }
  }

  const openReviewModal = async (item) => {
    setCurrentReviewItem(item)
    setShowReviewModal(true)
    setShowReviewsList(true)
    setReviewData({
      rating: 0,
      comment: '',
      ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
    })
    
    // Fetch existing reviews
    await fetchReviews(item)
  }
  
  const fetchReviews = async (item) => {
    setLoadingReviews(true)
    try {
      let endpoint = null
      
      // Determine which endpoint to use based on post type
      if (item.postSource === 'partner' && item.partnerId?._id) {
        endpoint = API_ENDPOINTS.reviews.byPartner(item.partnerId._id)
      } else if (item.foodId) {
        endpoint = API_ENDPOINTS.reviews.byFood(item.foodId)
      }
      
      if (endpoint) {
        const response = await axios.get(endpoint, axiosConfig)
        setExistingReviews(response.data.data || response.data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // Don't show error toast, just set empty array
      setExistingReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setCurrentReviewItem(null)
    setExistingReviews([])
    setShowReviewsList(true)
    setReviewData({
      rating: 0,
      comment: '',
      ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
    })
  }

  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      console.warn('Please select a rating')
      return
    }
    
    if (!reviewData.comment.trim()) {
      console.warn('Please write a comment')
      return
    }

    setSubmittingReview(true)
    
    try {
      const reviewPayload = {
        foodPartnerId: currentReviewItem.postSource === 'partner' 
          ? currentReviewItem.partnerId._id 
          : currentReviewItem.taggedPartner?._id,
        foodItemId: currentReviewItem.foodId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        ratings: reviewData.ratings
      }

      await axios.post(
        API_ENDPOINTS.reviews.create,
        reviewPayload,
        axiosConfig
      )

      console.log('Review submitted successfully!')
      
      // Refresh reviews list
      await fetchReviews(currentReviewItem)
      
      // Switch to reviews list view
      setShowReviewsList(true)
      
      // Reset form
      setReviewData({
        rating: 0,
        comment: '',
        ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
      })
    } catch (error) {
      console.error('Error submitting review:', error)
      console.error(error.response?.data?.message || 'Failed to submit review. Please login first.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Check following status on load
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (combinedContent.length === 0) return
      
      try {
        const statusChecks = {}
        
        for (const item of combinedContent) {
          if (item.type === 'post') {
            let targetId = null
            let targetType = null
            
            if (item.postSource === 'partner' && item.partnerId?._id) {
              targetId = item.partnerId._id
              targetType = 'FoodPartner'
            } else if (item.postSource === 'user' && item.postedBy?._id) {
              targetId = item.postedBy._id
              targetType = 'User'
            }
            
            if (targetId && targetType) {
              try {
                const response = await axios.get(
                  API_ENDPOINTS.follow.check(targetId, targetType),
                  axiosConfig
                )
                statusChecks[targetId] = response.data.isFollowing
              } catch {
                // User not logged in or error
                statusChecks[targetId] = false
              }
            }
          }
        }
        
        setFollowingStatus(statusChecks)
      } catch (error) {
        console.error('Error checking following status:', error)
      }
    }
    
    checkFollowingStatus()
  }, [combinedContent])

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err))
    } else {
      console.info('Share functionality not supported on this device')
    }
  }

  const handleAdClick = (ad) => {
    if (ad.ctaLink && ad.ctaLink !== '#') {
      window.open(ad.ctaLink, '_blank')
    }
  }

  const handleOrderClick = (food) => {
    // For user posts, transform to show original food item data
    const orderData = food.postSource === 'user' && food.taggedFood ? {
      ...food,
      _id: food.foodId, // Use actual food item ID
      title: food.originalFoodName || food.taggedFood.name || food.title,
      description: food.originalFoodDescription || food.taggedFood.description || food.description,
      foodImageUrl: food.foodImageUrl // Already set to tagged food's image
    } : food
    
    setSelectedFoodForOrder(orderData)
    setIsOrderModalOpen(true)
  }

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false)
    setSelectedFoodForOrder(null)
  }

  const toggleMute = () => {
    setMuted(!muted)
    videoRefs.current.forEach(video => {
      if (video) video.muted = !muted
    })
  }

  const togglePlayPause = () => {
    const video = videoRefs.current[currentIndex]
    if (video) {
      if (playing) {
        video.pause()
      } else {
        video.play()
      }
      setPlaying(!playing)
    }
  }

  const formatCount = (count) => {
    if (!count) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Reels...</p>
        </div>
      </div>
    )
  }

  if (combinedContent.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center px-4">
          <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Reels Yet</h3>
          <p className="text-gray-400">Be the first to share your food experience!</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }

          .reel-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100vh;
            background: #000;
            overflow: hidden;
          }

          .reel-content {
            position: relative;
            width: min(100%, calc(100vh * 9 / 16));
            max-width: 900px;
            aspect-ratio: 9 / 16;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .media-wrapper {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
          }

          .media-wrapper img,
          .media-wrapper video {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain; 
            display: block;
          }

          @keyframes scaleIn {
            from {
              transform: scale(0.8);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
              }
          }

          .animate-scale-in {
            animation: scaleIn 0.3s ease-out;
          }

          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }

          @media (min-width: 768px) {
            .reel-content {
              max-width: min(calc(100vh * 9 / 16), 700px);
              box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
            }
          }
        `}</style>

        {combinedContent.map((item, index) => (
          <ReelArea
            key={`${item.type}-${item.postSource || 'ad'}-${item._id}-${index}`}
            item={item}
            index={index}
            currentIndex={currentIndex}
            muted={muted}
            videoRefs={videoRefs}
            likedPosts={likedPosts}
            savedPosts={savedPosts}
            followingStatus={followingStatus}
            openShopFor={openShopFor}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onReview={openReviewModal}
            onFollow={handleFollow}
            onShopToggle={handleShopToggle}
            onToggleMute={toggleMute}
            onOrderClick={handleOrderClick}
            formatCount={formatCount}
          />
        ))}
      </div>

      {/* Order Modal */}
      <QuickOrderModal 
        food={selectedFoodForOrder}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />

      {/* Review Modal */}
      <ReelReviewModal
        show={showReviewModal}
        item={currentReviewItem}
        reviewData={reviewData}
        submittingReview={submittingReview}
        showReviewsList={showReviewsList}
        existingReviews={existingReviews}
        loadingReviews={loadingReviews}
        onClose={closeReviewModal}
        onSubmit={handleSubmitReview}
        onRatingChange={(category, value) => 
          setReviewData(prev => ({
            ...prev,
            ratings: { ...prev.ratings, [category]: value }
          }))
        }
        onCommentChange={(e) => 
          setReviewData(prev => ({ ...prev, comment: e.target.value }))
        }
        onTabChange={setShowReviewsList}
      />

      {/* Bottom Menu Bar */}
      <MenuBarBottom />
    </>
  )
}

export default Reel
