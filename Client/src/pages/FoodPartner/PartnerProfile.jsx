import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import { useNavigate } from 'react-router-dom'
import FoodPartnersReviews from '../../Components/FoodPartnersReviews'
import FoodDetailModal from '../../Components/FoodDetailModal'
import { Building2, MapPin, Phone, Mail, Users, UtensilsCrossed, Heart, LogOut, Settings, Plus, Grid3X3, Star, Tag, CheckCircle, Video, Image, Play, MessageCircle, User, Loader2, Megaphone, ShoppingBag } from 'lucide-react'

const PartnerProfile = () => {
  const navigate = useNavigate()
  const [errors, setErrors] = useState('')
  const [activeTab, setActiveTab] = useState('posts')
  const [postFilter, setPostFilter] = useState('all') // 'all', 'food', 'advertisement'
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState("")
  const [partnerData, setPartnerData] = useState(null)
  const [postItems, setPostItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [bioLoading, setBioLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch partner profile data
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true)
      setErrors('')
      const [profileResponse, foodResponse, adResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.auth.partnerProfile, axiosConfig),
        axios.get(API_ENDPOINTS.food.myPosts, axiosConfig),
        axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig)
      ])

      // console.log('Profile response:', profileResponse.data)
      // console.log('Food posts:', foodResponse.data)
      // console.log('Advertisement posts:', adResponse.data)

      // Extract food posts from the response structure
      const foodPostsData = foodResponse.data?.foods?.all || foodResponse.data?.foods?.food || []
      const adPostsData = adResponse.data?.data || []

      // Combine food and advertisement posts
      const foodPosts = foodPostsData.map(post => ({
        ...post,
        postType: 'food',
        image: post.image || post.file,
        video: post.video || post.file
      }))

      const adPosts = adPostsData.map(post => ({
        ...post,
        postType: 'advertisement',
        image: post.type === 'image' ? post.file : null,
        video: post.type === 'video' ? post.file : null
      }))

      // Combine and sort by creation date (newest first)
      const allPosts = [...foodPosts, ...adPosts].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )

      setPartnerData(profileResponse.data.partner)
      setPostItems(allPosts)
      setBioText(profileResponse.data.partner.bio)
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Check if it's an authentication error (401 or 403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Redirect to partner login
        navigate('/partner-login')
        return
      }

      setErrors('Error loading profile data', error)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  // Handle bio editing
  const handleSaveBio = async () => {
    try {
      setBioLoading(true)
      await axios.put('http://localhost:3000/api/auth/partner/bio',
        { bio: bioText },
        { withCredentials: true }
      )

      setPartnerData(prev => ({ ...prev, bio: bioText }))
      setIsEditingBio(false)
      showSuccess('Bio updated successfully!')
    } catch (error) {
      console.error('Error updating bio:', error)
      showError('Error updating bio')
    } finally {
      setBioLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:3000/api/auth/partner/logout', { withCredentials: true })
    } catch (err) {
      console.warn('Logout request failed:', err)
    } finally {
      // Ensure client navigates to login page
      navigate('/partner-login')
    }
  }

  const handleCancelBio = () => {
    setBioText(partnerData?.bio || "")
    setIsEditingBio(false)
  }

  const handleFoodClick = (food) => {
    setSelectedFood(food)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFood(null)
  }

  // Filter posts based on selected filter
  const getFilteredPosts = () => {
    if (postFilter === 'all') return postItems
    return postItems.filter(item => item.postType === postFilter)
  }

  const filteredPosts = getFilteredPosts()
  const foodPostsCount = postItems.filter(item => item.postType === 'food').length
  const adPostsCount = postItems.filter(item => item.postType === 'advertisement').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto bg-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto bg-white min-h-screen">
        {errors && (
          <div className="mx-4 sm:mx-6 lg:mx-8 pt-4 mb-2 p-3 rounded-md text-sm bg-red-50 border border-red-200 text-red-700 ">
            {errors}
          </div>
        )}

        {/* Profile Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-row gap-6 mb-6">
            {/* Profile Picture */}
            <div className="flex justify-center sm:justify-start">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              {/* Company Name and Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900">{partnerData.companyName}</h2>
                  {partnerData.verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => setIsEditingBio(!isEditingBio)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 cursor-pointer" />
                    {isEditingBio ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>


          <div className="">
            {/* Bio Section */}
            {isEditingBio ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio Description
                </label>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Tell customers about your restaurant..."
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {bioText.length}/300 characters
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelBio}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBio}
                      disabled={bioLoading}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white text-sm rounded transition-colors flex items-center gap-1"
                    >
                      {bioLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-line mb-3">
                {bioText}
              </div>
            )}
          </div>
          <div>
            {/* Contact Info */}
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex sm:justify-start gap-2">
                <Mail className="w-3 h-3" />
                <span>{partnerData.email}</span>
              </div>
              <div className="flex  sm:justify-start gap-2">
                <Phone className="w-3 h-3" />
                <span>{partnerData.phone}</span>
              </div>
              <div className="flex sm:justify-start gap-2">
                <MapPin className="w-3 h-3" />
                <span className="text-left">{partnerData.address}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="flex justify-center sm:justify-start gap-6 mb-4 text-sm">
          <div>
            <span className="font-semibold text-gray-900">{postItems.length}</span>
            <span className="text-gray-600 ml-1">posts</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">{partnerData.followers.toLocaleString()}</span>
            <span className="text-gray-600 ml-1">followers</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">{partnerData.following}</span>
            <span className="text-gray-600 ml-1">following</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-200">
          <div className="flex justify-center">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center justify-center gap-1 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors ${activeTab === 'posts'
                  ? 'text-gray-900 border-t-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center justify-center gap-1 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors ${activeTab === 'reviews'
                  ? 'text-gray-900 border-t-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Reviews</span>
              </button>
              <button
                onClick={() => setActiveTab('tagged')}
                className={`flex items-center justify-center gap-1 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors ${activeTab === 'tagged'
                  ? 'text-gray-900 border-t-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Tagged</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="pb-8">
          {activeTab === 'posts' && (
            <>
              {/* Post Filter Buttons */}
              <div className="px-4 sm:px-6 lg:px-8 mb-4">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPostFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${postFilter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    All Posts ({postItems.length})
                  </button>
                  <button
                    onClick={() => setPostFilter('food')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${postFilter === 'food'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <ShoppingBag className="w-4 h-4 inline mr-1" />
                    Food ({foodPostsCount})
                  </button>
                  <button
                    onClick={() => setPostFilter('advertisement')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${postFilter === 'advertisement'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Megaphone className="w-4 h-4 inline mr-1" />
                    Ads ({adPostsCount})
                  </button>
                </div>
              </div>

              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4 sm:px-6 lg:px-8">
                  {filteredPosts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleFoodClick(item)}
                      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 hover:scale-105 transition-transform duration-200"
                    >
                      {/* Portrait 9:16 Aspect Ratio Container (like reels) */}
                      <div className="aspect-[9/16] w-full bg-gray-200 flex items-center justify-center relative overflow-hidden">
                        {/* Show actual image or video */}
                        {item.type === 'video' && item.video ? (
                          <video
                            src={item.video}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            onError={(e) => {
                              console.error('Video load error:', e.target.src)
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : item.type === 'image' && item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error:', e.target.src)
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          // Fallback placeholder
                          <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                        )}

                        {/* Content Type Indicators */}
                        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                          {/* Post Type Badge */}
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${item.postType === 'food'
                            ? 'bg-green-500/80 text-white'
                            : 'bg-purple-500/80 text-white'
                            }`}>
                            {item.postType === 'food' ? (
                              <ShoppingBag className="w-3 h-3" />
                            ) : (
                              <Megaphone className="w-3 h-3" />
                            )}
                            <span>{item.postType === 'food' ? 'Food' : 'Ad'}</span>
                          </div>

                          {/* Media Type Indicator */}
                          {item.type === 'video' ? (
                            <div className="flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                              <Video className="w-3 h-3 text-white" />
                              <span className="text-white text-xs font-medium">{item.duration || '0:00'}</span>
                            </div>
                          ) : (
                            <div className="bg-black/60 rounded p-1">
                              <Image className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Play Button Overlay for Videos */}
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center group-hover:bg-black/60 transition-colors">
                              <Play className="w-6 h-6 text-white ml-1" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hover Stats Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                        {/* Top section with stats */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-4 text-white">
                            <div className="flex items-center gap-1">
                              <Heart className="w-5 h-5" />
                              <span className="font-semibold">{item.likeCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-5 h-5" />
                              <span className="font-semibold">{item.commentCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom section with food details */}
                        <div className="space-y-2">
                          <h3 className="text-white text-sm font-semibold truncate">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="text-white/90 text-xs line-clamp-2 leading-tight">
                              {item.description}
                            </p>
                          )}

                          {/* Post Type Specific Info */}
                          {item.postType === 'food' ? (
                            <div className="space-y-1">
                              {item.price && (
                                <div className="text-white text-xs font-semibold">
                                  ₹{item.price}
                                </div>
                              )}
                              {item.preparationTime && (
                                <div className="text-white/80 text-xs">
                                  {item.preparationTime} mins
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-white text-xs font-semibold">
                                {item.promotionType ? item.promotionType.charAt(0).toUpperCase() + item.promotionType.slice(1) : 'Advertisement'}
                              </div>
                              {item.prices && (item.prices.original || item.prices.discounted) && (
                                <div className="text-white/80 text-xs">
                                  {item.prices.original && item.prices.discounted ? (
                                    <>
                                      <span className="line-through">₹{item.prices.original}</span>
                                      <span className="ml-1 font-semibold">₹{item.prices.discounted}</span>
                                    </>
                                  ) : (
                                    item.prices.original && `₹${item.prices.original}`
                                  )}
                                </div>
                              )}
                              {item.promoCode && (
                                <div className="text-white/90 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                                  {item.promoCode}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-white/80 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-white/80 text-xs">+{item.tags.length - 3}</span>
                              )}
                            </div>
                          )}

                          {/* Click to view indicator */}
                          <div className="text-center">
                            <span className="text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full">
                              Click to view
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Type Badge at Bottom */}
                      <div className="absolute bottom-2 left-2 z-10">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${item.postType === 'food'
                          ? item.type === 'video'
                            ? 'bg-green-500/80 text-white'
                            : 'bg-green-600/80 text-white'
                          : item.type === 'video'
                            ? 'bg-purple-500/80 text-white'
                            : 'bg-purple-600/80 text-white'
                          }`}>
                          {item.postType === 'food'
                            ? (item.type === 'video' ? 'Food Reel' : 'Food Post')
                            : (item.type === 'video' ? 'Ad Reel' : 'Ad Post')
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-500 mb-4">Start sharing your delicious food creations</p>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
                    Create Your First Post
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'reviews' && (
            <FoodPartnersReviews />
          )}

          {activeTab === 'tagged' && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <Tag className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No Tagged Posts</h3>
              <p className="text-gray-500">Posts you're tagged in will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        partnerData={partnerData}
      />
    </div>
  )
}

export default PartnerProfile