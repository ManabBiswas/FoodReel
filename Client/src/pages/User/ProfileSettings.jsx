import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig, multipartConfig } from '../../config/Api'
import getProfileImageUrl from '../../utils/profileImage'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import { 
  User, Mail, Phone, Save, ArrowLeft, Camera, Upload, 
  Loader2, Eye, EyeOff, Lock, Trash2,  Plus, Edit2, MapPin, SlidersHorizontal, Check
} from 'lucide-react'

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'delivery', label: 'Delivery Addresses', icon: MapPin },
  { id: 'address', label: 'Billing Address', icon: Mail }
]

const fieldClass =
  'w-full px-4 py-3 rounded-xl border border-[var(--color-border-medium)] bg-white font-sans text-base text-[var(--color-text-base)] outline-none transition-[border-color,box-shadow] duration-160 ease-out focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(255,106,0,0.18)]'
const labelClass =
  'mb-2 block font-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-sans text-sm font-bold text-[#fffcef] transition-opacity duration-160 ease-out hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-medium)] bg-white px-6 py-3 font-sans text-sm font-bold text-[var(--color-text-muted)] transition-[border-color,color] duration-160 ease-out hover:border-[var(--color-primary)] hover:text-[var(--color-text-base)]'

const preferenceTileClass =
  'group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--color-border-light)] bg-white px-3.5 py-2.5 font-sans text-sm font-semibold text-[var(--color-text-base)] transition-[border-color,background-color,box-shadow,transform] duration-160 ease-out hover:border-[var(--color-primary)] hover:bg-[#fffaf3] active:scale-[0.98] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[#fff3e6] has-[:checked]:shadow-[0_4px_12px_rgba(255,106,0,0.12)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[rgba(255,106,0,0.35)] has-[:focus-visible]:ring-offset-2'

const PreferenceCheck = ({ selected }) => (
  <span
    aria-hidden="true"
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[opacity,scale,background-color,border-color,color] duration-160 ease-out ${
      selected
        ? 'scale-100 opacity-100 border-[var(--color-primary)] bg-[var(--color-primary)] text-[#1a1208]'
        : 'scale-75 opacity-0 border-transparent bg-transparent text-transparent'
    }`}
  >
    <Check className="h-3 w-3" strokeWidth={3} />
  </span>
)

const ProfileSettings = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const navigate = useNavigate()
  const tabBarRef = useRef(null)
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false })

  // Sliding tab indicator — transform-only, interruptible, origin = active tab.
  // Re-measures when the loading screen unmounts, the bar resizes, or fonts settle.
  useLayoutEffect(() => {
    let cancelled = false
    const update = () => {
      if (cancelled) return
      const el = tabRefs.current[activeTab]
      const barEl = tabBarRef.current
      if (!el || !barEl) return
      const bar = barEl.getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      setIndicator({
        left: rect.left - bar.left - barEl.clientLeft + barEl.scrollLeft,
        width: rect.width,
        visible: true
      })
    }
    update()
    const barEl = tabBarRef.current
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (barEl) observer?.observe(barEl)
    Object.values(tabRefs.current).forEach((el) => el && observer?.observe(el))
    window.addEventListener('resize', update)
    document.fonts?.ready.then(update).catch(() => {})
    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeTab, loading])

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    mobile: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [preferences, setPreferences] = useState({
    cuisine: [],
    dietaryRestrictions: [],
    spiceLevel: 'medium'
  })
  const [addresses, setAddresses] = useState([])
  const [editingAddress, setEditingAddress] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    country: '',
    isDefault: false
  })
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pinCode: '',
    country: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.auth.userProfile, axiosConfig)
      
      if (response.data) {
        setUser(response.data)
        setBasicInfo({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          mobile: response.data.mobile || ''
        })
        setPreferences(response.data.preferences || {
          cuisine: [],
          dietaryRestrictions: [],
          spiceLevel: 'medium'
        })
        setAddress(response.data.address || {
          street: '',
          city: '',
          state: '',
          pinCode: '',
          country: ''
        })
        
        // Fetch delivery addresses
        fetchDeliveryAddresses()
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        showError('Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])
  
  const fetchDeliveryAddresses = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.user.address, axiosConfig)
      setAddresses(response.data.addresses || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      // Don't show error toast, addresses might not exist yet
      setAddresses([])
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  const handleBasicInfoUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    try {
      const response = await axios.put(
        API_ENDPOINTS.auth.userProfile,
        basicInfo,
        axiosConfig
      )

      if (response.data.user) {
        setUser(response.data.user)
        showSuccess('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showError(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match')
      setUpdating(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      showError('New password must be at least 6 characters long')
      setUpdating(false)
      return
    }

    try {
      await axios.put(
        API_ENDPOINTS.auth.userChangePassword,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        axiosConfig
      )

      showSuccess('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Error changing password:', error)
      showError(error.response?.data?.error || 'Failed to change password')
    } finally {
      setUpdating(false)
    }
  }

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    try {
      await axios.put(
        API_ENDPOINTS.user.preferences,
        preferences,
        axiosConfig
      )

      showSuccess('Preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      showError(error.response?.data?.error || 'Failed to update preferences')
    } finally {
      setUpdating(false)
    }
  }

  const togglePreference = (key, value) => {
    setPreferences((prev) => {
      const current = prev[key] || []
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value]
      }
    })
  }

  const handleAddressUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    try {
      await axios.put(
        API_ENDPOINTS.user.address,
        address,
        axiosConfig
      )

      showSuccess('Address updated successfully!')
    } catch (error) {
      console.error('Error updating address:', error)
      showError(error.response?.data?.error || 'Failed to update address')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleAddDeliveryAddress = async (e) => {
    e.preventDefault()
    setUpdating(true)
    
    try {
      const response = await axios.post(
        API_ENDPOINTS.user.address,
        addressForm,
        axiosConfig
      )
      
      showSuccess('Delivery address added successfully!')
      setAddresses(response.data.addresses || [])
      setShowAddressForm(false)
      setAddressForm({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        country: '',
        isDefault: false
      })
    } catch (error) {
      console.error('Error adding address:', error)
      showError(error.response?.data?.error || 'Failed to add address')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleEditDeliveryAddress = async (e) => {
    e.preventDefault()
    setUpdating(true)
    
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.user.address}/${editingAddress}`,
        addressForm,
        axiosConfig
      )
      
      showSuccess('Delivery address updated successfully!')
      setAddresses(response.data.addresses || [])
      setEditingAddress(null)
      setShowAddressForm(false)
      setAddressForm({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        country: '',
        isDefault: false
      })
    } catch (error) {
      console.error('Error updating address:', error)
      showError(error.response?.data?.error || 'Failed to update address')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleDeleteDeliveryAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return
    }
    
    setUpdating(true)
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.user.address}/${addressId}`,
        axiosConfig
      )
      
      showSuccess('Address deleted successfully!')
      setAddresses(response.data.addresses || [])
    } catch (error) {
      console.error('Error deleting address:', error)
      showError(error.response?.data?.error || 'Failed to delete address')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleSetDefaultAddress = async (addressId) => {
    setUpdating(true)
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.user.address}/${addressId}/default`,
        {},
        axiosConfig
      )
      
      showSuccess('Default address updated!')
      setAddresses(response.data.addresses || [])
    } catch (error) {
      console.error('Error setting default address:', error)
      showError(error.response?.data?.error || 'Failed to set default address')
    } finally {
      setUpdating(false)
    }
  }
  
  const startEditAddress = (address) => {
    setEditingAddress(address._id)
    setAddressForm({
      label: address.label || 'Home',
      street: address.street || address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      pinCode: address.pinCode || address.pincode || '',
      country: address.country || '',
      isDefault: address.isDefault || false
    })
    setShowAddressForm(true)
  }
  
  const cancelAddressForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
    setAddressForm({
      label: 'Home',
      street: '',
      city: '',
      state: '',
      pinCode: '',
      country: '',
      isDefault: false
    })
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profileImage', file)

    setUpdating(true)
    try {
      const response = await axios.post(
        API_ENDPOINTS.user.profilePicture,
        formData,
        multipartConfig
      )

      if (response.data.profileImage) {
        setUser({ ...user, profileImage: response.data.profileImage })
        showSuccess('Profile picture updated successfully!')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      showError(error.response?.data?.error || 'Failed to upload profile picture')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f2e8' }}>
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4 sk-surface">
          <Loader2 className="animate-spin h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <span className="font-sans text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Loading your settings…
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-[#fffcef]" style={{ background: '#f7f2e8' }}>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile"
            className="pressable mb-4 inline-flex items-center gap-2 rounded-full bg-[#ffe8cc] px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-widest text-[#e55a00]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to profile
          </Link>
          <h1 className="font-serif text-4xl font-black leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Profile settings<span className="italic text-[var(--color-primary)]">.</span>
          </h1>
          <p className="mt-2 max-w-md font-sans text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Your name, contact, taste and delivery addresses — in one place.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Tab Navigation — pill with sliding indicator, press feedback */}
        <div
          ref={tabBarRef}
          role="tablist"
          aria-label="Profile settings sections"
          className="hide-scrollbar relative mb-6 flex overflow-x-auto rounded-full border border-[var(--color-border-light)] bg-white/80 p-1 backdrop-blur"
        >
          <div
            aria-hidden="true"
            className="tab-slide pointer-events-none absolute left-0 top-1 bottom-1 rounded-full bg-[var(--color-primary)]"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
              opacity: indicator.visible ? 1 : 0
            }}
          />
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const showFallbackFill = active && !indicator.visible
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el }}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`pressable relative z-10 flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 font-sans text-sm font-bold cursor-pointer ${
                  showFallbackFill ? 'bg-[var(--color-primary)]' : ''
                }`}
                style={{
                  color: active ? '#fffcef' : 'var(--color-text-muted)'
                }}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

      {/* Tab Content — keyed panel re-enters on every switch */}
      <div key={activeTab} className="panel-enter sk-surface sk-texture p-6 sm:p-8" role="tabpanel">
          {activeTab === 'basic' && (
            <form onSubmit={handleBasicInfoUpdate} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-[var(--color-border-light)] bg-white/70 p-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#ffe8cc] ring-4 ring-white shadow-[0_8px_20px_rgba(26,18,8,0.12)]">
                    {getProfileImageUrl(user) ? (
                      <img 
                        src={getProfileImageUrl(user)} 
                        alt="Profile" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <User className="h-8 w-8 text-[#e55a00]" aria-hidden="true" />
                    )}
                  </div>
                  <label aria-label="Upload profile picture" className="pressable absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-[#fffcef] shadow cursor-pointer">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="sk-label font-sans text-sm font-bold">Profile Picture</h3>
                  <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>Upload a new profile picture</p>
                </div>
              </div>

              {/* Basic Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className={labelClass}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={basicInfo.firstName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, firstName: e.target.value })}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelClass}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={basicInfo.lastName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, lastName: e.target.value })}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className={`${fieldClass} cursor-not-allowed !bg-[#f3f1ed] !text-[var(--color-text-faint)]`}
                  />
                  <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>Email cannot be changed</p>
                </div>
                <div>
                  <label htmlFor="mobile" className={labelClass}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    value={basicInfo.mobile}
                    onChange={(e) => setBasicInfo({ ...basicInfo, mobile: e.target.value })}
                    className={fieldClass}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className={`${primaryBtn} pressable`}
              >
                {updating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div>
                <label htmlFor="currentPassword" className={labelClass}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className={`${fieldClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPasswords.current ? 'Hide current password' : 'Show current password'}
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="pressable absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 transition-colors hover:text-[var(--color-text-base)]"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-[var(--color-text-faint)]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[var(--color-text-faint)]" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className={labelClass}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={`${fieldClass} pr-10`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showPasswords.new ? 'Hide new password' : 'Show new password'}
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="pressable absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 transition-colors hover:text-[var(--color-text-base)]"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-[var(--color-text-faint)]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[var(--color-text-faint)]" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={`${fieldClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="pressable absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 transition-colors hover:text-[var(--color-text-base)]"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-[var(--color-text-faint)]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[var(--color-text-faint)]" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className={`${primaryBtn} pressable`}
              >
                {updating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesUpdate} className="space-y-6 max-w-2xl">
              <div>
                <label className={labelClass}>
                  Favorite Cuisines
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {['Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese', 'American', 'Mediterranean'].map((cuisine) => {
                    const selected = preferences.cuisine?.includes(cuisine)
                    return (
                      <label key={cuisine} className={preferenceTileClass}>
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={() => togglePreference('cuisine', cuisine)}
                          className="sr-only"
                        />
                        <span>{cuisine}</span>
                        <PreferenceCheck selected={Boolean(selected)} />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Dietary Restrictions
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free', 'Keto'].map((restriction) => {
                    const selected = preferences.dietaryRestrictions?.includes(restriction)
                    return (
                      <label key={restriction} className={preferenceTileClass}>
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={() => togglePreference('dietaryRestrictions', restriction)}
                          className="sr-only"
                        />
                        <span>{restriction}</span>
                        <PreferenceCheck selected={Boolean(selected)} />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="spiceLevel" className={labelClass}>
                  Preferred Spice Level
                </label>
                <select
                  id="spiceLevel"
                  value={preferences.spiceLevel || 'medium'}
                  onChange={(e) => setPreferences({ ...preferences, spiceLevel: e.target.value })}
                  className={fieldClass}
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="extra-hot">Extra Hot</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updating}
                className={`${primaryBtn} pressable`}
              >
                {updating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="sk-label font-serif text-2xl font-black tracking-[-0.02em]">Delivery Addresses</h2>
                  <p className="mt-1 max-w-md font-sans text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    These appear as selectable options at checkout. Your default is selected automatically.
                  </p>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="pressable hover-gated inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 font-sans text-sm font-bold text-[#fffcef] transition-opacity duration-160 ease-out hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Address
                  </button>
                )}
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <form 
                  onSubmit={editingAddress ? handleEditDeliveryAddress : handleAddDeliveryAddress}
                  className="panel-enter space-y-4 rounded-2xl border border-[rgba(255,106,0,0.3)] bg-[#fffdf8] p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="sk-label font-serif text-lg font-bold">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <button
                      type="button"
                      aria-label="Close address form"
                      onClick={cancelAddressForm}
                      className="pressable rounded-full p-2 transition-colors hover:bg-[#ffe8cc] hover:text-[#e55a00]"
                    >
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="addressLabel" className={labelClass}>
                        Label <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="addressLabel"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        className={fieldClass}
                        required
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border-light)] bg-white px-3 py-2.5 transition-[border-color] duration-160 ease-out has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[#fff7ed] hover:border-[var(--color-primary)]">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--color-border-medium)] accent-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(255,106,0,0.3)]"
                        />
                        <span className="font-sans text-sm text-[var(--color-text-base)]">Set as default address</span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="deliveryStreet" className={labelClass}>
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryStreet"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        className={fieldClass}
                        placeholder="House/Flat no., Building name, Street"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryCity" className={labelClass}>
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryCity"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className={fieldClass}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryState" className={labelClass}>
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryState"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className={fieldClass}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryZip" className={labelClass}>
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryZip"
                        value={addressForm.pinCode}
                        onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                        className={fieldClass}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryCountry" className={labelClass}>
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryCountry"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className={fieldClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className={`${primaryBtn} pressable`}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" />
                          {editingAddress ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {editingAddress ? 'Update Address' : 'Add Address'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAddressForm}
                      className={secondaryBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white/60 px-6 py-12 text-center">
                    <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe8cc]">
                      <MapPin className="h-6 w-6 text-[#e55a00]" aria-hidden="true" />
                    </span>
                    <p className="sk-label font-serif text-lg font-bold">No delivery addresses yet</p>
                    <p className="mt-1 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>Add your first delivery address to get started</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`stagger-in rounded-2xl border p-4 transition-[border-color,background-color] duration-160 ease-out ${
                        addr.isDefault
                          ? 'border-[var(--color-primary)] bg-[#fff7ed]'
                          : 'border-[var(--color-border-light)] bg-white hover:border-[var(--color-primary)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                            <span className="font-sans font-bold text-[var(--color-text-base)]">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-widest text-[#fffcef]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-sm leading-relaxed text-[var(--color-text-muted)]">
{/* The server normalizes to addressLine1/pincode (user.controller.js normalizeAddressInput), so reading street/pinCode here rendered blank. Fall back to the legacy names for old records. */}

                              {addr.addressLine1 || addr.street}
                              <br />
                              {addr.city}, {addr.state} {addr.pincode || addr.pinCode}
                            <br />
                            {addr.country}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              disabled={updating}
                              className="pressable rounded-lg px-3 py-2 font-sans text-xs font-bold text-[#e55a00] transition-colors hover:bg-[#ffe8cc] disabled:opacity-50"
                              title="Set as default"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => startEditAddress(addr)}
                            disabled={updating}
                            aria-label={`Edit ${addr.label} address`}
                            className="pressable rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[#ffe8cc] hover:text-[#e55a00] disabled:opacity-50"
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeliveryAddress(addr._id)}
                            disabled={updating}
                            aria-label={`Delete ${addr.label} address`}
                            className="pressable rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <form onSubmit={handleAddressUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label htmlFor="street" className={labelClass}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="state" className={labelClass}>
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="pinCode" className={labelClass}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="pinCode"
                    value={address.pinCode}
                    onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className={`${primaryBtn} pressable`}
              >
                {updating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Address
                  </>
                )}
              </button>
            </form>
          )}
      </div>
      </main>
      <Footer />
    </div>
  )
}

export default ProfileSettings