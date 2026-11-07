import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Navigation } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { showError, showInfo, showSuccess } from '../../utils/toast'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import AuthShell from '../../Components/auth/AuthShell'
import AuthField from '../../Components/auth/AuthField'

const initialForm = {
  companyName: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  address: '',
  latitude: null,
  longitude: null
}

const PartnerRegister = () => {
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const navigate = useNavigate()
  const { checkAuth } = useAuth()

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLoading(false)
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          setLocationLoading(false)
          let errorMessage = 'Unable to retrieve location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Mobile number must be 10 digits'
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required'

    return newErrors
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setErrors({})

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      showInfo('Getting your location...')
      const location = await getLocation()

      const submitData = {
        companyName: formData.companyName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        address: formData.address,
        latitude: location.latitude,
        longitude: location.longitude
      }

      const response = await axios.post(
        API_ENDPOINTS.auth.partnerRegister,
        submitData,
        axiosConfig
      )

      if (response.status < 300) {
        await checkAuth(true)
      }

      showSuccess('Registration successful! Redirecting...')
      setFormData(initialForm)
      navigate('/CreateFood')
    } catch (error) {
      console.error('Registration error: ', error)
      if (error.message && error.message.includes('location')) {
        showError(
          `Location Error: ${error.message}. Please enable location access and try again.`
        )
      } else {
        const serverMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Registration failed'
        setErrors({ general: serverMessage })
        showError(serverMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      mode="partner"
      eyebrow="Join the network"
      title={
        <>
          Put your kitchen{' '}
          <span className="italic text-[#e55a00]">on the reel.</span>
        </>
      }
      subtitle="Create a partner account to publish your menu, take orders, and apply for FoodFest stalls."
      image="https://images.pexels.com/photos/37103113/pexels-photo-37103113.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop"
      imageAlt="A chef in traditional attire serving Indian cuisine"
      sideEyebrow="For food partners"
      sideTitle="The pass is yours."
      sideCopy="Menus, orders, and stalls — one dashboard, one service."
      sideNote="Cook. Post. Grow."
      footer={
        <>
          Already a partner?{' '}
          <Link
            to="/partner-login"
            className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {errors.general && (
          <div
            role="alert"
            className="rounded-xl border border-[#f0c7b4] bg-[#fff4ee] px-4 py-3 font-sans text-sm text-[#9a3412]"
          >
            {errors.general}
          </div>
        )}

        <AuthField
          id="companyName"
          label="Company name"
          value={formData.companyName}
          onChange={handleInputChange}
          placeholder="Your restaurant or kitchen"
          autoComplete="organization"
          error={errors.companyName}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@restaurant.com"
            autoComplete="email"
            error={errors.email}
          />
          <AuthField
            id="mobile"
            label="Mobile number"
            type="tel"
            value={formData.mobile}
            onChange={handleInputChange}
            placeholder="10-digit mobile number"
            autoComplete="tel"
            inputMode="numeric"
            error={errors.mobile}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            error={errors.password}
          />
          <AuthField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </div>

        <AuthField
          id="address"
          as="textarea"
          label="Shop address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="The exact location of your shop"
          rows={3}
          autoComplete="street-address"
          error={errors.address}
        />

        <div className="flex items-start gap-3 rounded-xl border border-[#e6d9c4] bg-[#fffdf8] px-4 py-3">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[#e55a00]" aria-hidden="true" />
          <p className="font-sans text-xs leading-relaxed text-[#5f5548]">
            We use your device location once, at sign-up, to place your shop on the map.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {locationLoading ? 'Getting location...' : 'Creating account...'}
            </>
          ) : (
            <>
              Create partner account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default PartnerRegister
