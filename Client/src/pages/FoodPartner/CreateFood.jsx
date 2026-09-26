import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { showWarning, showError, showLoading, updateToSuccess } from '../../utils/toast'
import { API_ENDPOINTS, multipartConfig } from '../../config/Api'
import { 
  UtensilsCrossed, 
  Upload, 
  Video, 
  Image as ImageIcon, 
  ArrowLeft, 
  Loader2, 
  X,
  Plus,
  Hash,
  Tag as TagIcon,
  ShoppingBag,
  Megaphone,
  IndianRupee,
  Clock,
  Calendar
} from 'lucide-react'
import Navbar from '../../Components/Navbar'
import ErrorBoundary from '../../Components/ErrorBoundary'

const CreateFood = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    postType: '', // 'food' or 'advertisement'
    name: '',
    description: '',
    type: 'image', // 'image' or 'video'
    tags: [],
    // Food-specific fields
    price: '',
    currency: 'INR',
    isAvailable: true,
    preparationTime: '',
    // Advertisement-specific fields
    promotionType: '',
    prices: {
      original: '',
      discounted: ''
    },
    validUntil: '',
    promoCode: ''
  })
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1) // 1: Post Type, 2: Details Form

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handlePostTypeSelect = (postType) => {
    setFormData(prev => ({ ...prev, postType }))
    setCurrentStep(2)
  }

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, type }))
    setFile(null)
    setFilePreview(null)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate file type
    const isImage = selectedFile.type.startsWith('image/')
    const isVideo = selectedFile.type.startsWith('video/')
    
    if (formData.type === 'image' && !isImage) {
      showWarning('Please select an image file')
      return
    }
    
    if (formData.type === 'video' && !isVideo) {
      showWarning('Please select a video file')
      return
    }

    // File size validation (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      showWarning('File size must be less than 5MB')
      return
    }

    setFile(selectedFile)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setFilePreview(reader.result)
    }
    reader.readAsDataURL(selectedFile)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!file) {
      newErrors.file = `${formData.type === 'image' ? 'Image' : 'Video'} is required`
    }

    // Food-specific validation
    if (formData.postType === 'food') {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'Valid price is required'
      }
      if (!formData.preparationTime.trim()) {
        newErrors.preparationTime = 'Preparation time is required'
      }
    }

    // Advertisement-specific validation
    if (formData.postType === 'advertisement') {
      if (!formData.promotionType) {
        newErrors.promotionType = 'Promotion type is required'
      }
      // For promotion types that require pricing, validate prices
      const promoTypesRequiringPrices = ['discount', 'sale', 'combo'];
      if (promoTypesRequiringPrices.includes(formData.promotionType)) {
        const original = parseFloat(formData.prices?.original || '')
        const discounted = parseFloat(formData.prices?.discounted || '')

        if (!original || isNaN(original) || original <= 0) {
          newErrors.originalPrice = 'Original price is required and must be positive'
        }
        if (!discounted || isNaN(discounted) || discounted <= 0) {
          newErrors.discountedPrice = 'Discounted price is required and must be positive'
        }
        if (!newErrors.discountedPrice && !newErrors.originalPrice && discounted >= original) {
          newErrors.discountedPrice = 'Discounted price must be less than original price'
        }
      }
      if (!formData.validUntil) {
        newErrors.validUntil = 'Valid until date is required'
      }
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      showWarning('Please fill up form correctly')
      setLoading(false)
      return
    }

    // Check file upload
    if (!file) {
      showWarning('Please select a file to upload')
      setLoading(false)
      return
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('description', formData.description)
      submitData.append('type', formData.type)
      submitData.append('postType', formData.postType)
      submitData.append('tags', JSON.stringify(formData.tags))
      
      // Add post-type specific fields
      if (formData.postType === 'food') {
        if (formData.price) {
          submitData.append('price', formData.price)
          submitData.append('currency', formData.currency)
        }
        if (formData.preparationTime) {
          submitData.append('preparationTime', formData.preparationTime)
        }
        // Always send isAvailable status
        submitData.append('isAvailable', formData.isAvailable)
      } else if (formData.postType === 'advertisement') {
        if (formData.promotionType) {
          submitData.append('promotionType', formData.promotionType)
        }
        if (formData.prices.original || formData.prices.discounted) {
          submitData.append('prices', JSON.stringify(formData.prices))
        }
        if (formData.validUntil) {
          submitData.append('validUntil', formData.validUntil)
        }
        if (formData.promoCode) {
          submitData.append('promoCode', formData.promoCode)
        }
      }
      
      // Always use 'file' as the field name to match backend expectation
      submitData.append('file', file)

      const loadingToast = showLoading('Uploading your post...')
      
      // Use different API endpoints based on post type
       const apiUrl = formData.postType === 'food' 
        ? API_ENDPOINTS.food.create
        : API_ENDPOINTS.advertisement.create
      
      const response = await axios.post(apiUrl, submitData, multipartConfig)

      // console.log(response)
      // console.log('Post created successfully:', response.data)
      if (response.data) {
          updateToSuccess(
            loadingToast,
            `${formData.postType === 'food' ? 'Food' : 'Advertisement'} post created successfully! Redirecting...`
          )
        }
      
      
      setTimeout(() => navigate('/partner-profile'), 2000)
      
    } catch (error) {
      console.error('Create post error:', error)
      const serverMsg = error?.response?.data?.error || error?.message || 'Failed to create post'
      showError(serverMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Food Post</h1>
            <p className="text-gray-600">Share your delicious creations with the world</p>
          </div>
        </div>

        {/* Form */}
        <ErrorBoundary>
          <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Choose Type</span>
              </div>
              <div className={`flex-1 h-0.5 mx-4 ${currentStep >= 2 ? 'bg-orange-200' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Add Details</span>
              </div>
            </div>
          </div>

          {currentStep === 1 ? (
            // Step 1: Post Type Selection
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">What would you like to create?</h2>
                <p className="text-gray-600">Choose the type of content you want to share</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Food Post Option */}
                <div
                  onClick={() => handlePostTypeSelect('food')}
                  className={`cursor-pointer p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    formData.postType === 'food'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      formData.postType === 'food'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Item</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Share a food item that customers can order with pricing details
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <IndianRupee className="w-4 h-4" />
                        <span>Set pricing</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <Clock className="w-4 h-4" />
                        <span>Preparation time</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advertisement Post Option */}
                <div
                  onClick={() => handlePostTypeSelect('advertisement')}
                  className={`cursor-pointer p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    formData.postType === 'advertisement'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      formData.postType === 'advertisement'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Megaphone className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Advertisement</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create promotional content like offers, discounts, or announcements
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                        <TagIcon className="w-4 h-4" />
                        <span>Promotion type</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                        <Calendar className="w-4 h-4" />
                        <span>Validity period</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {formData.postType && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-8 rounded-md transition-colors"
                  >
                    Continue to Details
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Step 2: Detailed Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Type Selection</span>
              </button>

              {/* Selected Post Type Indicator */}
              <div className={`p-4 rounded-lg border ${
                formData.postType === 'food' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center gap-3">
                  {formData.postType === 'food' ? (
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                  ) : (
                    <Megaphone className="w-5 h-5 text-purple-600" />
                  )}
                  <span className={`font-medium ${
                    formData.postType === 'food' ? 'text-green-800' : 'text-purple-800'
                  }`}>
                    Creating {formData.postType === 'food' ? 'Food Item' : 'Advertisement'} Post
                  </span>
                </div>
              </div>

              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Content Type
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('image')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                      formData.type === 'image'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Image Post
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('video')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                      formData.type === 'video'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Video Reel
                  </button>
                </div>
              </div>

              {/* Food Name/Title */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.postType === 'food' ? 'Food Name' : 'Advertisement Title'} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={formData.postType === 'food' 
                    ? "e.g. Biriyani, Margherita Pizza, Burger..." 
                    : "e.g. 50% Off Weekend Special, Buy 1 Get 1 Free..."
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={formData.postType === 'food'
                    ? "Describe your dish, ingredients, preparation method..."
                    : "Describe your offer, terms and conditions, promotional details..."
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Conditional Fields based on Post Type */}
              {formData.postType === 'food' ? (
                // Food-specific fields
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                    Food Details
                  </h3>
<div className='grid grid-cols-2 gap-4'>
                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
                        className={`w-full px-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {/* <div className="absolute inset-y-0 right-0 flex items-center"> */}
                        {/* <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                        </select> */}
                      {/* </div> */}
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  {/* Preparation Time */}
                  <div>
                    <label htmlFor="preparationTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Preparation Time *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                      required
                        type="number"
                        id="preparationTime"
                        name="preparationTime"
                        value={formData.preparationTime}
                        onChange={handleInputChange}
                        placeholder="Enter time in minutes"
                        min="0"
                        className="w-full px-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      {/* <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">min</span>
                      </div> */}
                    </div>
                  </div>
                  </div>

                  {/* Availability Toggle */}
                  <div className="pt-4 border-t">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${formData.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {formData.isAvailable && (
                            <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">Currently Available for Order</span>
                          <p className="text-xs text-gray-500">Toggle this when item is out of stock</p>
                        </div>
                      </div>
                      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                        <input
                          type="checkbox"
                          checked={formData.isAvailable}
                          onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                          className="opacity-0 w-0 h-0 peer"
                        />
                        {/* <span className={`absolute cursor-pointer inset-0 rounded-full transition duration-200 ${formData.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${formData.isAvailable ? 'translate-x-6' : ''}`}></span> */}
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                // Advertisement-specific fields
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-600" />
                    Promotion Details
                  </h3>

                  {/* Promotion Type */}
                  <div>
                    <label htmlFor="promotionType" className="block text-sm font-medium text-gray-700 mb-2">
                      Promotion Type *
                    </label>
                    <select
                      id="promotionType"
                      name="promotionType"
                      value={formData.promotionType}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.promotionType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select promotion type</option>
                      <option value="discount">Discount Offer</option>
                      <option value="bogo">Buy One Get One</option>
                      <option value="combo">Combo Deal</option>
                      <option value="seasonal">Seasonal Special</option>
                      <option value="announcement">General Announcement</option>
                    </select>
                    {errors.promotionType && (
                      <p className="mt-1 text-sm text-red-600">{errors.promotionType}</p>
                    )}
                  </div>

                  {/* Promotional Prices (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promotional Pricing (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="originalPrice" className="block text-xs text-gray-600 mb-1">Original Price</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            id="originalPrice"
                            name="prices.original"
                            value={formData.prices.original}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              prices: { ...prev.prices, original: e.target.value }
                            }))}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="discountedPrice" className="block text-xs text-gray-600 mb-1">Discounted Price</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            id="discountedPrice"
                            name="prices.discounted"
                            value={formData.prices.discounted}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              prices: { ...prev.prices, discounted: e.target.value }
                            }))}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div>
                    <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="datetime-local"
                        id="validUntil"
                        name="validUntil"
                        value={formData.validUntil}
                        onChange={handleInputChange}
                        className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div>
                    <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Code (Optional)
                    </label>
                    <input
                      type="text"
                      id="promoCode"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      placeholder="e.g. SAVE20, WEEKEND50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              )}
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'image' ? 
                    (formData.postType === 'food' ? 'Food Image' : 'Advertisement Image') : 
                    (formData.postType === 'food' ? 'Food Video' : 'Advertisement Video')
                  } *
                </label>
                
                {!filePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Click to upload {formData.type === 'image' ? 'an image' : 'a video'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formData.type === 'image' ? 'PNG, JPG, GIF up to 5MB' : 'MP4, MOV up to 5MB'}
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    {formData.type === 'image' ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={filePreview}
                        controls
                        className="w-full max-h-64 rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setFilePreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {errors.file && (
                  <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-blue-500 text-white px-3 py-2 hover:bg-blue-600 transition-colors rounded-2xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        <Hash className="w-3 h-3 flex-shrink-0" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 hover:cursor-pointer rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:cursor-pointer ${
                  formData.postType === 'food'
                    ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-400 focus:ring-green-500'
                    : 'bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 focus:ring-purple-500'
                } text-white`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creating Post...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {formData.postType === 'food' ? (
                      <ShoppingBag className="h-4 w-4 mr-2" />
                    ) : (
                      <Megaphone className="h-4 w-4 mr-2" />
                    )}
                    Create {formData.postType === 'food' ? 'Food' : 'Advertisement'} Post
                  </div>
                )}
              </button>
            </form>
          )}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default CreateFood