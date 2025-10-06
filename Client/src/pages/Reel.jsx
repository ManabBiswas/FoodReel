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
        
        // Fetch posts
        const postsResponse = await axios.get(API_ENDPOINTS.food.getAll, axiosConfig)
        console.log('Posts API Response:', postsResponse.data)
        
        // Fetch advertisements
        const adsResponse = await axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig)
        console.log('Ads API Response:', adsResponse.data)
        
        let mappedPosts = []
        let mappedAds = []
        
        if (postsResponse.data.data) {
          mappedPosts = postsResponse.data.data.map(post => ({
            _id: post._id,
            type: 'post',
            title: post.name || 'Untitled Post',
            description: post.description || '',
            mediaUrl: post.image || '',
            mediaType: post.type || 'image',
            partnerId: post.foodPartner || null,
            likes: post.likeCount || 0,
            comments: post.commentCount || 0,
            views: post.views || 0,
            shares: post.shares || 0,
            savesCount: post.savesCount || 0,
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
        
        // Combine posts and ads (insert ad every 3-4 posts)
        const combined = insertAdsIntoPosts(mappedPosts, mappedAds)
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

  // const setMockData = () => {
  //   const mockPosts = [
  //     {
  //       _id: '1',
  //       type: 'post',
  //       title: 'Amazing Pizza Experience!',
  //       description: 'Just tried this incredible margherita pizza. The crust was perfectly crispy! 🍕',
  //       mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=700&fit=crop',
  //       mediaType: 'image',
  //       partnerId: {
  //         businessName: "Mario's Kitchen",
  //         location: 'Downtown Food District'
  //       },
  //       likes: 124,
  //       views: 1250,
  //       createdAt: new Date().toISOString()
  //     },
  //     {
  //       _id: '2',
  //       type: 'post',
  //       title: 'Street Food Adventure',
  //       description: 'Exploring the local street food scene. This taco stand has the most authentic flavors! 🌮',
  //       mediaUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=700&fit=crop',
  //       mediaType: 'image',
  //       partnerId: {
  //         businessName: "Jose's Taco Stand",
  //         location: 'Street Food Market'
  //       },
  //       likes: 203,
  //       views: 2100,
  //       createdAt: new Date().toISOString()
  //     },
  //     {
  //       _id: 'ad-1',
  //       type: 'ad',
  //       title: 'Special Offer!',
  //       description: 'Get 50% off on your first order. Limited time only!',
  //       mediaUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=700&fit=crop',
  //       mediaType: 'image',
  //       ctaText: 'Order Now',
  //       ctaLink: '#',
  //       businessName: 'FoodHub Premium',
  //       createdAt: new Date().toISOString()
  //     },
  //     {
  //       _id: '3',
  //       type: 'post',
  //       title: 'Dessert Paradise',
  //       description: 'This tiramisu was absolutely divine! Every spoonful was pure heaven 🍰',
  //       mediaUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=700&fit=crop',
  //       mediaType: 'image',
  //       partnerId: {
  //         businessName: 'Sweet Dreams Cafe',
  //         location: 'City Center'
  //       },
  //       likes: 156,
  //       views: 1420,
  //       createdAt: new Date().toISOString()
  //     }
  //   ]
    
  // //   // setCombinedContent(mockPosts)
  // }

  // Use IntersectionObserver to detect which reel is in view
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

  const handleLike = async (postId) => {
    try {
      const response = await axios.post(API_ENDPOINTS.food.like(postId), {}, axiosConfig)
      console.log('Like response:', response.data)
      
      // Optimistically update UI
      setCombinedContent(combinedContent.map(item => 
        item._id === postId && item.type === 'post'
          ? { ...item, likes: (item.likes || 0) + 1 }
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
      `}</style>

      {combinedContent.map((item, index) => (
        <div 
          key={item._id}
          data-reel
          className="relative w-full h-screen snap-start snap-always"
        >
          {/* Background Media */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60">
            {item.mediaType === 'video' ? (
              <video
                ref={el => videoRefs.current[index] = el}
                src={item.mediaUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={muted}
                autoPlay={index === currentIndex}
              />
            ) : (
              <img 
                src={item.mediaUrl} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              {item.type === 'ad' ? (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">Sponsored</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">Food Reels</span>
                </>
              )}
            </div>
            <button className="text-white">
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>

          {/* Right Side Actions - Only for Posts */}
          {item.type === 'post' && (
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
              {/* Like Button */}
              <button 
                onClick={() => handleLike(item._id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Heart className="w-6 h-6 text-white group-hover:fill-red-500 group-hover:text-red-500 transition-all" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {formatCount(item.likes)}
                </span>
              </button>

              {/* Comment Button */}
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {formatCount(item.comments || 0)}
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={() => handleShare(item)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {formatCount(item.shares || 0)}
                </span>
              </button>

              {/* Save Button */}
              <button 
                onClick={() => handleSave(item._id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Bookmark className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Views */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {formatCount(item.views)}
                </span>
              </div>

              {/* Mute/Unmute for videos */}
              {item.mediaType === 'video' && (
                <button 
                  onClick={toggleMute}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  {muted ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Ad CTA Button - Only for Ads */}
          {item.type === 'ad' && (
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10">
              <button 
                onClick={() => handleAdClick(item)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  Visit
                </span>
              </button>
            </div>
          )}

          {/* Order Button for Food Posts */}
          {item.type === 'post' && item.price && (
            <ReelOrderButton 
              food={item} 
              onOrderClick={handleOrderClick}
            />
          )}

          {/* Bottom Content Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-10">
            <div className="max-w-md">
              {/* Post Content */}
              {item.type === 'post' && item.partnerId && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm">
                      {item.partnerId.businessName || item.partnerId.email || 'Food Partner'}
                    </h4>
                    <p className="text-white/70 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.partnerId.location || item.partnerId.address || 'Location not specified'}
                    </p>
                  </div>
                  <button className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 transition-all">
                    Follow
                  </button>
                </div>
              )}

              {/* Ad Content */}
              {item.type === 'ad' && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm">
                        {item.businessName}
                      </h4>
                      <p className="text-yellow-400 text-xs font-semibold">
                        Sponsored Ad
                      </p>
                    </div>
                  </div>
                  
                  {/* Promo Code Badge */}
                  {item.promoCode && (
                    <div className="mb-2 inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full font-bold text-sm">
                      CODE: {item.promoCode}
                    </div>
                  )}
                  
                  {/* Price Display */}
                  {item.prices && (
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white/60 line-through text-lg">
                        ₹{item.prices.original}
                      </span>
                      <span className="text-yellow-400 font-bold text-2xl">
                        ₹{item.prices.discounted}
                      </span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {Math.round(((item.prices.original - item.prices.discounted) / item.prices.original) * 100)}% OFF
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Title & Description */}
              <h3 className="text-white font-bold text-lg mb-2">
                {item.title}
              </h3>
              <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                {item.description}
              </p>

              {/* Ad CTA Button */}
              {item.type === 'ad' && (
                <button
                  onClick={() => handleAdClick(item)}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                >
                  {item.ctaText}
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}

              {/* Timestamp */}
              <p className="text-white/60 text-xs mt-2">
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