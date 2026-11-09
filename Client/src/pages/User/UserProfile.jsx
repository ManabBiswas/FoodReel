import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { useAuth } from '../../hooks/useAuth'
import Navbar from '../../Components/Navbar'
import getProfileImageUrl from '../../utils/profileImage'
import FoodMedia from '../../Components/FoodMedia'
import { getImageKitThumbnail } from '../../utils/imagekit.utils'
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
  const { logout } = useAuth()

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
      // Context logout: clears the cookie AND auth state so route guards
      // don't bounce the "logged-in" user back to '/'.
      await logout()
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f7f2e8' }}>
        <div className="sk-surface flex items-center gap-3 rounded-2xl px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" aria-hidden="true" />
          <span className="font-sans text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Loading your profile…
          </span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f2e8' }}>
      <Navbar />
      <div className="mx-auto min-h-screen bg-[#fffdf8] px-4 font-sans text-[var(--color-text-base)] sm:px-6 lg:px-8">

        {/* Error Message */}
        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Header/Profile Section */}
        <div
          className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
          style={{ background: 'radial-gradient(ellipse at top, rgba(255,184,0,0.14), transparent 68%)' }}
        >
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Profile Picture */}
            <div className="flex justify-center sm:justify-start">
              <div
                className="relative h-24 w-24 flex-shrink-0 rounded-full p-[3px] shadow-[0_10px_28px_rgba(255,106,0,0.22)] sm:h-32 sm:w-32 md:h-36 md:w-36"
                style={{ background: 'conic-gradient(from 140deg, #ff6a00, #ffb800, #e55a00, #ff6a00)' }}
              >
                <div className="h-full w-full rounded-full bg-[#fffdf8] p-1">
                  <div className="group relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#ffe8cc]">
                    {getProfileImageUrl(user) ? (
                      <img
                        src={getProfileImageUrl(user)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-[#e55a00] sm:h-12 sm:w-12" aria-hidden="true" />
                    )}
                    {/* Change-photo affordance */}
                    <Link
                      to="/profile/settings"
                      aria-label="Change profile photo"
                      title="Change profile photo"
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-[#1a1208]/50 opacity-0 transition-opacity duration-200 focus:opacity-100 group-hover:opacity-100"
                    >
                      <Camera className="h-7 w-7 text-[#fffcef] md:h-8 md:w-8" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-center gap-2 sm:justify-start">
                  <h2 className="truncate font-serif text-3xl font-black leading-tight tracking-[-0.02em] text-[var(--color-text-base)] sm:text-4xl">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]" title="Verified account">
                    <Shield className="h-3 w-3 text-[#1a1208]" aria-hidden="true" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col justify-center gap-2 sm:flex-row sm:justify-start">
                  <button onClick={handleEditBio} className="pressable inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-sans text-sm font-bold text-[#fffcef] transition-opacity duration-160 ease-out hover:opacity-90">
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit Profile
                  </button>
                  <Link
                    to="/profile/settings"
                    aria-label="Settings"
                    title="Settings"
                    className="pressable inline-flex items-center justify-center rounded-xl border border-[var(--color-border-medium)] bg-white px-3 py-2 text-[var(--color-text-base)] transition-[border-color,background-color] duration-160 ease-out hover:border-[var(--color-primary)] hover:bg-[#fff3e6]"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    aria-label="Log out"
                    title="Log out"
                    className="pressable inline-flex items-center justify-center rounded-xl border border-[#f5c2bd] bg-[#fef3f2] px-3 py-2 text-[#b42318] transition-colors duration-160 ease-out hover:bg-[#fee4e2]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-5 text-center sm:text-left">
            <div className="mb-3 font-sans text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.substring(0, 150))}
                    placeholder="Write something about yourself..."
                    className="w-full resize-none rounded-xl border border-[var(--color-border-medium)] bg-white px-4 py-3 font-sans text-sm text-[var(--color-text-base)] outline-none transition-[border-color,box-shadow] duration-160 ease-out focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(255,106,0,0.18)]"
                    rows="3"
                    maxLength="150"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs tabular-nums text-[var(--color-text-faint)]">{bioText.length}/150</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelBio}
                        disabled={savingBio}
                        className="pressable rounded-xl border border-[var(--color-border-medium)] bg-white px-3 py-1.5 font-sans text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-text-base)] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={savingBio}
                        className="pressable inline-flex items-center gap-1 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 font-sans text-sm font-bold text-[#fffcef] transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {savingBio ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
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
                <div className="group relative">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                    {user?.bio || 'No bio yet. Click edit to add one.'}
                  </p>
                  <button
                    onClick={handleEditBio}
                    aria-label="Edit bio"
                    className="absolute -right-1 -top-1 rounded-full p-1.5 text-[var(--color-text-faint)] opacity-100 transition-[opacity,background-color,color] hover:bg-[#fff3e6] hover:text-[var(--color-primary)] focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-col items-center space-y-1.5 font-sans text-xs text-[var(--color-text-muted)] sm:items-start">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-faint)]" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-faint)]" aria-hidden="true" />
                  <span>{user.mobile}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-faint)]" aria-hidden="true" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-5 flex justify-around rounded-2xl border border-[var(--color-border-light)] bg-white/70 px-4 py-4 text-sm sm:justify-center sm:gap-28">
            <div className="text-center">
              <span className="block font-serif text-2xl font-bold leading-none text-[var(--color-text-base)]">{userPosts.length}</span>
              <span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">posts</span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-2xl font-bold leading-none text-[var(--color-text-base)]">{user?.followersCount || 0}</span>
              <span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">followers</span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-2xl font-bold leading-none text-[var(--color-text-base)]">{user?.followingCount || 0}</span>
              <span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">following</span>
            </div>
          </div>

          {/* Create Post Button */}
          <div className="mb-5 flex justify-center sm:justify-start">
            <button
              onClick={() => navigate('/create-post')}
              className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 font-sans text-sm font-bold text-[#fffcef] transition-opacity duration-160 ease-out hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Post
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-[var(--color-border-light)]">
          <div className="flex justify-center">
            <div role="tablist" aria-label="Profile sections" className="flex w-full sm:w-auto">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'posts'}
                onClick={() => setActiveTab('posts')}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-t-2 px-4 py-3 font-sans text-xs font-bold uppercase tracking-widest transition-[color,border-color,background-color] duration-160 ease-out sm:flex-initial sm:px-6 ${
                  activeTab === 'posts'
                    ? 'border-[var(--color-primary)] bg-[#fffaf3] text-[var(--color-text-base)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:bg-[#fffaf3] hover:text-[var(--color-text-base)]'
                }`}
              >
                <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Posts</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'saved'}
                onClick={() => setActiveTab('saved')}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-t-2 px-4 py-3 font-sans text-xs font-bold uppercase tracking-widest transition-[color,border-color,background-color] duration-160 ease-out sm:flex-initial sm:px-6 ${
                  activeTab === 'saved'
                    ? 'border-[var(--color-primary)] bg-[#fffaf3] text-[var(--color-text-base)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:bg-[#fffaf3] hover:text-[var(--color-text-base)]'
                }`}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Saved ({savedItems.length})</span>
                <span className="sm:hidden">{savedItems.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-8" role="tabpanel">
          {activeTab === 'posts' && (
            <div className="px-4 py-6">
              {userPosts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                  {userPosts.map((post) => (
                    <div
                      key={post._id}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-[#efe7d8] shadow-[0_4px_14px_rgba(26,18,8,0.06)] transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(26,18,8,0.12)]"
                    >
                      {post.type === 'video' ? (
                        <video
                          src={post.video}
                          poster={getImageKitThumbnail(post.video) || undefined}
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-[#1a1208]/0 transition-colors duration-200 group-hover:bg-[#1a1208]/25">
                        <div className="space-y-1 text-center font-sans text-xs font-semibold text-[#fffcef] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <div className="flex items-center justify-center gap-4">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                              {post.likeCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                              {post.commentCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white/50 px-4 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3e6] ring-1 ring-[#ffd9b8]">
                    <Grid3X3 className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-serif text-2xl font-bold text-[var(--color-text-base)]">No Posts Yet</h3>
                  <p className="mb-5 font-sans text-sm text-[var(--color-text-muted)]">
                    Share your food experiences with the community
                  </p>
                  <button
                    onClick={() => navigate('/create-post')}
                    className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-sans text-sm font-bold text-[#fffcef] transition-opacity hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Create Your First Post
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="px-4 py-6">
              {savedItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                  {savedItems.map((item) => (
                    <div
                      key={item._id}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-[#efe7d8] shadow-[0_4px_14px_rgba(26,18,8,0.06)] transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(26,18,8,0.12)]"
                    >
                      {item.itemType === 'food' ? (
                        <FoodMedia
                          foodItem={item}
                          className="h-full w-full"
                          imgClass="h-full w-full object-cover"
                          alt={item.name}
                        />
                      ) : (
                        <img
                          src={getImageKitThumbnail(item.video || item.image) || ''}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1208]/75 to-transparent p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <p className="truncate font-sans text-xs font-semibold text-[#fffcef]">
                          {item.itemType === 'food' ? item.name : item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white/50 px-4 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3e6] ring-1 ring-[#ffd9b8]">
                    <Bookmark className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-serif text-2xl font-bold text-[var(--color-text-base)]">No Saved Items</h3>
                  <p className="mb-5 font-sans text-sm text-[var(--color-text-muted)]">
                    Tap the bookmark on any reel to save it here for later
                  </p>
                  <button
                    onClick={() => navigate('/reels')}
                    className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-sans text-sm font-bold text-[#fffcef] transition-opacity hover:opacity-90"
                  >
                    Browse reels
                  </button>
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