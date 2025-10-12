import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreVertical, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  ChefHat,
  MapPin,
  Eye,
  TrendingUp,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import API_ENDPOINTS, { axiosConfig } from '../config/Api'
import ReelOrderButton from '../Components/ReelOrderButton'
import QuickOrderModal from '../Components/QuickOrderModal'

const Reel = () => {
  const [combinedContent, setCombinedContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [selectedFoodForOrder, setSelectedFoodForOrder] = useState(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const containerRef = useRef(null)
  const videoRefs = useRef([])

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
            // Order button shows only if: taggedFood exists, has price, and is available
            price: (post.taggedFood?.price && post.taggedFood?.isAvailable !== false) ? post.taggedFood.price : null,
            preparationTime: post.taggedFood?.preparationTime || null,
            isAvailable: post.taggedFood?.isAvailable !== false,
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
        alert('Failed to fetch data. Please try again.')
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
      
      // Optimistically update UI
      setCombinedContent(combinedContent.map(item => 
        item._id === postId && item.type === 'post'
          ? { ...item, likes: response.data.likeCount || item.likes }
          : item
      ))
    } catch (error) {
      console.error('Error liking post:', error)
      alert('Failed to like post. Please try again.')
    }
  }

  const handleSave = async (postId) => {
    try {
      await axios.post(API_ENDPOINTS.food.save(postId), {}, axiosConfig)
      alert('Post saved!')
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err))
    } else {
      alert('Share functionality not supported on this device')
    }
  }

  const handleAdClick = (ad) => {
    if (ad.ctaLink && ad.ctaLink !== '#') {
      window.open(ad.ctaLink, '_blank')
    }
  }

  const handleOrderClick = (food) => {
    setSelectedFoodForOrder(food)
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

  @media (min-width: 768px) {
    .reel-content {
      max-width: min(calc(100vh * 9 / 16), 700px);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
    }
  }
`}</style>

      {combinedContent.map((item, index) => (
        <div 
          key={`${item.type}-${item.postSource || 'ad'}-${item._id}-${index}`}
          data-reel
          className="reel-container snap-start snap-always"
        >
          <div className="reel-content">
            {/* Media wrapper to prevent cropping */}
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
                />
              )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between z-10 safe-area-inset-top">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* {item.type === 'ad' ? ( */}
                {/* <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  <span className="text-white font-semibold text-sm sm:text-base">Sponsored</span>
                </> */}
              {/* ) : ( */}
                <>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-white font-semibold text-sm sm:text-base">FoodReels</span>
                </>
              {/*  )} */}
            </div>
            <button className="text-white p-1">
              <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Right Side Actions - Only for Posts */}
          {item.type === 'post' && (
            <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-24 flex flex-col gap-3 sm:gap-4 z-10">
              {/* Like Button */}
              <button 
                onClick={() => handleLike(item._id, item.postSource)}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:fill-red-500 group-hover:text-red-500 transition-all" />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                  {formatCount(item.likes)}
                </span>
              </button>

              {/* Comment Button */}
              <button className="flex flex-col items-center gap-0.5 sm:gap-1 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                  {formatCount(item.comments || 0)}
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={() => handleShare(item)}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                  {formatCount(item.shares || 0)}
                </span>
              </button>

              {/* Save Button */}
              <button 
                onClick={() => handleSave(item._id)}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </button>

              {/* Views */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                  {formatCount(item.views)}
                </span>
              </div>

              {/* Mute/Unmute for videos */}
              {item.mediaType === 'video' && (
                <button 
                  onClick={toggleMute}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  {muted ? (
                    <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </button>
              )}
            </div>
          )}
          {/* Order Button for Food Posts */}
          {item.type === 'post' && (
            <ReelOrderButton 
              food={item} 
              onOrderClick={handleOrderClick}
            />
          )}

          {/* Ad CTA Button - Only for Ads */}
          {item.type === 'ad' && (
            <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-24 flex flex-col gap-3 sm:gap-4 z-10">
              <button 
                onClick={() => handleAdClick(item)}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                  Visit
                </span>
              </button>
            </div>
          )}


          {/* Bottom Content Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 sm:p-4 sm:pb-6 z-10 safe-area-inset-bottom">
            <div className="max-w-full pr-12 sm:pr-16">
              {/* Partner Post Content */}
              {item.type === 'post' && item.postSource === 'partner' && item.partnerId && (
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 p-0.5 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-xs sm:text-sm truncate">
                      {item.partnerId.companyName || item.partnerId.email || 'Food Partner'}
                    </h4>
                    <p className="text-white/70 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="truncate">{item.partnerId.location || item.partnerId.address || 'Location not specified'}</span>
                    </p>
                  </div>
                  <button className="px-3 py-1 sm:px-4 sm:py-1.5 bg-white text-black rounded-full text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all flex-shrink-0">
                    Follow
                  </button>
                </div>
              )}

              {/* User Post Content */}
              {item.type === 'post' && item.postSource === 'user' && item.postedBy && (
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-0.5 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-xs sm:text-sm truncate">
                      {item.postedBy.firstName} {item.postedBy.lastName}
                    </h4>
                    {item.taggedPartner && (
                      <p className="text-white/70 text-[10px] sm:text-xs flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">Tagged: {item.taggedPartner.companyName}</span>
                      </p>
                    )}
                  </div>
                  <button className="px-3 py-1 sm:px-4 sm:py-1.5 bg-white text-black rounded-full text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all flex-shrink-0">
                    Follow
                  </button>
                </div>
              )}

              {/* Ad Content */}
              {item.type === 'ad' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-xs sm:text-sm truncate">
                        {item.businessName}
                      </h4>
                      <p className="text-yellow-400 text-[10px] sm:text-xs font-semibold">
                        Sponsored Ad
                      </p>
                    </div>
                  </div>
                  
                  {/* Promo Code Badge */}
                  {item.promoCode && (
                    <div className="mb-1.5 sm:mb-2 inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm">
                      CODE: {item.promoCode}
                    </div>
                  )}
                  
                  {/* Price Display */}
                  {item.prices && (
                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                      <span className="text-white/60 line-through text-sm sm:text-lg">
                        ₹{item.prices.original}
                      </span>
                      <span className="text-yellow-400 font-bold text-xl sm:text-2xl">
                        ₹{item.prices.discounted}
                      </span>
                      <span className="bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
                        {Math.round(((item.prices.original - item.prices.discounted) / item.prices.original) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Title & Description */}
              <h3 className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                {item.description}
              </p>

              {/* Ad CTA Button */}
              {item.type === 'ad' && (
                <button
                  onClick={() => handleAdClick(item)}
                  className="mt-2 sm:mt-4 px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full text-xs sm:text-sm font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-1.5 sm:gap-2"
                >
                  <span className="truncate">{item.ctaText}</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                </button>
              )}

              {/* Timestamp */}
              <p className="text-white/60 text-[10px] sm:text-xs mt-1 sm:mt-2">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          {/* Play/Pause overlay for videos */}
          {item.mediaType === 'video' && (
            <button 
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center z-0"
            >
              {!playing && (
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              )}
            </button>
          )}
          </div>
        </div>
      ))}

      {/* Quick Order Modal */}
      <QuickOrderModal
        food={selectedFoodForOrder}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
      />
    </div>
  )
}

export default Reel