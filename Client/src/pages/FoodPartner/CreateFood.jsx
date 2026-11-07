import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import { showWarning, showError, showLoading, updateToSuccess, updateToError } from '../../utils/toast'
import { API_ENDPOINTS, multipartConfig } from '../../config/Api'
import { usePartnerData } from '../../hooks/usePartnerData'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Hash,
  Image as ImageIcon,
  IndianRupee,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag as TagIcon,
  Upload,
  UtensilsCrossed,
  Video,
  X
} from 'lucide-react'
import Navbar from '../../Components/Navbar'
import ErrorBoundary from '../../Components/ErrorBoundary'

const PROMO_TYPES_REQUIRING_PRICES = ['discount', 'combo']

const FIELD_BASE =
  'w-full rounded-xl border bg-[#fffdf8] px-4 py-3 font-sans text-[#1a1208] placeholder:text-[#9e9890] shadow-[inset_0_2px_4px_rgba(26,18,8,0.07),0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:ring-2 focus:ring-[#ff6a00]/25'

const fieldClass = (hasError) =>
  `${FIELD_BASE} ${
    hasError
      ? 'border-red-500 focus:border-red-500'
      : 'border-[#d9cbb4] focus:border-[#ff6a00]'
  }`

const labelClass =
  'mb-2 block font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#6b6460]'

const errorClass = 'mt-1.5 font-sans text-xs font-medium text-red-600'

const sectionClass =
  'rounded-2xl border border-[#e6d9c4]/80 bg-[#fffdf8]/65 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-6'

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-[#c94e00] bg-gradient-to-b from-[#ff8533] to-[#e55a00] px-6 py-3.5 font-sans text-base font-bold text-white shadow-[0_6px_0_#b64a00,0_12px_22px_rgba(229,90,0,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] transition-all duration-200 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] focus-visible:ring-offset-2 active:translate-y-[3px] active:shadow-[0_3px_0_#b64a00,0_6px_12px_rgba(229,90,0,0.22),inset_0_1px_0_rgba(255,255,255,0.5)] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0'


const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const emptyForm = {
  postType: '',
  name: '',
  description: '',
  type: 'image',
  tags: [],
  price: '',
  currency: 'INR',
  isAvailable: true,
  preparationTime: '',
  promotionType: '',
  prices: { original: '', discounted: '' },
  validUntil: '',
  promoCode: ''
}

/* ─── Animated SVG mark ─────────────────────────────────────────
   The steam, dome outline and plate line are drawn with anime.js.
   Every path is visible by default, so reduced-motion users get the
   finished illustration without any animation. */
const KitchenMark = () => {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const drawPaths = root.querySelectorAll('.cf-draw')
    drawPaths.forEach((path) => {
      path.style.strokeDasharray = '1'
      path.style.strokeDashoffset = '1'
    })

    const draw = animate(drawPaths, {
      strokeDashoffset: [1, 0],
      delay: stagger(110),
      duration: 1000,
      easing: 'easeOutExpo'
    })

    const steam = animate(root.querySelectorAll('.cf-steam'), {
      translateY: [5, -6],
      opacity: [0.25, 0.9],
      delay: stagger(260),
      duration: 2100,
      loop: true,
      alternate: true,
      easing: 'easeInOutSine'
    })

    const glow = animate(root.querySelectorAll('.cf-glow'), {
      opacity: [0.35, 0.8],
      duration: 2400,
      loop: true,
      alternate: true,
      easing: 'easeInOutSine'
    })

    return () => {
      draw.pause()
      steam.pause()
      glow.pause()
    }
  }, [])

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 160 160"
      className="h-28 w-28"
      role="img"
      aria-label="A steaming cloche"
    >
      <defs>
        <linearGradient id="cf-dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf8" />
          <stop offset="100%" stopColor="#ffd9b3" />
        </linearGradient>
        <radialGradient id="cf-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb800" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="cf-glow" cx="80" cy="86" r="58" fill="url(#cf-glow)" opacity="0.5" />

      <g
        className="cf-steam"
        fill="none"
        stroke="#ff6a00"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      >
        <path d="M62 46c-6-7 6-11 0-18" />
        <path d="M80 42c-6-7 6-11 0-18" />
        <path d="M98 46c-6-7 6-11 0-18" />
      </g>

      <path
        className="cf-draw"
        pathLength="1"
        d="M40 104a40 40 0 0 1 80 0Z"
        fill="url(#cf-dome)"
        stroke="#1a1208"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        className="cf-draw"
        pathLength="1"
        d="M72 64V56a8 8 0 0 1 16 0v8"
        fill="#ff6a00"
        stroke="#1a1208"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        className="cf-draw"
        pathLength="1"
        d="M28 104h104"
        fill="none"
        stroke="#1a1208"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="cf-draw"
        pathLength="1"
        d="M38 104c0 9 18 15 42 15s42-6 42-15"
        fill="none"
        stroke="#1a1208"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="cf-draw"
        pathLength="1"
        d="M58 88c10-10 34-10 44 0"
        fill="none"
        stroke="#ffb800"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="122" cy="48" r="4" fill="#ff6a00" />
      <circle cx="38" cy="54" r="3" fill="#ffb800" />
    </svg>
  )
}

const PostTypeCard = ({ active, onClick, icon, title, description, bullets, tone }) => {
  const iconTone =
    tone === 'accent'
      ? 'bg-gradient-to-b from-[#fff8d6] to-[#ffe58a] text-[#8a5a00]'
      : 'bg-gradient-to-b from-[#fff3e0] to-[#ffd9b3] text-[#e55a00]'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`sk-surface group relative overflow-hidden p-6 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] focus-visible:ring-offset-2 ${
        active ? 'ring-2 ring-[#ff6a00]/70' : ''
      }`}
    >
      {active && (
        <span className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#c94e00] bg-gradient-to-b from-[#ff8533] to-[#e55a00] text-[#1a1208] shadow-[0_2px_0_#b64a00,inset_0_1px_0_rgba(255,255,255,0.5)]">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}

      <span
        className={`sk-icon mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_6px_rgba(26,18,8,0.12)] ${iconTone}`}
      >
        {React.createElement(icon, { className: 'h-7 w-7' })}
      </span>

      <h2 className="sk-label font-serif text-2xl font-bold">{title}</h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#6b6460]">{description}</p>

      <ul className="mt-4 space-y-1.5">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2 font-sans text-sm text-[#4a4038]">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ffb800]/25 text-[#b07a00]">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </button>
  )
}

const StepPill = ({ number, label, active, done, onClick }) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`flex items-center gap-2.5 rounded-full px-1 py-1 font-sans text-sm font-semibold transition-colors ${
        onClick ? 'cursor-pointer hover:text-[#e55a00]' : ''
      } ${active ? 'text-[#1a1208]' : 'text-[#9e9890]'}`}
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_4px_rgba(26,18,8,0.1)] ${
          active
            ? 'border-[#c94e00] bg-gradient-to-b from-[#ff8533] to-[#e55a00] text-[#1a1208]'
            : 'border-[#d9cbb4] bg-[#fffdf8] text-[#9e9890]'
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </Tag>
  )
}

const CreateFood = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { posts, loading: partnerLoading, error: partnerError, refresh } = usePartnerData()

  const editId = searchParams.get('edit') || ''
  const editTypeParam = searchParams.get('type') || ''
  const isEditMode = Boolean(editId)

  const [formData, setFormData] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [existingMedia, setExistingMedia] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1)
  const [prefillDone, setPrefillDone] = useState(!isEditMode)
  const [loadError, setLoadError] = useState('')

  const minValidUntil = useMemo(
    () => toDateTimeLocal(new Date(Date.now() + 5 * 60 * 1000)),
    []
  )

  // Load the post being edited from the already-cached partner context.
  // `my-posts` includes unavailable items, unlike the public /food/:id route.
  useEffect(() => {
    if (!isEditMode || prefillDone || partnerLoading) return

    if (!posts) {
      setLoadError(
        partnerError || 'We could not load your posts. Return to the dashboard and try again.'
      )
      setPrefillDone(true)
      return
    }

    const foodMatch = (posts.food || []).find((item) => item._id === editId)
    const advertisementMatch = (posts.advertisement || []).find((item) => item._id === editId)
    const resolvedType =
      editTypeParam === 'advertisement' || (!editTypeParam && advertisementMatch && !foodMatch)
        ? 'advertisement'
        : 'food'
    const item = resolvedType === 'food' ? foodMatch : advertisementMatch

    if (!item) {
      setLoadError('This post could not be found. It may have been deleted.')
      setPrefillDone(true)
      return
    }

    const mediaUrl = item.image || item.video || item.file || null

    setExistingMedia(mediaUrl ? { url: mediaUrl, type: item.type || 'image' } : null)
    setFilePreview(mediaUrl)
    setFormData({
      postType: resolvedType,
      name: item.name || '',
      description: item.description || '',
      type: item.type || 'image',
      tags: Array.isArray(item.tags) ? item.tags : [],
      price: item.price ?? '',
      currency: item.currency || 'INR',
      isAvailable: item.isAvailable !== false,
      preparationTime: item.preparationTime ?? '',
      promotionType: item.promotionType || '',
      prices: {
        original: item.prices?.original ?? '',
        discounted: item.prices?.discounted ?? ''
      },
      validUntil: toDateTimeLocal(item.validUntil),
      promoCode: item.promoCode || ''
    })
    setPrefillDone(true)
  }, [isEditMode, prefillDone, partnerLoading, partnerError, posts, editId, editTypeParam])

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const updatePrice = (key, value) => {
    const errorKey = key === 'original' ? 'originalPrice' : 'discountedPrice'
    setFormData((prev) => ({ ...prev, prices: { ...prev.prices, [key]: value } }))
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: '' }))
  }

  const selectPostType = (postType) => {
    setFormData((prev) => ({ ...prev, postType }))
    setErrors({})
  }

  const changeType = (nextType) => {
    if (nextType === formData.type) return
    setFormData((prev) => ({ ...prev, type: nextType }))
    setFile(null)
    setErrors((prev) => ({ ...prev, file: '' }))
    // Restore the saved media when switching back to its original format.
    setFilePreview(existingMedia && existingMedia.type === nextType ? existingMedia.url : null)
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const isImage = selectedFile.type.startsWith('image/')
    const isVideo = selectedFile.type.startsWith('video/')

    if (formData.type === 'image' && !isImage) {
      showWarning('Please select an image file')
      event.target.value = ''
      return
    }
    if (formData.type === 'video' && !isVideo) {
      showWarning('Please select a video file')
      event.target.value = ''
      return
    }

    // Must mirror the server limits: IMAGE 5MB / VIDEO 10MB.
    const sizeLimit = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (selectedFile.size > sizeLimit) {
      showWarning(`File size must be less than ${isVideo ? '10MB' : '5MB'}`)
      event.target.value = ''
      return
    }

    setFile(selectedFile)
    setErrors((prev) => ({ ...prev, file: '' }))

    const reader = new FileReader()
    reader.onload = () => setFilePreview(reader.result)
    reader.readAsDataURL(selectedFile)

    // Allow selecting the same file again after removing it.
    event.target.value = ''
  }

  const clearMedia = () => {
    setFile(null)
    setFilePreview(existingMedia && existingMedia.type === formData.type ? existingMedia.url : null)
    setErrors((prev) => ({ ...prev, file: '' }))
  }

  const addTag = () => {
    const nextTag = tagInput.trim()
    if (!nextTag) return
    if (formData.tags.includes(nextTag)) {
      setTagInput('')
      return
    }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, nextTag] }))
    setTagInput('')
  }

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.name.trim()) nextErrors.name = 'Give this post a name.'
    if (!formData.description.trim()) nextErrors.description = 'Add a short description.'

    const mediaRequired = !isEditMode || !existingMedia || formData.type !== existingMedia.type
    if (mediaRequired && !file) {
      nextErrors.file = `Upload ${formData.type === 'image' ? 'an image' : 'a video'} to publish.`
    }

    if (formData.postType === 'food') {
      const price = Number(formData.price)
      if (formData.price === '' || Number.isNaN(price) || price <= 0) {
        nextErrors.price = 'Enter a price greater than ₹0.'
      }

      const preparationTime = Number(formData.preparationTime)
      if (
        formData.preparationTime === '' ||
        Number.isNaN(preparationTime) ||
        preparationTime < 0
      ) {
        nextErrors.preparationTime = 'Enter the preparation time in minutes.'
      }
    }

    if (formData.postType === 'advertisement') {
      if (!formData.promotionType) nextErrors.promotionType = 'Choose a promotion type.'

      const requiresPrices = PROMO_TYPES_REQUIRING_PRICES.includes(formData.promotionType)
      const hasAnyPrice =
        formData.prices.original !== '' || formData.prices.discounted !== ''

      if (requiresPrices || hasAnyPrice) {
        const original = Number(formData.prices.original)
        const discounted = Number(formData.prices.discounted)

        if (formData.prices.original === '' || Number.isNaN(original) || original <= 0) {
          nextErrors.originalPrice = 'Enter the original price.'
        }
        if (
          formData.prices.discounted === '' ||
          Number.isNaN(discounted) ||
          discounted <= 0
        ) {
          nextErrors.discountedPrice = 'Enter the discounted price.'
        }
        if (
          !nextErrors.originalPrice &&
          !nextErrors.discountedPrice &&
          discounted >= original
        ) {
          nextErrors.discountedPrice = 'Discounted price must be lower than the original.'
        }
      }

      if (!formData.validUntil) {
        nextErrors.validUntil = 'Choose when this offer ends.'
      } else if (new Date(formData.validUntil).getTime() <= Date.now()) {
        nextErrors.validUntil = 'Choose a date and time in the future.'
      }
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      showWarning('Please fix the highlighted fields')
      const firstKey = Object.keys(validationErrors)[0]
      const firstField = document.getElementById(firstKey === 'file' ? 'file-upload' : firstKey)
      firstField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstField?.focus({ preventScroll: true })
      return
    }

    setLoading(true)
    let loadingToast

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name.trim())
      submitData.append('description', formData.description.trim())
      submitData.append('type', formData.type)
      submitData.append('postType', formData.postType)
      submitData.append('tags', JSON.stringify(formData.tags))

      if (formData.postType === 'food') {
        submitData.append('price', formData.price)
        submitData.append('currency', formData.currency)
        submitData.append('preparationTime', formData.preparationTime)
        submitData.append('isAvailable', String(formData.isAvailable))
      } else {
        submitData.append('promotionType', formData.promotionType)
        submitData.append('validUntil', formData.validUntil)
        // On edit, send empty values too — otherwise clearing a promo code or
        // the promo prices leaves the previous values in the database.
        if (formData.promoCode.trim() || isEditMode) {
          submitData.append('promoCode', formData.promoCode.trim().toUpperCase())
        }
        if (formData.prices.original !== '' || formData.prices.discounted !== '') {
          submitData.append(
            'prices',
            JSON.stringify({
              original: Number(formData.prices.original),
              discounted: Number(formData.prices.discounted)
            })
          )
        } else if (isEditMode) {
          submitData.append('prices', JSON.stringify({}))
        }
      }

      if (file) submitData.append('file', file)

      const endpoint = isEditMode
        ? formData.postType === 'food'
          ? API_ENDPOINTS.food.update(editId)
          : API_ENDPOINTS.advertisement.update(editId)
        : formData.postType === 'food'
          ? API_ENDPOINTS.food.create
          : API_ENDPOINTS.advertisement.create

      loadingToast = showLoading(isEditMode ? 'Saving your changes...' : 'Uploading your post...')

      if (isEditMode) {
        await axios.put(endpoint, submitData, multipartConfig)
      } else {
        await axios.post(endpoint, submitData, multipartConfig)
      }

      updateToSuccess(
        loadingToast,
        isEditMode
          ? 'Post updated successfully!'
          : `${formData.postType === 'food' ? 'Food' : 'Advertisement'} post created successfully!`
      )

      // Pull fresh posts before navigating so the profile/dashboard never
      // renders a stale list after a create or edit.
      await refresh()

      setTimeout(() => navigate(isEditMode ? '/partner-dashboard' : '/partner-profile'), 1200)
    } catch (error) {
      console.error('Create post error:', error)
      const serverMsg =
        error?.response?.data?.error || error?.message || 'Failed to save post'
      if (loadingToast) {
        updateToError(loadingToast, serverMsg)
      } else {
        showError(serverMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (isEditMode && !prefillDone) {
    return (
      <div className="min-h-screen bg-[#f7f2e8] text-[#1a1208]">
        <Navbar />
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24">
          <div className="sk-surface flex h-20 w-20 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
          </div>
          <p className="mt-5 font-sans text-sm font-semibold text-[#6b6460]">
            Loading your post…
          </p>
        </div>
      </div>
    )
  }

  if (isEditMode && loadError) {
    return (
      <div className="min-h-screen bg-[#f7f2e8] text-[#1a1208]">
        <Navbar />
        <div className="mx-auto max-w-xl px-4 py-20">
          <div className="sk-surface p-8 text-center">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff3e0] text-[#e55a00] shadow-[inset_0_2px_4px_rgba(26,18,8,0.08)]">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl font-bold">Post not available</h1>
            <p className="mt-3 font-sans text-sm leading-relaxed text-[#6b6460]">{loadError}</p>
            <button
              type="button"
              onClick={() => navigate('/partner-dashboard')}
              className={`${primaryButtonClass} mt-6`}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mediaRequired = !isEditMode || !existingMedia || formData.type !== existingMedia.type
  const isFood = formData.postType === 'food'

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#1a1208]">
      <Navbar />

      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_18%_0%,rgba(255,184,0,0.16),transparent_42%),radial-gradient(circle_at_82%_10%,rgba(255,106,0,0.14),transparent_46%)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-5 inline-flex items-center gap-2 rounded-full px-1 py-1 font-sans text-sm font-semibold text-[#6b6460] transition-colors hover:text-[#1a1208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <span className="inline-flex items-center gap-2 rounded-full border border-[#e6d9c4] bg-[#fffdf8]/85 px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[#e55a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Sparkles className="h-3.5 w-3.5" />
                Partner studio
              </span>

              <h1 className="mt-4 font-serif text-4xl font-black leading-[1.05] sm:text-5xl">
                {isEditMode ? (
                  <>
                    Polish your <span className="italic text-[#ff6a00]">post.</span>
                  </>
                ) : (
                  <>
                    Create something <span className="italic text-[#ff6a00]">delicious.</span>
                  </>
                )}
              </h1>

              <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-[#6b6460] sm:text-base">
                {isEditMode
                  ? 'Update the details, swap the media, or change availability. Your changes go live as soon as you save.'
                  : 'Add a dish customers can order or run a promotion that fills the feed. Everything is saved to your partner profile.'}
              </p>
            </div>

            <div className="sk-surface sk-icon flex h-36 w-36 shrink-0 items-center justify-center self-start sm:self-center">
              <KitchenMark />
            </div>
          </header>

          <ErrorBoundary>
            <div className="sk-surface overflow-hidden p-5 sm:p-8">
              {isEditMode ? (
                <div className="mb-7 flex items-start gap-3 rounded-2xl border border-[#ffd04d]/70 bg-[#fff7dc] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-[#b07a00]" />
                  <p className="font-sans text-sm leading-relaxed text-[#6b5a2a]">
                    Editing <span className="font-bold text-[#1a1208]">{formData.name || 'your post'}</span>.
                    Upload new media only if you want to replace the current file.
                  </p>
                </div>
              ) : (
                <div className="mb-8 flex items-center gap-3">
                  <StepPill
                    number={1}
                    label="Choose type"
                    active={currentStep >= 1}
                    done={currentStep > 1}
                    onClick={currentStep === 2 ? () => setCurrentStep(1) : undefined}
                  />
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      currentStep >= 2 ? 'bg-[#ff6a00]' : 'bg-[#d9cbb4]'
                    }`}
                  />
                  <StepPill
                    number={2}
                    label="Add details"
                    active={currentStep >= 2}
                  />
                </div>
              )}

              {currentStep === 1 ? (
                <div>
                  <div className="mb-7 text-center">
                    <h2 className="font-serif text-2xl font-bold sm:text-3xl">
                      What are you sharing today?
                    </h2>
                    <p className="mt-2 font-sans text-sm text-[#6b6460]">
                      Pick a format, then continue to the details.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <PostTypeCard
                      active={formData.postType === 'food'}
                      onClick={() => selectPostType('food')}
                      icon={ShoppingBag}
                      title="Food item"
                      description="A dish customers can add to their cart, with pricing and availability."
                      bullets={['Set a price', 'Prep time & availability']}
                      tone="primary"
                    />
                    <PostTypeCard
                      active={formData.postType === 'advertisement'}
                      onClick={() => selectPostType('advertisement')}
                      icon={Megaphone}
                      title="Advertisement"
                      description="A promotion, discount or announcement that appears in the reels feed."
                      bullets={['Promotion type', 'Validity window']}
                      tone="accent"
                    />
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-3">
                    <button
                      type="button"
                      disabled={!formData.postType}
                      onClick={() => setCurrentStep(2)}
                      className={primaryButtonClass}
                    >
                      Continue to details
                      <ArrowRight className="h-5 w-5" />
                    </button>
                    <p className="font-sans text-xs text-[#9e9890]">
                      You can go back and change the format before publishing.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#e6d9c4] bg-[#fffdf8] px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-[#4a4038] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      {isFood ? (
                        <ShoppingBag className="h-4 w-4 text-[#e55a00]" />
                      ) : (
                        <Megaphone className="h-4 w-4 text-[#b07a00]" />
                      )}
                      {isFood ? 'Food item' : 'Advertisement'}
                    </span>

                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="inline-flex items-center gap-2 rounded-full px-1 py-1 font-sans text-sm font-semibold text-[#6b6460] transition-colors hover:text-[#1a1208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Change type
                      </button>
                    )}
                  </div>

                  <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                      <section className={sectionClass}>
                        <div className="mb-5 flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff3e0] text-[#e55a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(26,18,8,0.08)]">
                            <ImageIcon className="h-4 w-4" />
                          </span>
                          <h2 className="font-serif text-xl font-bold">The basics</h2>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <span className={labelClass}>Content format</span>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => changeType('image')}
                                aria-pressed={formData.type === 'image'}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-sans text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] ${
                                  formData.type === 'image'
                                    ? 'border-[#ff6a00] bg-[#fff3e0] text-[#1a1208] shadow-[inset_0_2px_4px_rgba(255,106,0,0.12),0_1px_0_rgba(255,255,255,0.9)]'
                                    : 'border-[#d9cbb4] bg-[#fffdf8] text-[#6b6460] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[#c4b49b]'
                                }`}
                              >
                                <ImageIcon className="h-4 w-4" />
                                Image post
                              </button>
                              <button
                                type="button"
                                onClick={() => changeType('video')}
                                aria-pressed={formData.type === 'video'}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-sans text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] ${
                                  formData.type === 'video'
                                    ? 'border-[#ff6a00] bg-[#fff3e0] text-[#1a1208] shadow-[inset_0_2px_4px_rgba(255,106,0,0.12),0_1px_0_rgba(255,255,255,0.9)]'
                                    : 'border-[#d9cbb4] bg-[#fffdf8] text-[#6b6460] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[#c4b49b]'
                                }`}
                              >
                                <Video className="h-4 w-4" />
                                Video reel
                              </button>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="name" className={labelClass}>
                              {isFood ? 'Food name' : 'Advertisement title'} *
                            </label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              value={formData.name}
                              onChange={updateField}
                              placeholder={
                                isFood
                                  ? 'e.g. Hyderabadi Dum Biryani'
                                  : 'e.g. 50% off weekend special'
                              }
                              aria-invalid={Boolean(errors.name)}
                              className={fieldClass(errors.name)}
                            />
                            {errors.name && <p className={errorClass}>{errors.name}</p>}
                          </div>

                          <div>
                            <label htmlFor="description" className={labelClass}>
                              Description *
                            </label>
                            <textarea
                              id="description"
                              name="description"
                              rows={4}
                              value={formData.description}
                              onChange={updateField}
                              placeholder={
                                isFood
                                  ? 'Describe the dish, ingredients and what makes it special...'
                                  : 'Describe the offer, terms and promotional details...'
                              }
                              aria-invalid={Boolean(errors.description)}
                              className={`${fieldClass(errors.description)} resize-none leading-relaxed`}
                            />
                            {errors.description && (
                              <p className={errorClass}>{errors.description}</p>
                            )}
                          </div>
                        </div>
                      </section>

                      <section className={sectionClass}>
                        <div className="mb-5 flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff8d6] text-[#b07a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(26,18,8,0.08)]">
                            {isFood ? (
                              <UtensilsCrossed className="h-4 w-4" />
                            ) : (
                              <TagIcon className="h-4 w-4" />
                            )}
                          </span>
                          <h2 className="font-serif text-xl font-bold">
                            {isFood ? 'Food details' : 'Promotion details'}
                          </h2>
                        </div>

                        {isFood ? (
                          <div className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label htmlFor="price" className={labelClass}>
                                  Price *
                                </label>
                                <div className="relative">
                                  <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                                  <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={formData.price}
                                    onChange={updateField}
                                    placeholder="249"
                                    aria-invalid={Boolean(errors.price)}
                                    className={`${fieldClass(errors.price)} pl-10`}
                                  />
                                </div>
                                {errors.price && <p className={errorClass}>{errors.price}</p>}
                              </div>

                              <div>
                                <label htmlFor="preparationTime" className={labelClass}>
                                  Preparation time *
                                </label>
                                <div className="relative">
                                  <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                                  <input
                                    id="preparationTime"
                                    name="preparationTime"
                                    type="number"
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                    value={formData.preparationTime}
                                    onChange={updateField}
                                    placeholder="25"
                                    aria-invalid={Boolean(errors.preparationTime)}
                                    className={`${fieldClass(errors.preparationTime)} pl-10 pr-12`}
                                  />
                                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-xs font-semibold text-[#9e9890]">
                                    min
                                  </span>
                                </div>
                                {errors.preparationTime && (
                                  <p className={errorClass}>{errors.preparationTime}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e6d9c4] bg-[#fffdf8] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                              <div>
                                <p className="font-sans text-sm font-bold text-[#1a1208]">
                                  Available for order
                                </p>
                                <p className="mt-0.5 font-sans text-xs text-[#6b6460]">
                                  Turn this off when the dish is out of stock.
                                </p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={formData.isAvailable}
                                aria-label="Available for order"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    isAvailable: !prev.isAvailable
                                  }))
                                }
                                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] focus-visible:ring-offset-2 ${
                                  formData.isAvailable
                                    ? 'border-[#c94e00] bg-gradient-to-b from-[#ff8533] to-[#e55a00]'
                                    : 'border-[#c4b49b] bg-[#d9cbb4]'
                                } shadow-[inset_0_2px_5px_rgba(26,18,8,0.25)]`}
                              >
                                <span
                                  className={`ml-1 inline-block h-6 w-6 rounded-full border border-white/70 bg-[#fffdf8] shadow-[0_2px_4px_rgba(26,18,8,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-200 ${
                                    formData.isAvailable ? 'translate-x-6' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div>
                              <label htmlFor="promotionType" className={labelClass}>
                                Promotion type *
                              </label>
                              <div className="relative">
                                <select
                                  id="promotionType"
                                  name="promotionType"
                                  value={formData.promotionType}
                                  onChange={updateField}
                                  aria-invalid={Boolean(errors.promotionType)}
                                  className={`${fieldClass(errors.promotionType)} appearance-none pr-10`}
                                >
                                  <option value="">Select promotion type</option>
                                  <option value="discount">Discount offer</option>
                                  <option value="bogo">Buy one get one</option>
                                  <option value="combo">Combo deal</option>
                                  <option value="seasonal">Seasonal special</option>
                                  <option value="announcement">General announcement</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                              </div>
                              {errors.promotionType && (
                                <p className={errorClass}>{errors.promotionType}</p>
                              )}
                            </div>

                            <div>
                              <span className={labelClass}>
                                Promotional pricing{' '}
                                <span className="normal-case tracking-normal text-[#9e9890]">
                                  (optional unless the offer needs it)
                                </span>
                              </span>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label
                                    htmlFor="originalPrice"
                                    className="mb-1.5 block font-sans text-xs font-semibold text-[#6b6460]"
                                  >
                                    Original price
                                  </label>
                                  <div className="relative">
                                    <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                                    <input
                                      id="originalPrice"
                                      name="prices.original"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      inputMode="decimal"
                                      value={formData.prices.original}
                                      onChange={(event) =>
                                        updatePrice('original', event.target.value)
                                      }
                                      placeholder="399"
                                      aria-invalid={Boolean(errors.originalPrice)}
                                      className={`${fieldClass(errors.originalPrice)} pl-10`}
                                    />
                                  </div>
                                  {errors.originalPrice && (
                                    <p className={errorClass}>{errors.originalPrice}</p>
                                  )}
                                </div>

                                <div>
                                  <label
                                    htmlFor="discountedPrice"
                                    className="mb-1.5 block font-sans text-xs font-semibold text-[#6b6460]"
                                  >
                                    Discounted price
                                  </label>
                                  <div className="relative">
                                    <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                                    <input
                                      id="discountedPrice"
                                      name="prices.discounted"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      inputMode="decimal"
                                      value={formData.prices.discounted}
                                      onChange={(event) =>
                                        updatePrice('discounted', event.target.value)
                                      }
                                      placeholder="299"
                                      aria-invalid={Boolean(errors.discountedPrice)}
                                      className={`${fieldClass(errors.discountedPrice)} pl-10`}
                                    />
                                  </div>
                                  {errors.discountedPrice && (
                                    <p className={errorClass}>{errors.discountedPrice}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label htmlFor="validUntil" className={labelClass}>
                                Valid until *
                              </label>
                              <div className="relative">
                                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                                <input
                                  id="validUntil"
                                  name="validUntil"
                                  type="datetime-local"
                                  min={minValidUntil}
                                  value={formData.validUntil}
                                  onChange={updateField}
                                  aria-invalid={Boolean(errors.validUntil)}
                                  className={`${fieldClass(errors.validUntil)} pl-10`}
                                />
                              </div>
                              {errors.validUntil && (
                                <p className={errorClass}>{errors.validUntil}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="promoCode" className={labelClass}>
                                Promo code{' '}
                                <span className="normal-case tracking-normal text-[#9e9890]">
                                  (optional)
                                </span>
                              </label>
                              <input
                                id="promoCode"
                                name="promoCode"
                                type="text"
                                value={formData.promoCode}
                                onChange={updateField}
                                placeholder="WEEKEND50"
                                className={`${fieldClass(false)} uppercase placeholder:normal-case`}
                              />
                            </div>
                          </div>
                        )}
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className={sectionClass}>
                        <div className="mb-4 flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff3e0] text-[#e55a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(26,18,8,0.08)]">
                            <Upload className="h-4 w-4" />
                          </span>
                          <h2 className="font-serif text-xl font-bold">Media</h2>
                        </div>

                        <input
                          id="file-upload"
                          type="file"
                          accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                          onChange={handleFileChange}
                          className="sr-only"
                        />

                        {!filePreview ? (
                          <label
                            htmlFor="file-upload"
                            className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-[#ff6a00]/30 ${
                              errors.file
                                ? 'border-red-400 bg-red-50/40'
                                : 'border-[#d9cbb4] bg-[#fffdf8]/75 hover:border-[#ffb800] hover:bg-[#fff8d6]/40'
                            }`}
                          >
                            <span className="sk-icon inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-b from-[#fff3e0] to-[#ffd9b3] text-[#e55a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_6px_rgba(26,18,8,0.12)]">
                              <Upload className="h-6 w-6" />
                            </span>
                            <span className="mt-3 font-sans text-sm font-bold text-[#1a1208]">
                              Upload {formData.type === 'image' ? 'an image' : 'a video'}
                            </span>
                            <span className="mt-1 font-sans text-xs text-[#6b6460]">
                              {formData.type === 'image'
                                ? 'JPG, PNG or GIF · up to 5MB'
                                : 'MP4 or MOV · up to 10MB'}
                            </span>
                          </label>
                        ) : (
                          <div className="relative overflow-hidden rounded-2xl border-4 border-[#fffdf8] shadow-[0_10px_24px_rgba(26,18,8,0.16)]">
                            {formData.type === 'image' ? (
                              <img
                                src={filePreview}
                                alt={`${formData.name || 'Post'} preview`}
                                className="max-h-64 w-full object-cover"
                              />
                            ) : (
                              <video
                                src={filePreview}
                                controls
                                className="max-h-64 w-full bg-black object-contain"
                              />
                            )}

                            <div className="absolute right-2 top-2 flex gap-2">
                              <label
                                htmlFor="file-upload"
                                title="Replace media"
                                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#1a1208] shadow-md transition-colors hover:bg-white focus-within:ring-2 focus-within:ring-[#ff6a00]"
                              >
                                <Pencil className="h-4 w-4" />
                              </label>
                              {(file || !existingMedia) && (
                                <button
                                  type="button"
                                  onClick={clearMedia}
                                  title="Remove media"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 text-red-500 shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {!file && existingMedia && (
                              <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">
                                Current media
                              </span>
                            )}
                          </div>
                        )}

                        {errors.file && <p className={errorClass}>{errors.file}</p>}

                        <p className="mt-3 font-sans text-[11px] leading-relaxed text-[#9e9890]">
                          {mediaRequired
                            ? formData.type === 'image'
                              ? 'A clear photo helps customers decide faster.'
                              : 'Keep it short and appetising — reels autoplay in the feed.'
                            : 'Your current file stays in place unless you upload a replacement.'}
                        </p>
                      </section>

                      <section className={sectionClass}>
                        <div className="mb-4 flex items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff8d6] text-[#b07a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(26,18,8,0.08)]">
                            <Hash className="h-4 w-4" />
                          </span>
                          <h2 className="font-serif text-xl font-bold">Tags</h2>
                        </div>

                        <div className="flex gap-2">
                          <div className="relative min-w-0 flex-1">
                            <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e9890]" />
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(event) => setTagInput(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  addTag()
                                }
                              }}
                              placeholder="biryani, spicy..."
                              className={`${fieldClass(false)} pl-10`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addTag}
                            aria-label="Add tag"
                            className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-[#c94e00] bg-gradient-to-b from-[#ff8533] to-[#e55a00] text-[#1a1208] shadow-[0_3px_0_#b64a00,inset_0_1px_0_rgba(255,255,255,0.5)] transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] focus-visible:ring-offset-2"
                          >
                            <Plus className="h-5 text-white w-5" strokeWidth={3} />
                          </button>
                        </div>

                        {formData.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#e6d9c4] bg-[#fffdf8] px-3 py-1.5 font-sans text-xs font-bold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(26,18,8,0.06)]"
                              >
                                <Hash className="h-3 w-3 text-[#ff6a00]" />
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  aria-label={`Remove ${tag}`}
                                  className="ml-0.5 rounded-full p-0.5 text-[#9e9890] transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="mt-3 font-sans text-[11px] leading-relaxed text-[#9e9890]">
                          Optional. Tags help people find this post in search and discovery.
                        </p>
                      </section>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={`${primaryButtonClass} w-full`}>
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isEditMode ? 'Saving changes...' : 'Publishing...'}
                      </>
                    ) : (
                      <>
                        {isFood ? (
                          <ShoppingBag className="h-5 w-5" />
                        ) : (
                          <Megaphone className="h-5 w-5" />
                        )}
                        {isEditMode
                          ? 'Save changes'
                          : `Publish ${isFood ? 'food item' : 'advertisement'}`}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export default CreateFood
