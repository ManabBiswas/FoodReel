import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/Navbar'
import UserPosts from '../../Components/UserPosts'
import { LogOut, User, Mail, Phone, Loader2, Settings, Plus, Heart, Bookmark, MapPin, Grid3X3, Calendar, Edit3, Camera, Shield } from 'lucide-react'

const UserProfile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/auth/verify', { withCredentials: true })
        setUser(res.data.user)
        // no local editing state; just keep the server user
      } catch (err) {
        console.error('Unable to fetch user:', err)
        // Not authenticated -> redirect to login
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:3000/api/auth/user/logout', { withCredentials: true })
    } catch (err) {
      console.warn('Logout request failed:', err)
    } finally {
      // Ensure client navigates to login page
      navigate('/login')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center">
        <Loader2 className="animate-spin h-6 w-6 mr-3 text-blue-600" />
        Loading profile...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white min-h-screen">
        <Navbar />
        {/* Header/Profile Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Profile Picture */}
            <div className="flex justify-center sm:justify-start">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-600" />
                    {/* Camera overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              {/* Name and Status Row */}
              <div className="mb-4">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Action Buttons - Mobile: Column, Desktop: Row */}
                <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-2">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center cursor-pointer">
                    <Settings className="w-4 h-4" />
                  </button>
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
              <p className="font-medium">🍕 Food Enthusiast</p>
              <p>Exploring culinary delights one bite at a time</p>
              <p>📍 Living the food dream in the city</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-1 text-xs text-gray-600 flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{user?.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>Joined September 2025</span>
              </div>
            </div>
          </div>


          {/* Create Post Button - Positioned below stats */}
          <div className="flex justify-center sm:justify-start mb-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md">
              <Plus className="w-4 h-4" />
              Create Post
            </button>
          </div>
        </div>

          {/* Stats */}
          <div className="flex justify-around sm:justify-center sm:gap-28 mb-4 text-sm">
            <div className="text-center">
              <span className="font-semibold text-gray-900 block">42</span>
              <span className="text-gray-600 text-xs">orders</span>
            </div>
            <div className="text-center">
              <span className="font-semibold text-gray-900 block">18</span>
              <span className="text-gray-600 text-xs">reviews</span>
            </div>
            <div className="text-center">
              <span className="font-semibold text-gray-900 block">156</span>
              <span className="text-gray-600 text-xs">favorites</span>
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
                onClick={() => setActiveTab('profile')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 sm:px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer ${activeTab === 'profile'
                    ? 'text-gray-900 border-t-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 sm:px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer ${activeTab === 'favorites'
                    ? 'text-gray-900 border-t-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Favorites</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 sm:px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer ${activeTab === 'saved'
                    ? 'text-gray-900 border-t-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === 'posts' && (
            <UserPosts />
          )}

          {activeTab === 'profile' && (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="max-w-2xl mx-auto">
                {/* Activity Summary Card */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Activity Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Orders</span>
                      <span className="text-sm font-semibold text-gray-900">42</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reviews Given</span>
                      <span className="text-sm font-semibold text-gray-900">18</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Posts Created</span>
                      <span className="text-sm font-semibold text-gray-900">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Favorite Items</span>
                      <span className="text-sm font-semibold text-gray-900">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-semibold text-gray-900">Sep 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <Heart className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No Favorites Yet</h3>
              <p className="text-gray-500">Start exploring and heart your favorite food items</p>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No Saved Items</h3>
              <p className="text-gray-500">Save food items you want to order later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile