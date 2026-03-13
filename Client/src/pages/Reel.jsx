import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast'
import { ChefHat } from 'lucide-react'
import ReelPageHeader from '../Components/ReelPageheader'
import ReelArea from '../Components/ReelArea'
import ReelReviewModal from '../Components/ReelReviewModal'
import CommentModal from '../Components/CommentModal'
import QuickOrderModal from '../Components/QuickOrderModal'
import MenuBarBottom from '../Components/MenuBarBottom'
import "./../App.css"

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
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [currentCommentItem, setCurrentCommentItem] = useState(null)
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
    ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [existingReviews, setExistingReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showReviewsList, setShowReviewsList] = useState(true)
  
  // Store current user ID
  const [currentUserId, setCurrentUserId] = useState(null)
  
  const containerRef = useRef(null)
  const videoRefs = useRef([])
  const hasInitializedInteractions = useRef(false)

  const handleShopToggle = useCallback((postId) => {
    setOpenShopFor(prev => (prev === postId ? null : postId))
  }, [])

  // Fetch posts from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch food posts (partner posts)
        const postsResponse = await axios.get(API_ENDPOINTS.food.getAll, axiosConfig)
        
        // Fetch user posts
        const userPostsResponse = await axios.get(API_ENDPOINTS.userPost.getAll, axiosConfig)
        
        // Fetch advertisements (public endpoint - no auth required)
        const adsResponse = await axios.get(API_ENDPOINTS.advertisement.getPublic)
        
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
            foodImageUrl: post.image || post.video || '',
            foodId: post._id,
            price: (post.price && post.isAvailable !== false) ? post.price : null,
            preparationTime: post.preparationTime || null,
            isAvailable: post.isAvailable !== false,
            likes: post.likes || [],
            likeCount: post.likeCount || 0,
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
            foodImageUrl: post.taggedFood?.image || post.taggedFood?.video || '',
            foodId: post.taggedFood?._id || null,
            price: (post.taggedFood?.price && post.taggedFood?.isAvailable !== false) ? post.taggedFood.price : null,
            preparationTime: post.taggedFood?.preparationTime || null,
            isAvailable: post.taggedFood?.isAvailable !== false,
            originalFoodName: post.taggedFood?.name || null,
            originalFoodDescription: post.taggedFood?.description || null,
            likes: post.likes || [],
            likeCount: post.likeCount || 0,
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
        
        // Combine posts and ads
        const combined = insertAdsIntoPosts(allPosts, mappedAds)
        setCombinedContent(combined)
        
      } catch (error) {
        console.error('Error fetching data:', error)
        showError('Failed to load reels. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const insertAdsIntoPosts = (posts, ads) => {
    if (ads.length === 0) return posts
    
    const combined = []
    const adFrequency = 2
    let adIndex = 0
    
    posts.forEach((post, index) => {
      combined.push(post)
      
      if ((index + 1) % adFrequency === 0 && adIndex < ads.length) {
        combined.push(ads[adIndex])
        adIndex = (adIndex + 1) % ads.length
      }
    })
    
    if (combined.length === posts.length && ads.length > 0) {
      combined.push(ads[0])
    }
    
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

  // Autoplay/pause videos
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return
      video.muted = muted
      if (idx === currentIndex) {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {})
        }
        setPlaying(true)
      } else {
        if (typeof video.pause === 'function') {
          video.pause()
        }
      }
    })
  }, [currentIndex, combinedContent, muted])

  const handleLike = useCallback(async (postId, postSource) => {
    try {
      const endpoint = postSource === 'user' 
        ? API_ENDPOINTS.userPost.like(postId)
        : API_ENDPOINTS.food.like(postId)
      
      // Store previous state for rollback
      const wasLiked = likedPosts[postId] || false
      
      // Optimistically update UI immediately
      setLikedPosts(prev => ({ ...prev, [postId]: !wasLiked }))
      
      const response = await axios.post(endpoint, {}, axiosConfig)
      
      // Update combinedContent with new likeCount AND likes array
      setCombinedContent(prev => prev.map(item => {
        if (item._id === postId && item.type === 'post') {
          const newLikeCount = response.data.likeCount || response.data.likes || item.likeCount
          
          // Update the likes array to reflect current state
          let updatedLikes = [...(item.likes || [])]
          
          if (response.data.isLiked) {
            // Add current user to likes array if not already present
            if (currentUserId && !updatedLikes.includes(currentUserId)) {
              updatedLikes.push(currentUserId)
            }
          } else {
            // Remove current user from likes array
            if (currentUserId) {
              updatedLikes = updatedLikes.filter(id => {
                const idStr = typeof id === 'string' ? id : id._id?.toString() || id.toString()
                return idStr !== currentUserId
              })
            }
          }
          
          return {
            ...item,
            likeCount: newLikeCount,
            likes: updatedLikes
          }
        }
        return item
      }))
      
      // Confirm the liked state from server
      setLikedPosts(prev => ({ ...prev, [postId]: response.data.isLiked }))
      
    } catch (error) {
      console.error('Error liking post:', error)
      
      // Revert optimistic update on error
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
      
      if (error.response?.status === 401) {
        showError('Please login to like posts')
      } else {
        showError(error.response?.data?.message || 'Failed to like post')
      }
    }
  }, [likedPosts, currentUserId])

  const handleSave = useCallback(async (postId) => {
    try {
      const currentItem = combinedContent.find(item => item._id === postId);
      if (!currentItem) return;
      
      const wasSaved = savedPosts[postId];
      
      // Optimistically update UI
      setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
      
      // Call the appropriate endpoint based on post source
      const endpoint = currentItem.postSource === 'user' 
        ? API_ENDPOINTS.userPost.save(postId)
        : API_ENDPOINTS.food.save(postId);
      
      await axios.post(endpoint, {}, axiosConfig);
      
      if (!wasSaved) {
        showSuccess('Post saved!');
      } else {
        showInfo('Post removed from saved');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      // Revert optimistic update on error
      setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
      
      if (error.response?.status === 401) {
        showError('Please login to save posts');
      } else {
        showError(error.response?.data?.message || 'Failed to save post');
      }
    }
  }, [savedPosts, combinedContent])

  const handleFollow = useCallback(async (targetId, targetType) => {
    try {
      const targetIdStr = typeof targetId === 'object' ? targetId._id || targetId.toString() : targetId.toString()
      
      const isFollowing = followingStatus[targetIdStr]
      
      setFollowingStatus(prev => ({ ...prev, [targetIdStr]: !prev[targetIdStr] }))
      
      if (isFollowing) {
        await axios.post(
          API_ENDPOINTS.follow.unfollow,
          { targetId: targetIdStr, targetType },
          axiosConfig
        )
        showSuccess('Unfollowed successfully')
      } else {
        await axios.post(
          API_ENDPOINTS.follow.follow,
          { targetId: targetIdStr, targetType },
          axiosConfig
        )
        showSuccess('Following!')
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      
      const targetIdStr = typeof targetId === 'object' ? targetId._id || targetId.toString() : targetId.toString()
      setFollowingStatus(prev => ({ ...prev, [targetIdStr]: !prev[targetIdStr] }))
      
      if (error.response?.status === 401) {
        showError('Please login to follow')
      } else {
        showError(error.response?.data?.message || 'Failed to update follow status')
      }
    }
  }, [followingStatus])

  const openReviewModal = useCallback(async (item) => {
    setCurrentReviewItem(item)
    setShowReviewModal(true)
    setShowReviewsList(true)
    setUserHasReviewed(false)
    setReviewData({
      rating: 0,
      comment: '',
      ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
    })
    
    await fetchReviews(item)
  }, [])
  
  const fetchReviews = async (item) => {
    setLoadingReviews(true)
    try {
      let endpoint = null
      
      if (item.postSource === 'partner' && item.partnerId?._id) {
        endpoint = API_ENDPOINTS.reviews.byPartner(item.partnerId._id)
      } else if (item.foodId) {
        endpoint = API_ENDPOINTS.reviews.byFood(item.foodId)
      }
      
      if (endpoint) {
        const response = await axios.get(endpoint, axiosConfig)
        const reviews = response.data.data || response.data.reviews || []
        setExistingReviews(reviews)
        
        // try {
        //   const userProfileResponse = await axios.get(API_ENDPOINTS.auth.userProfile, axiosConfig)
        //   const userId = (userProfileResponse.data.user || userProfileResponse.data)?._id
          
        //   // if (userId) {
        //   //   const hasReviewed = reviews.some(review => 
        //   //     review.user?._id?.toString() === userId.toString() ||
        //   //     review.userId?.toString() === userId.toString()
        //   //   )
            
        //   //   setUserHasReviewed(hasReviewed)
            
        //   //   if (hasReviewed) {
        //   //     showInfo('You have already reviewed this item')
        //   //   }
        //   }
        // } catch {
        //   setUserHasReviewed(false)
        // }
      } else {
        setExistingReviews([])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setExistingReviews([])
      if (error.response?.status !== 404) {
        showError('Failed to load reviews')
      }
    } finally {
      setLoadingReviews(false)
    }
  }

  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false)
    setCurrentReviewItem(null)
    setExistingReviews([])
    setShowReviewsList(true)
    setUserHasReviewed(false)
    setReviewData({
      rating: 0,
      comment: '',
      ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
    })
  }, [])

  const openCommentModal = useCallback((item) => {
    setCurrentCommentItem(item)
    setShowCommentModal(true)
  }, [])

  const closeCommentModal = useCallback(() => {
    setShowCommentModal(false)
    setCurrentCommentItem(null)
  }, [])

  const handleSubmitReview = async () => {
    if (userHasReviewed) {
      showWarning('You have already reviewed this item')
      return
    }
    
    if (reviewData.rating === 0) {
      showWarning('Please select a rating')
      return
    }
    
    if (!reviewData.comment.trim()) {
      showWarning('Please write a comment')
      return
    }

    setSubmittingReview(true)
    
    try {
      // Build review payload - include foodPartnerId only if available
      const reviewPayload = {
        rating: reviewData.rating,
        comment: reviewData.comment,
        ratings: reviewData.ratings
      }

      // Add foodPartnerId if available (partner posts typically have this)
      const foodPartnerId = currentReviewItem.postSource === 'partner' 
        ? currentReviewItem.partnerId?._id 
        : currentReviewItem.taggedPartner?._id

      if (foodPartnerId) {
        reviewPayload.foodPartnerId = foodPartnerId
      }

      // Add foodItemId if available (partner posts and tagged user posts have this)
      if (currentReviewItem.foodId) {
        reviewPayload.foodItemId = currentReviewItem.foodId
      }

      await axios.post(
        API_ENDPOINTS.reviews.create,
        reviewPayload,
        axiosConfig
      )

      showSuccess('Review submitted successfully!')
      setUserHasReviewed(true)
      await fetchReviews(currentReviewItem)
      setShowReviewsList(true)
      
      setReviewData({
        rating: 0,
        comment: '',
        ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
      })
    } catch (error) {
      console.error('Error submitting review:', error)
      if (error.response?.status === 401) {
        showError('Please login to submit a review')
      } else if (error.response?.status === 400) {
        showError(error.response?.data?.message || 'Invalid review data')
      } else {
        showError(error.response?.data?.message || 'Failed to submit review')
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  // Check all user interactions on load - ONLY ONCE
  useEffect(() => {
    if (hasInitializedInteractions.current || combinedContent.length === 0) return
    
    const checkUserInteractions = async () => {
      try {
        // Fetch user profile
        let userProfile = null
        try {
          const profileResponse = await axios.get(API_ENDPOINTS.auth.userProfile, axiosConfig)
          userProfile = profileResponse.data.user || profileResponse.data
        } catch {
          return
        }

        const userId = userProfile._id?.toString()
        if (!userId) return
        
        // Store user ID for later use
        setCurrentUserId(userId)

        const followingChecks = {}
        const likedChecks = {}
        const savedChecks = {}
        
        const savedFoodIds = new Set(
          (userProfile.savedFoods || []).map(item => 
            typeof item === 'string' ? item : item._id?.toString() || item.toString()
          )
        )
        const savedPostIds = new Set(
          (userProfile.savedPosts || []).map(item => 
            typeof item === 'string' ? item : item._id?.toString() || item.toString()
          )
        )
        
        for (const item of combinedContent) {
          if (item.type === 'post') {
            const postId = item._id.toString()
            
            // Check if post is liked
            if (item.likes && Array.isArray(item.likes)) {
              likedChecks[postId] = item.likes.some(likeId => {
                const likeIdStr = typeof likeId === 'string' ? likeId : likeId._id?.toString() || likeId.toString()
                return likeIdStr === userId
              })
            } else {
              likedChecks[postId] = false
            }
            
            // Check if post is saved
            if (item.postSource === 'user') {
              savedChecks[postId] = savedPostIds.has(postId)
            } else {
              savedChecks[postId] = savedFoodIds.has(postId)
            }
            
            // Check following status
            let targetId = null
            let targetType = null
            
            if (item.postSource === 'partner' && item.partnerId?._id) {
              targetId = item.partnerId._id.toString()
              targetType = 'FoodPartner'
            } else if (item.postSource === 'user' && item.postedBy?._id) {
              targetId = item.postedBy._id.toString()
              targetType = 'User'
            }
            
            if (targetId && targetType && targetId !== userId) {
              if (!(targetId in followingChecks)) {
                try {
                  const response = await axios.get(
                    API_ENDPOINTS.follow.check(targetId, targetType),
                    axiosConfig
                  )
                  followingChecks[targetId] = response.data.isFollowing
                } catch {
                  followingChecks[targetId] = false
                }
              }
            }
          }
        }
        
        // console.log('Initialized states:', {
        //   totalPostsChecked: Object.keys(likedChecks).length,
        //   actuallyLiked: Object.entries(likedChecks).filter(([, isLiked]) => isLiked).length,
        //   totalSavedChecked: Object.keys(savedChecks).length,
        //   actuallySaved: Object.entries(savedChecks).filter(([, isSaved]) => isSaved).length,
        //   totalUsersChecked: Object.keys(followingChecks).length,
        //   actuallyFollowing: Object.entries(followingChecks).filter(([, isFollowing]) => isFollowing).length
        // })
        
        setFollowingStatus(followingChecks)
        setLikedPosts(likedChecks)
        setSavedPosts(savedChecks)
        
        // Mark as initialized
        hasInitializedInteractions.current = true
        
      } catch (error) {
        console.error('Error checking user interactions:', error)
      }
    }
    
    checkUserInteractions()
  }, [combinedContent])

  const handleShare = useCallback((item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      }).then(() => {
        showInfo('Shared successfully!')
      }).catch(err => {
        console.log('Error sharing:', err)
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          showInfo('Link copied to clipboard!')
        })
        .catch(() => {
          showError('Unable to share')
        })
    }
  }, [])

  const handleAdClick = useCallback((ad) => {
    if (ad.ctaLink && ad.ctaLink !== '#') {
      window.open(ad.ctaLink, '_blank')
    }
  }, [])

  const handleOrderClick = useCallback((food) => {
    const orderData = food.postSource === 'user' && food.taggedFood ? {
      ...food,
      _id: food.foodId,
      title: food.originalFoodName || food.taggedFood.name || food.title,
      description: food.originalFoodDescription || food.taggedFood.description || food.description,
      foodImageUrl: food.foodImageUrl
    } : food
    
    setSelectedFoodForOrder(orderData)
    setIsOrderModalOpen(true)
  }, [])

  const handleCloseOrderModal = useCallback(() => {
    setIsOrderModalOpen(false)
    setSelectedFoodForOrder(null)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const newMuted = !prev
      videoRefs.current.forEach(video => {
        if (video) video.muted = newMuted
      })
      return newMuted
    })
  }, [])

  const togglePlayPause = useCallback(() => {
    const video = videoRefs.current[currentIndex]
    if (video) {
      if (playing) {
        video.pause()
      } else {
        video.play()
      }
      setPlaying(!playing)
    }
  }, [currentIndex, playing])

  const formatCount = useCallback((count) => {
    if (!count) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }, [])

  const formatDate = useCallback((dateString) => {
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
  }, [])

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
        <ReelPageHeader />
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
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
            onComment={openCommentModal}
            onFollow={handleFollow}
            onShopToggle={handleShopToggle}
            onToggleMute={toggleMute}
            onTogglePlayPause={togglePlayPause}
            onOrderClick={handleOrderClick}
            onAdClick={handleAdClick}
            formatCount={formatCount}
            formatDate={formatDate}
          />
        ))}
      </div>

      <QuickOrderModal 
        food={selectedFoodForOrder}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />

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
          setReviewData(prev => {
            const newRatings = { ...prev.ratings, [category]: value }
            // Calculate average rating from all categories
            const values = Object.values(newRatings).filter(v => v > 0)
            const avgRating = values.length > 0 
              ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
              : 0
            
            return {
              ...prev,
              rating: avgRating, // Update main rating
              ratings: newRatings
            }
          })
        }
        onCommentChange={(e) => 
          setReviewData(prev => ({ ...prev, comment: e.target.value }))
        }
        onTabChange={setShowReviewsList}
      />

      {/* Comment Modal for User Posts */}
      <CommentModal
        isOpen={showCommentModal}
        post={currentCommentItem}
        onClose={closeCommentModal}
        onCommentAdded={() => {
          // Refresh the post view if needed
          // Could refetch the post to update comment count
        }}
      />

      {/* Bottom Menu Bar */}
      <MenuBarBottom />
    </>
  )
}

export default Reel