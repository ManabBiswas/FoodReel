import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { showSuccess, showError, showWarning } from '../../utils/toast'
import { API_ENDPOINTS, multipartConfig, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import ErrorBoundary from '../../Components/ErrorBoundary'
import { Upload, Image as ImageIcon, Video, X, Plus, Loader2, Search, Tag, Store, UtensilsCrossed } from 'lucide-react'

const CreatePost = () => {
  const navigate = useNavigate()
  const [type, setType] = useState('image')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  // Tagging state
  const [wantToTag, setWantToTag] = useState('no')
  const [restaurantSearch, setRestaurantSearch] = useState('')
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [partnerSuggestions, setPartnerSuggestions] = useState([])
  const [searchingPartners, setSearchingPartners] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [foodItems, setFoodItems] = useState([])
  const [loadingFoodItems, setLoadingFoodItems] = useState(false)

  // Search for partners when user types
  useEffect(() => {
    const searchPartners = async () => {
      if (!restaurantSearch.trim() || restaurantSearch.trim().length < 2) {
        setPartnerSuggestions([])
        return
      }

      setSearchingPartners(true)
      try {
        const res = await axios.get(`${API_ENDPOINTS.food.getAll}?limit=50`, axiosConfig)
        if (res.data?.data) {
          const partners = []
          const partnerIds = new Set()
          
          res.data.data.forEach(item => {
            if (item.foodPartner && !partnerIds.has(item.foodPartner._id)) {
              partnerIds.add(item.foodPartner._id)
              partners.push({
                _id: item.foodPartner._id,
                companyName: item.foodPartner.companyName || item.foodPartner.email,
                email: item.foodPartner.email
              })
            }
          })

          const filtered = partners.filter(p => 
            p.companyName?.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
            p.email?.toLowerCase().includes(restaurantSearch.toLowerCase())
          )
          setPartnerSuggestions(filtered.slice(0, 5))
        }
      } catch (err) {
        console.error('Error searching partners:', err)
      } finally {
        setSearchingPartners(false)
      }
    }

    const debounce = setTimeout(searchPartners, 300)
    return () => clearTimeout(debounce)
  }, [restaurantSearch])

  // Fetch food items when partner is selected
  useEffect(() => {
    const fetchFoodItems = async () => {
      if (!selectedPartner) {
        setFoodItems([])
        return
      }

      setLoadingFoodItems(true)
      try {
        const res = await axios.get(API_ENDPOINTS.food.getAll, axiosConfig)
        if (res.data?.data) {
          const filtered = res.data.data.filter(item => 
            item.foodPartner?._id === selectedPartner._id &&
            item.postType === 'food' &&
            item.price &&
            item.price > 0 &&
            item.isActive !== false
          )
          setFoodItems(filtered)
        }
      } catch (err) {
        console.error('Error fetching food items:', err)
        showError('Failed to load food items from this restaurant')
      } finally {
        setLoadingFoodItems(false)
      }
    }

    fetchFoodItems()
  }, [selectedPartner])

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const isImage = f.type.startsWith('image/')
    const isVideo = f.type.startsWith('video/')
    if (type === 'image' && !isImage) return showWarning('Please select an image file')
    if (type === 'video' && !isVideo) return showWarning('Please select a video file')
    if (f.size > 5 * 1024 * 1024) return showWarning('File must be less than 5MB')
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner)
    setRestaurantSearch(partner.companyName)
    setPartnerSuggestions([])
    setSelectedFood(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (!name.trim()) { showWarning('Title required'); setLoading(false); return }
    if (!description.trim()) { showWarning('Description required'); setLoading(false); return }
    if (!file) { showWarning('Please select a file'); setLoading(false); return }

    // Validate tagging
    if (wantToTag === 'yes') {
      if (!selectedPartner) {
        showWarning('Please select a restaurant')
        setLoading(false)
        return
      }
      if (!selectedFood) {
        showWarning('Please select a food item from the restaurant')
        setLoading(false)
        return
      }
    }

    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description)
      fd.append('type', type)
      fd.append('tags', JSON.stringify(tags))
      fd.append('file', file)

      // Add tagging info
      if (wantToTag === 'yes' && selectedPartner && selectedFood) {
        fd.append('partnerId', selectedPartner._id)
        fd.append('foodId', selectedFood._id)
      }

      const res = await axios.post(API_ENDPOINTS.food.createUserPost, fd, multipartConfig)
      if (res?.data) {
        showSuccess('Post created successfully! Redirecting...')
        setTimeout(() => navigate('/reels'), 1500)
      }
    } catch (err) {
      console.error(err)
      showError(err?.response?.data?.error || err.message || 'Failed to create post')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl text-center font-bold text-amber-500 mb-4">Create a Post</h1>
        <ErrorBoundary>
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setType('image')} className={`px-3 py-2 rounded border ${type === 'image' ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}><ImageIcon className="inline w-4 h-4 mr-2" />Image</button>
                <button type="button" onClick={() => setType('video')} className={`px-3 py-2 rounded border ${type === 'video' ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}><Video className="inline w-4 h-4 mr-2" />Video</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" rows={4} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">File</label>
              {!preview ? (
                <div className="border-2 border-dashed p-6 text-center rounded">
                  <input id="file-input" type="file" accept={type === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} className="hidden" />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="mx-auto w-10 h-10 text-gray-400" />
                    <div className="mt-2 text-gray-600">Click to upload {type}</div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  {type === 'image' ? <img src={preview} alt="preview" className="w-full rounded" /> : <video src={preview} controls className="w-full rounded" />}
                  <button type="button" onClick={() => { setFile(null); setPreview(null) }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {/* Want to Tag Restaurant & Food */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Tag className="w-4 h-4" />
                Tag a Restaurant & Food Item (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Tagging allows the order button to appear on your post, making it shoppable!
              </p>
              
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="tag" 
                    value="no" 
                    checked={wantToTag === 'no'}
                    onChange={e => setWantToTag(e.target.value)} 
                    className="w-4 h-4"
                  />
                  <span className="text-sm">No, just share my post</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="tag" 
                    value="yes" 
                    checked={wantToTag === 'yes'}
                    onChange={e => setWantToTag(e.target.value)} 
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Yes, tag restaurant</span>
                </label>
              </div>

              {wantToTag === 'yes' && (
                <div className="space-y-4 bg-blue-50 p-4 rounded border border-blue-200">
                  {/* Restaurant Search */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Store className="w-4 h-4" />
                      Search Restaurant *
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={restaurantSearch}
                        onChange={e => {
                          setRestaurantSearch(e.target.value)
                          if (!e.target.value.trim()) {
                            setSelectedPartner(null)
                            setSelectedFood(null)
                          }
                        }}
                        placeholder="Type restaurant name..."
                        className="w-full pl-10 pr-3 py-2 border rounded"
                      />
                      {searchingPartners && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                      )}
                    </div>

                    {/* Partner Suggestions */}
                    {partnerSuggestions.length > 0 && (
                      <div className="mt-2 border rounded bg-white shadow-lg max-h-48 overflow-y-auto">
                        {partnerSuggestions.map(partner => (
                          <button
                            key={partner._id}
                            type="button"
                            onClick={() => handleSelectPartner(partner)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-2"
                          >
                            <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{partner.companyName}</div>
                              <div className="text-xs text-gray-500 truncate">{partner.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Partner Display */}
                    {selectedPartner && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">{selectedPartner.companyName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPartner(null)
                            setSelectedFood(null)
                            setRestaurantSearch('')
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Food Item Selection */}
                  {selectedPartner && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <UtensilsCrossed className="w-4 h-4" />
                        Select Food Item *
                      </label>
                      
                      {loadingFoodItems ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading menu items...
                        </div>
                      ) : foodItems.length === 0 ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                          No available food items found for this restaurant with pricing information.
                        </div>
                      ) : (
                        <select
                          value={selectedFood?._id || ''}
                          onChange={e => {
                            const food = foodItems.find(f => f._id === e.target.value)
                            setSelectedFood(food || null)
                          }}
                          className="w-full px-3 py-2 border rounded"
                        >
                          <option value="">-- Select a food item --</option>
                          {foodItems.map(food => (
                            <option key={food._id} value={food._id}>
                              {food.name} - ₹{food.price} {food.preparationTime ? `(${food.preparationTime} min)` : ''}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Selected Food Display */}
                      {selectedFood && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-green-800">{selectedFood.name}</div>
                              <div className="text-sm text-green-600 mt-1">
                                Price: ₹{selectedFood.price}
                                {selectedFood.preparationTime && ` • ${selectedFood.preparationTime} min`}
                              </div>
                              {selectedFood.description && (
                                <div className="text-xs text-gray-600 mt-1">{selectedFood.description}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFood(null)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    💡 <strong>Tip:</strong> When you tag a food item, the order button will appear on your post, allowing viewers to order directly!
                  </div>
                </div>
              )}
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium mb-1">Hashtags (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={tagInput} 
                  onChange={e => setTagInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())} 
                  className="flex-1 px-3 py-2 border rounded" 
                  placeholder="Add hashtags..."
                />
                <button 
                  type="button" 
                  onClick={addTag} 
                  className="px-3 py-2 bg-blue-500 text-white rounded"
                >
                  <Plus className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 rounded text-sm">
                    #{t}
                    <button 
                      type="button" 
                      onClick={() => removeTag(t)} 
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3 inline" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-green-500 text-white rounded font-semibold hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin inline w-4 h-4 mr-2" /> 
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default CreatePost
