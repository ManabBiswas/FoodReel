import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { showSuccess, showError } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig, multipartConfig } from '../../config/Api'
import { 
  User, Mail, Phone, Save, ArrowLeft, Camera, Upload, 
  Loader2, Eye, EyeOff, Lock, Trash2, AlertTriangle, Plus, Edit2, MapPin
} from 'lucide-react'

const ProfileSettings = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const navigate = useNavigate()

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
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pinCode: address.pinCode || '',
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center">
          <Loader2 className="animate-spin h-6 w-6 mr-3 text-blue-600" />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/profile" 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {[
              { id: 'basic', label: 'Basic Info', icon: User },
              { id: 'password', label: 'Password', icon: Lock },
              { id: 'preferences', label: 'Preferences', icon: User },
              { id: 'delivery', label: 'Delivery Addresses', icon: MapPin },
              { id: 'address', label: 'Address', icon: Mail }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'basic' && (
            <form onSubmit={handleBasicInfoUpdate} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Profile Picture</h3>
                  <p className="text-xs text-gray-500 mt-1">Upload a new profile picture</p>
                </div>
              </div>

              {/* Basic Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={basicInfo.firstName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={basicInfo.lastName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    value={basicInfo.mobile}
                    onChange={(e) => setBasicInfo({ ...basicInfo, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
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
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Favorite Cuisines
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese', 'American', 'Mediterranean'].map((cuisine) => (
                    <label key={cuisine} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.cuisine?.includes(cuisine)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences({
                              ...preferences,
                              cuisine: [...(preferences.cuisine || []), cuisine]
                            })
                          } else {
                            setPreferences({
                              ...preferences,
                              cuisine: preferences.cuisine?.filter(c => c !== cuisine) || []
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dietary Restrictions
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free', 'Keto'].map((restriction) => (
                    <label key={restriction} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.dietaryRestrictions?.includes(restriction)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences({
                              ...preferences,
                              dietaryRestrictions: [...(preferences.dietaryRestrictions || []), restriction]
                            })
                          } else {
                            setPreferences({
                              ...preferences,
                              dietaryRestrictions: preferences.dietaryRestrictions?.filter(r => r !== restriction) || []
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{restriction}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="spiceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Spice Level
                </label>
                <select
                  id="spiceLevel"
                  value={preferences.spiceLevel || 'medium'}
                  onChange={(e) => setPreferences({ ...preferences, spiceLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
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
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delivery Addresses</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your delivery addresses for faster checkout</p>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                )}
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <form 
                  onSubmit={editingAddress ? handleEditDeliveryAddress : handleAddDeliveryAddress}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-gray-900">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <button
                      type="button"
                      onClick={cancelAddressForm}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="addressLabel" className="block text-sm font-medium text-gray-700 mb-1">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="addressLabel"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as default address</span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="deliveryStreet" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryStreet"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="House/Flat no., Building name, Street"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryCity" className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryCity"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryState" className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryState"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryZip" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryZip"
                        value={addressForm.pinCode}
                        onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="deliveryCountry" className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="deliveryCountry"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
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
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-2">No delivery addresses yet</p>
                    <p className="text-sm text-gray-500">Add your first delivery address to get started</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`border rounded-lg p-4 ${
                        addr.isDefault
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold text-gray-900">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {addr.street}
                            <br />
                            {addr.city}, {addr.state} {addr.pinCode}
                            <br />
                            {addr.country}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              disabled={updating}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                              title="Set as default"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => startEditAddress(addr)}
                            disabled={updating}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                            title="Edit address"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeliveryAddress(addr._id)}
                            disabled={updating}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete address"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <form onSubmit={handleAddressUpdate} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="pinCode"
                    value={address.pinCode}
                    onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
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
      </div>
    </div>
  )
}

export default ProfileSettings