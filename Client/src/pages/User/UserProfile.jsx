import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import { LogOut, User, Mail, Phone, Loader2, Settings, Plus, Heart, Bookmark, Grid3X3, Calendar, Edit3, Camera, Shield, MessageCircle } from 'lucide-react'

const UserProfile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [savedItems, setSavedItems] = useState([]) // Combined saved foods and posts
  const [bioText, setBioText] = useState('')
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [savingBio, setSavingBio] = useState(false)
  const navigate = useNavigate()

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.auth.userProfile, axiosConfig)

      if (response.data) {
        setUser(response.data)

        // Combine savedFoods and savedPosts into one array
        const combinedSaved = [
          ...(response.data.savedFoods || []).map(food => ({
            ...food,
            itemType: 'food'
          })),
          ...(response.data.savedPosts || []).map(post => ({
            ...post,
            itemType: 'post'
          }))
        ]
        setSavedItems(combinedSaved)
        setError('')

        // Fetch user's posts
        try {
          const postsResponse = await axios.get(API_ENDPOINTS.userPost.myPosts, axiosConfig)
          if (postsResponse.data?.data) {
            setUserPosts(postsResponse.data.data)
          }
        } catch (postsError) {
          console.error('Error fetching user posts:', postsError)
        }
      } else {
        navigate('/login')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        showError('Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const handleEditBio = () => {
    setBioText(user?.bio || '')
    setIsEditingBio(true)
  }

  const handleSaveBio = async () => {
    try {
      setSavingBio(true)
      const response = await axios.put(
        API_ENDPOINTS.auth.updateProfile,
        { bio: bioText },
        axiosConfig
      )
      
      if (response.data?.user) {
        setUser(prev => ({ ...prev, bio: response.data.user.bio }))
        setIsEditingBio(false)
        showSuccess('Bio updated successfully')
      }
    } catch (error) {
      console.error('Error updating bio:', error)
      showError('Failed to update bio')
    } finally {
      setSavingBio(false)
    }
  }

  const handleCancelBio = () => {
    setBioText(user?.bio || '')
    setIsEditingBio(false)
  }

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleLogout = async () => {
    try {
      await axios.post(API_ENDPOINTS.auth.userLogout, {}, axiosConfig)
      showSuccess('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      showError('Logout failed, please try again')
      // Navigate anyway after showing error
      setTimeout(() => navigate('/login'), 1000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="animate-spin h-6 w-6 mr-3 text-blue-600" />
          Loading profile...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white min-h-screen">
        <Navbar />

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Header/Profile Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Profile Picture */}
            <div className="flex justify-center sm:justify-start">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-600 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="mb-4">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-2">
                  <button onClick={handleEditBio} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center cursor-pointer" style={{ width: 'auto' }}>
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <Link
                    to="/profile/settings"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-4 text-center sm:text-left">
            <div className="text-sm text-gray-900 leading-relaxed mb-3">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.substring(0, 150))}
                    placeholder="Write something about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                    maxLength="150"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{bioText.length}/150</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelBio}
                        disabled={savingBio}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50 hover:cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={savingBio}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1 hover:cursor-pointer"
                      >
                        {savingBio ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {user?.bio || 'No bio yet. Click edit to add one.'}
                  </p>
                  <button
                    onClick={handleEditBio}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full"
                  >
                    <Edit3 className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-1 text-xs text-gray-600 flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{user.mobile}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around sm:justify-center sm:gap-28 mb-4 text-sm">
            <div className="text-center">
              <span className="font-semibold text-gray-900 block">{userPosts.length}</span>
              <span className="text-gray-600 text-xs">posts</span>
            </div>
            <div className="text-center">
              <span className="font-semibold text-gray-900 block">{user?.followersCount || 0}</span>
              <span className="text-gray-600 text-xs">followers</span>
            </div>
            <div className="text-center">
              <span className="font-semibold text-gray-900 block">{user?.followingCount || 0}</span>
              <span className="text-gray-600 text-xs">following</span>
            </div>
          </div>

          {/* Create Post Button */}
          <div className="flex justify-center sm:justify-start mb-4">
            <button
              onClick={() => navigate('/create-post')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-200">
          <div className="flex justify-center">
            <div className="flex w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 sm:px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer ${activeTab === 'posts'
                  ? 'text-gray-900 border-t-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 sm:px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer ${activeTab === 'saved'
                  ? 'text-gray-900 border-t-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved ({savedItems.length})</span>
                <span className="sm:hidden">{savedItems.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === 'posts' && (
            <div className="px-4 py-6">
              {userPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userPosts.map((post) => (
                    <div key={post._id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group">
                      {post.type === 'video' ? (
                        <video
                          src={post.video}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 text-white text-sm space-y-1 text-center">
                          <div className="flex items-center justify-center gap-4">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" fill="white" />
                              {post.likeCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" fill="white" />
                              {post.commentCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <Grid3X3 className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-500 mb-4">Share your food experiences with the community</p>
                  <button
                    onClick={() => navigate('/create-post')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Post
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="px-4 py-6">
              {savedItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {savedItems.map((item) => (
                    <div key={item._id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group">
                      {item.itemType === 'food' ? (
                        <img
                          src={item.image || item.video}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={item.image || item.video}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate">
                          {item.itemType === 'food' ? item.name : item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">No Saved Items</h3>
                  <p className="text-gray-500">Save food items and posts you want to revisit later</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile