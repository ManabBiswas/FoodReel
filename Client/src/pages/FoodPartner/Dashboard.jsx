import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import { 
  Plus, 
  ShoppingBag, 
  Megaphone, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle,
  IndianRupee,
  Clock,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState({ food: [], advertisement: [], all: [] })
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  })

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch posts and advertisements
      const [foodResponse, adResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.food.myPosts, axiosConfig),
        axios.get(API_ENDPOINTS.advertisement.getAll, axiosConfig)
      ])
      
      const foodPosts = foodResponse.data?.data || []
      const allAds = adResponse.data?.data || []
      
      // Filter advertisements by current partner
      const myAds = allAds.filter(ad => 
        ad.foodPartner?._id === foodResponse.data?.partnerId || 
        ad.createdBy === foodResponse.data?.partnerId
      )
      
      // Combine and sort by creation date
      const allPosts = [...foodPosts, ...myAds].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      
      setPosts({
        food: foodPosts,
        advertisement: myAds,
        all: allPosts
      })
      
      // Calculate statistics
      const stats = {
        food: {
          count: foodPosts.length,
          totalLikes: foodPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0),
          totalReviews: foodPosts.reduce((sum, post) => sum + (post.reviews?.length || 0), 0),
          totalSaves: foodPosts.reduce((sum, post) => sum + (post.saves?.length || 0), 0)
        },
        advertisement: {
          count: myAds.length,
          totalLikes: myAds.reduce((sum, ad) => sum + (ad.likes?.length || 0), 0),
          totalComments: myAds.reduce((sum, ad) => sum + (ad.comments?.length || 0), 0),
          totalViews: myAds.reduce((sum, ad) => sum + (ad.views || 0), 0)
        },
        total: {
          totalLikes: 0,
          totalComments: 0,
          totalSaves: 0
        }
      }
      
      stats.total.totalLikes = stats.food.totalLikes + stats.advertisement.totalLikes
      stats.total.totalComments = stats.food.totalReviews + stats.advertisement.totalComments
      stats.total.totalSaves = stats.food.totalSaves
      
      setStatistics(stats)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.')
        setTimeout(() => navigate('/partner-login'), 2000)
      } else {
        setError(error.response?.data?.message || 'Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId, postType) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      setDeleteLoading(postId)
      
      const endpoint = postType === 'food' 
        ? API_ENDPOINTS.food.delete(postId)
        : API_ENDPOINTS.advertisement.delete(postId)
      
      await axios.delete(endpoint, axiosConfig)
      
      // Refresh dashboard data
      await fetchDashboardData()
      
    } catch (error) {
      console.error('Error deleting post:', error)
      setError(error.response?.data?.message || 'Failed to delete post')
      setTimeout(() => setError(''), 3000)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleEditPost = (postId, postType) => {
    navigate(`/edit-${postType}/${postId}`)
  }

  const handleViewPost = (postId) => {
    navigate(`/food/${postId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const currentPosts = activeTab === 'all' ? posts.all : posts[activeTab] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your food items and advertisements</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => navigate('/CreateFood')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create New Post
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Food Items</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.food.count}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Heart className="w-4 h-4 mr-1 text-red-400" />
                  {statistics.food.totalLikes} likes
                </div>
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="w-4 h-4 mr-1 text-blue-400" />
                  {statistics.food.totalReviews} reviews
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Advertisements</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.advertisement.count}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Heart className="w-4 h-4 mr-1 text-red-400" />
                  {statistics.advertisement.totalLikes} likes
                </div>
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="w-4 h-4 mr-1 text-blue-400" />
                  {statistics.advertisement.totalComments} comments
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.total.totalLikes + statistics.total.totalComments + statistics.total.totalSaves}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1 text-indigo-400" />
                Total reach across all posts
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Posts', count: posts.all?.length || 0 },
                { key: 'food', label: 'Food Items', count: posts.food?.length || 0 },
                { key: 'advertisement', label: 'Advertisements', count: posts.advertisement?.length || 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Posts Content */}
          <div className="p-6">
            {currentPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post) => {
                  const postType = post.postType || (post.price ? 'food' : 'advertisement')
                  const isDeleting = deleteLoading === post._id
                  
                  return (
                    <div key={post._id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Media */}
                      <div className="relative aspect-video bg-gray-200">
                        {post.video ? (
                          <video
                            src={post.video?.url || post.video}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : post.thumbnail ? (
                          <img
                            src={post.thumbnail?.url || post.thumbnail}
                            alt={post.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No media
                          </div>
                        )}
                        
                        {/* Post type badge */}
                        <div className="absolute top-3 left-3">
                          {postType === 'advertisement' ? (
                            <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs flex items-center">
                              <Megaphone className="w-3 h-3 mr-1" />
                              Ad
                            </div>
                          ) : (
                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Food
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{post.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.description}</p>

                        {/* Type-specific information */}
                        {postType === 'food' && post.price && (
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center text-green-600 text-sm font-medium">
                              <IndianRupee className="w-4 h-4 mr-1" />
                              {post.price}
                            </div>
                            {post.category && (
                              <div className="text-gray-600 text-xs">
                                <Tag className="w-3 h-3 inline mr-1" />
                                {post.category}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Engagement stats */}
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1 text-red-400" />
                              {post.likes?.length || 0}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-4 h-4 mr-1 text-blue-400" />
                              {post.reviews?.length || post.comments?.length || 0}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewPost(post._id)}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button 
                            onClick={() => handleEditPost(post._id, postType)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post._id, postType)}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'food' ? (
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  ) : activeTab === 'advertisement' ? (
                    <Megaphone className="w-8 h-8 text-gray-400" />
                  ) : (
                    <Plus className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No {activeTab === 'all' ? 'posts' : activeTab === 'food' ? 'food items' : 'advertisements'} yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first {activeTab === 'food' ? 'food item' : activeTab === 'advertisement' ? 'advertisement' : 'post'} to get started
                </p>
                <button
                  onClick={() => navigate('/CreateFood')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard