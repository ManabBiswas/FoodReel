import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import API_ENDPOINTS, { axiosConfig } from '../config/Api'
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast'
import { ChefHat } from 'lucide-react'
// import { useAuth } from '../Contexts/AuthContext'
import ReelArea from '../Components/ReelArea'
import ReelReviewModal from '../Components/ReelReviewModal'
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
  
  const containerRef = useRef(null)
  const videoRefs = useRef([])
  
  // const { isAuthenticated } = useAuth()

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
            likes: post.likes || [], // Array of user IDs who liked
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
            likes: post.likes || [], // Array of user IDs who liked
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
        
        // Combine posts and ads (insert ad every 3-4 posts)
        const combined = insertAdsIntoPosts(allPosts, mappedAds)
        console.log('Combined content with ads:', combined)
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
      
      // Optimistically update UI immediately
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
      
      const response = await axios.post(endpoint, {}, axiosConfig)
      console.log('Like response:', response.data)
      
      // Update like count and maintain likes array consistency
      setCombinedContent(combinedContent.map(item => {
        if (item._id === postId && item.type === 'post') {
          return {
            ...item,
            likeCount: response.data.likeCount || response.data.likes || item.likeCount
          }
        }
        return item
      }))
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
  }

  const handleSave = async (postId) => {
    try {
      // Optimistically update UI
      const wasSaved = savedPosts[postId]
      setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
      
      await axios.post(API_ENDPOINTS.food.save(postId), {}, axiosConfig)
      
      // Show feedback
      if (!wasSaved) {
        showSuccess('Post saved!')
      } else {
        showInfo('Post removed from saved')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      // Revert optimistic update on error
      setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
      
      if (error.response?.status === 401) {
        showError('Please login to save posts')
      } else {
        showError(error.response?.data?.message || 'Failed to save post')
      }
    }
  }

  const handleFollow = async (targetId, targetType) => {
    try {
      // Ensure targetId is a string
      const targetIdStr = typeof targetId === 'object' ? targetId._id || targetId.toString() : targetId.toString();
      
      console.log('handleFollow called:', { targetId: targetIdStr, targetType });
      
      const isFollowing = followingStatus[targetIdStr];
      
      // Optimistically update UI
      setFollowingStatus(prev => ({ ...prev, [targetIdStr]: !prev[targetIdStr] }));
      
      if (isFollowing) {
        await axios.post(
          API_ENDPOINTS.follow.unfollow,
          { targetId: targetIdStr, targetType },
          axiosConfig
        );
        showSuccess('Unfollowed successfully');
      } else {
        await axios.post(
          API_ENDPOINTS.follow.follow,
          { targetId: targetIdStr, targetType },
          axiosConfig
        );
        showSuccess('Following!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      console.error('Error response:', error.response?.data);
      
      // Revert optimistic update on error
      const targetIdStr = typeof targetId === 'object' ? targetId._id || targetId.toString() : targetId.toString();
      setFollowingStatus(prev => ({ ...prev, [targetIdStr]: !prev[targetIdStr] }));
      
      if (error.response?.status === 401) {
        showError('Please login to follow');
      } else {
        showError(error.response?.data?.message || 'Failed to update follow status');
      }
    }
  }

  const openReviewModal = async (item) => {
    setCurrentReviewItem(item)
    setShowReviewModal(true)
    setShowReviewsList(true)
    setUserHasReviewed(false) // Reset state
    setReviewData({
      rating: 0,
      comment: '',
      ratings: { food: 0, service: 0, ambiance: 0, value: 0 }
    })
    
    // Fetch existing reviews and check if user already reviewed
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
        const reviews = response.data.data || response.data.reviews || []
        setExistingReviews(reviews)
        
        // Check if current user already reviewed
        try {
          const userProfileResponse = await axios.get(API_ENDPOINTS.auth.userProfile, axiosConfig)
          const currentUserId = (userProfileResponse.data.user || userProfileResponse.data)?._id
          
          if (currentUserId) {
            const hasReviewed = reviews.some(review => 
              review.user?._id?.toString() === currentUserId.toString() ||
              review.userId?.toString() === currentUserId.toString()
            )
            
            setUserHasReviewed(hasReviewed)
            
            if (hasReviewed) {
              showInfo('You have already reviewed this item')
            }
          }
        } catch {
          // User not logged in, no need to check
          setUserHasReviewed(false)
        }
      } else {
        setExistingReviews([])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setExistingReviews([])
      // Only show error if it's not a 404 (no reviews found)
      if (error.response?.status !== 404) {
        showError('Failed to load reviews')
      }
    } finally {
      setLoadingReviews(false)
    }
  }

  const closeReviewModal = () => {
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
  }

  const handleSubmitReview = async () => {
    // Check if user already reviewed
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

      showSuccess('Review submitted successfully!')
      
      // Mark as reviewed
      setUserHasReviewed(true)
      
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

  // Check all user interactions on load (likes, saves, follows)
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (combinedContent.length === 0) return
      
      try {
        // Fetch user profile to get saved posts and user ID
        let userProfile = null
        try {
          const profileResponse = await axios.get(API_ENDPOINTS.auth.userProfile, axiosConfig)
          userProfile = profileResponse.data.user || profileResponse.data
        } catch {
          // User not logged in - all interactions will be false
          console.log('User not logged in, skipping interaction checks')
          return
        }

        const currentUserId = userProfile._id?.toString()
        if (!currentUserId) return

        // Initialize all state objects
        const followingChecks = {}
        const likedChecks = {}
        const savedChecks = {}
        
        // Get saved food IDs and saved post IDs from user profile
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
        
        // Process each item in combined content
        for (const item of combinedContent) {
          if (item.type === 'post') {
            const postId = item._id.toString()
            
            // Check if post is liked - use the data we already have from initial fetch
            // The likes array should already be populated in combinedContent
            if (item.likes && Array.isArray(item.likes)) {
              likedChecks[postId] = item.likes.some(likeId => {
                const likeIdStr = typeof likeId === 'string' ? likeId : likeId._id?.toString() || likeId.toString()
                return likeIdStr === currentUserId
              })
            } else {
              likedChecks[postId] = false
            }
            
            // Check if post is saved using user profile data
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
            
            // Don't check if user is following themselves
            if (targetId && targetType && targetId !== currentUserId) {
              // Only check if not already checked for this target
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
        
        console.log('Initialized states:', {
          totalPostsChecked: Object.keys(likedChecks).length,
          actuallyLiked: Object.entries(likedChecks).filter(([, isLiked]) => isLiked).length,
          totalSavedChecked: Object.keys(savedChecks).length,
          actuallySaved: Object.entries(savedChecks).filter(([, isSaved]) => isSaved).length,
          totalUsersChecked: Object.keys(followingChecks).length,
          actuallyFollowing: Object.entries(followingChecks).filter(([, isFollowing]) => isFollowing).length
        })
        
        // Update all states at once
        setFollowingStatus(followingChecks)
        setLikedPosts(likedChecks)
        setSavedPosts(savedChecks)
        
      } catch (error) {
        console.error('Error checking user interactions:', error)
      }
    }
    
    checkUserInteractions()
  }, [combinedContent])

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      }).then(() => {
        showInfo('Shared successfully!')
      }).catch(err => {
        console.log('Error sharing:', err)
        // User cancelled or error - don't show error toast
      })
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          showInfo('Link copied to clipboard!')
        })
        .catch(() => {
          showError('Unable to share')
        })
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
            onTogglePlayPause={togglePlayPause}
            onOrderClick={handleOrderClick}
            onAdClick={handleAdClick}
            formatCount={formatCount}
            formatDate={formatDate}
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
