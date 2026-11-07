import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { showSuccess, showError, showWarning } from '../../utils/toast'
import { API_ENDPOINTS, multipartConfig, axiosConfig } from '../../config/Api'
import Navbar from '../../Components/Navbar'
import ErrorBoundary from '../../Components/ErrorBoundary'
import { Upload, Image as ImageIcon, Video, X, Plus, Loader2, Search, Tag, Store, UtensilsCrossed, Hash } from 'lucide-react'
import { animate, stagger } from 'animejs'

/* ─── Animated SVG mark ─────────────────────────────────────────
   The camera outline, lens and sparkle are drawn with anime.js.
   Every path is visible by default, so reduced-motion users get the
   finished illustration without any animation. */
const TasteMark = () => {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const drawPaths = root.querySelectorAll('.cp-draw')
    drawPaths.forEach((path) => {
      path.style.strokeDasharray = '1'
      path.style.strokeDashoffset = '1'
    })

    const draw = animate(drawPaths, {
      strokeDashoffset: [1, 0],
      delay: stagger(120),
      duration: 1000,
      easing: 'easeOutExpo'
    })

    const pop = animate(root.querySelectorAll('.cp-pop'), {
      opacity: [0, 1],
      scale: [0.5, 1],
      delay: stagger(140, { start: 650 }),
      duration: 700,
      easing: 'easeOutBack'
    })

    const glow = animate(root.querySelectorAll('.cp-glow'), {
      opacity: [0.3, 0.75],
      scale: [0.94, 1.04],
      duration: 2600,
      loop: true,
      alternate: true,
      easing: 'easeInOutSine'
    })

    return () => {
      draw.pause()
      pop.pause()
      glow.pause()
    }
  }, [])

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 120 120"
      className="h-20 w-20"
      role="img"
      aria-label="A camera with a plate-like lens"
    >
      <defs>
        <linearGradient id="cp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf8" />
          <stop offset="100%" stopColor="#ffd9b3" />
        </linearGradient>
        <radialGradient id="cp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb800" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        className="cp-glow"
        cx="60"
        cy="64"
        r="48"
        fill="url(#cp-glow)"
        opacity="0.5"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      <path
        className="cp-draw"
        pathLength="1"
        d="M30 44h12l6-9h24l6 9h12a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V50a6 6 0 0 1 6-6Z"
        fill="url(#cp-body)"
        stroke="#1a1208"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle
        className="cp-draw"
        pathLength="1"
        cx="60"
        cy="63"
        r="16"
        fill="#fffdf8"
        stroke="#1a1208"
        strokeWidth="3"
      />
      <circle
        className="cp-pop"
        cx="60"
        cy="63"
        r="7.5"
        fill="#ff6a00"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <circle
        className="cp-pop"
        cx="56.5"
        cy="59.5"
        r="2.2"
        fill="#ffd9b3"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <path
        className="cp-draw"
        pathLength="1"
        d="M98 26v10M93 31h10"
        fill="none"
        stroke="#ffb800"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        className="cp-pop"
        cx="24"
        cy="28"
        r="3"
        fill="#ffb800"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <circle
        className="cp-pop"
        cx="102"
        cy="88"
        r="2.5"
        fill="#ff6a00"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </svg>
  )
}


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

  const formRef = useRef(null)

  useEffect(() => {
    if (formRef.current) {
      animate('.sk-surface', {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100),
        easing: 'easeOutExpo'
      })
    }
  }, [])

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

  const changeType = (nextType) => {
    if (nextType === type) return
    setType(nextType)
    // A file chosen for the previous format would be rejected by the API, so
    // clear both the file and its preview whenever the format changes.
    setFile(null)
    setPreview(null)
  }

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
    const sizeLimit = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (f.size > sizeLimit) return showWarning(`File must be less than ${isVideo ? '10MB' : '5MB'}`)
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

      if (wantToTag === 'yes' && selectedPartner && selectedFood) {
        fd.append('partnerId', selectedPartner._id)
        fd.append('foodId', selectedFood._id)
      }

      const res = await axios.post(API_ENDPOINTS.food.createUserPost, fd, multipartConfig)
      if (res?.data) {
        showSuccess('Post created successfully! Redirecting...')
        setTimeout(() => navigate('/profile'), 1500)
      }
    } catch (err) {
      console.error(err)
      showError(err?.response?.data?.error || err.message || 'Failed to create post')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#1a1208]">
      <Navbar />
      <div className="max-w-3xl mx-auto py-12 px-6" ref={formRef}>
        <header className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/70 bg-gradient-to-b from-[#fffdf8] to-[#ffd9b3] shadow-[0_12px_28px_rgba(26,18,8,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
            <TasteMark />
          </div>
          <h1 className="text-5xl font-serif font-black mb-4">Share your <span className="italic text-orange-600">taste.</span></h1>
          <p className="text-text-muted font-sans max-w-md mx-auto">
            Upload a reel or photo of your favorite meal and let the community discover it.
          </p>
        </header>

        <ErrorBoundary>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ── Content Type & Media ────────────────────────────────── */}
            <div className="sk-surface sk-texture p-8 flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted font-sans">Content Format</label>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => changeType('image')} 
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-sans font-semibold flex items-center justify-center gap-2 ${
                        type === 'image' 
                        ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-inner' 
                        : 'bg-white border-border-light text-text-muted hover:border-border-medium'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" /> Image
                    </button>
                    <button 
                      type="button" 
                      onClick={() => changeType('video')} 
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-sans font-semibold flex items-center justify-center gap-2 ${
                        type === 'video' 
                        ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-inner' 
                        : 'bg-white border-border-light text-text-muted hover:border-border-medium'
                      }`}
                    >
                      <Video className="w-4 h-4" /> Video Reel
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted font-sans">Post Title</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-border-light bg-white focus:border-orange-400 focus:ring-0 outline-none transition-all font-serif text-xl" 
                    placeholder="What are we eating?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted font-sans">Story</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-border-light bg-white focus:border-orange-400 focus:ring-0 outline-none transition-all font-sans leading-relaxed" 
                    rows={4}
                    placeholder="Tell us about the flavor, the spot, or the memory..."
                  />
                </div>
              </div>

              <div className="w-full md:w-80 space-y-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-surface-muted group">
                  {!preview ? (
                    <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-black/5 transition-colors">
                      <input type="file" accept={type === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} className="hidden" />
                      <Upload className="w-10 h-10 text-text-faint mb-2" />
                      <span className="text-xs font-bold uppercase tracking-tighter text-text-faint">Upload {type}</span>
                    </label>
                  ) : (
                    <>
                      {type === 'image' ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : <video src={preview} controls className="w-full h-full object-cover" />}
                      <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreview(null) }} 
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-lg hover:bg-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-center text-[10px] text-text-faint font-sans italic">
                  {type === 'image' ? 'Max 5MB (JPG, PNG)' : 'Max 10MB (MP4, MOV)'}
                </p>
              </div>
            </div>

            {/* ── Tagging Section ────────────────────────────────────── */}
            <div className="sk-surface sk-texture p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold">Make it shoppable</h3>
                    <p className="text-xs text-text-muted font-sans">Tag a restaurant to add an order button</p>
                  </div>
                </div>
                <div className="flex gap-2 bg-white/50 p-1 rounded-xl border border-border-light">
                  <button 
                    type="button"
                    onClick={() => setWantToTag('no')} 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${wantToTag === 'no' ? 'bg-white shadow-sm text-text-base' : 'text-text-muted hover:text-text-base'}`}
                  >
                    Just Share
                  </button>
                  <button 
                    type="button"
                    onClick={() => setWantToTag('yes')} 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${wantToTag === 'yes' ? 'bg-white shadow-sm text-text-base' : 'text-text-muted hover:text-text-base'}`}
                  >
                    Tag Dish
                  </button>
                </div>
              </div>

              {wantToTag === 'yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                      <input 
                        type="text" 
                        value={restaurantSearch} 
                        onChange={e => setRestaurantSearch(e.target.value)} 
                        placeholder="Search for a kitchen..." 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-border-light bg-white focus:border-orange-400 focus:ring-0 outline-none transition-all font-sans"
                      />
                      {searchingPartners && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
                      )}
                      {partnerSuggestions.length > 0 && (
                        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-border-light overflow-hidden">
                          {partnerSuggestions.map(partner => (
                            <button 
                              key={partner._id} 
                              type="button" 
                              onClick={() => handleSelectPartner(partner)} 
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-border-light last:border-b-0 flex items-center gap-3"
                            >
                              <Store className="w-4 h-4 text-text-faint" />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-sm">{partner.companyName}</div>
                                <div className="text-[10px] text-text-muted truncate">{partner.email}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedPartner && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100 text-green-800">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Store className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-bold truncate">{selectedPartner.companyName}</span>
                        </div>
                        <button type="button" onClick={() => { setSelectedPartner(null); setSelectedFood(null); setRestaurantSearch('') }} className="p-1 hover:bg-green-100 rounded-full transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {selectedPartner ? (
                      <div className="relative">
                        <select 
                          value={selectedFood?._id || ''} 
                          onChange={e => {
                            const food = foodItems.find(f => f._id === e.target.value)
                            setSelectedFood(food || null)
                          }} 
                          className="w-full px-4 py-3 rounded-xl border-2 border-border-light bg-white focus:border-orange-400 focus:ring-0 outline-none transition-all font-sans appearance-none"
                        >
                          <option value="">Select a dish...</option>
                          {foodItems.map(food => (
                            <option key={food._id} value={food._id}>
                              {food.name} — ₹{food.price}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <UtensilsCrossed className="w-4 h-4 text-text-faint" />
                        </div>
                        {loadingFoodItems && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-[52px] rounded-xl border-2 border-dashed border-border-light flex items-center justify-center text-text-faint text-xs font-medium italic">
                        Select a kitchen first
                      </div>
                    )}
                    {selectedFood && (
                      <div className="p-3 rounded-xl bg-white shadow-sm border border-border-light">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{selectedFood.name}</span>
                          <span className="text-xs font-bold text-orange-600">₹{selectedFood.price}</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{selectedFood.description || 'No description available.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border-light">
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, i) => (
                    <span key={i} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border-light text-xs font-bold text-text-base transition-all hover:border-orange-400">
                      <Hash className="w-3 h-3 text-orange-500" />
                      {t}
                      <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="p-0.5 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      value={tagInput} 
                      onChange={e => setTagInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} 
                      className="pl-3 pr-10 py-1.5 rounded-full border border-border-light bg-white text-xs focus:border-orange-400 focus:ring-0 outline-none transition-all w-32 focus:w-48" 
                      placeholder="Add tag..."
                    />
                    <button 
                      type="button" 
                      onClick={addTag} 
                      aria-label="Add tag"
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-orange-500 text-white transition-all hover:bg-orange-600"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 rounded-2xl bg-orange-600 text-white font-bold text-lg shadow-lg hover:bg-orange-700 active:scale-[0.98] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" /> 
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Publish Post
                </>
              )}
            </button>
          </form>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default CreatePost