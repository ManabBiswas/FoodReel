import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { 
  UtensilsCrossed, 
  Upload, 
  Video, 
  Image as ImageIcon, 
  ArrowLeft, 
  Loader2, 
  X,
  Plus,
  Tag as TagIcon
} from 'lucide-react'
import Navbar from '../../Components/Navbar'

const CreateFood = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'image', // 'image' or 'video'
    tags: []
  })
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

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
      setMessage('Please select an image file')
      return
    }
    
    if (formData.type === 'video' && !isVideo) {
      setMessage('Please select a video file')
      return
    }

    // File size validation (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB')
      return
    }

    setFile(selectedFile)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setFilePreview(reader.result)
    }
    reader.readAsDataURL(selectedFile)
    setMessage('')
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
      newErrors.name = 'Food name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!file) {
      newErrors.file = `${formData.type === 'image' ? 'Image' : 'Video'} is required`
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('description', formData.description)
      submitData.append('type', formData.type)
      submitData.append('tags', JSON.stringify(formData.tags))
      
      // Always use 'file' as the field name to match backend expectation
      submitData.append('file', file)

      setMessage('Uploading your food post...')
      const response = await axios.post('http://localhost:3000/api/food', submitData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log(response)
      setMessage('Food post created successfully! Redirecting...')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'image',
        tags: []
      })
      setFile(null)
      setFilePreview(null)
      
      setTimeout(() => navigate('/partner-profile'), 2000)
      
    } catch (error) {
      console.error('Create food error:', error)
      const serverMsg = error?.response?.data?.error || error?.message || 'Failed to create food post'
      setMessage(serverMsg)
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

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('successfully') || message.includes('Uploading')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Food Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Food Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g.Biriyani, Margherita Pizza, Burger..."
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
                placeholder="Describe your dish, ingredients, preparation method..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'image' ? 'Food Image' : 'Food Video'} *
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
                  className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors"
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
                      <TagIcon className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
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
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating Post...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Create Food Post
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateFood