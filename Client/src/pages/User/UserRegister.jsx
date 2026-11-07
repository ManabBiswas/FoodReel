import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { showError, showSuccess } from '../../utils/toast'
import { API_ENDPOINTS, multipartConfig } from '../../config/Api'
import AuthShell from '../../Components/auth/AuthShell'
import AuthField from '../../Components/auth/AuthField'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  mobile: ''
}

const UserRegister = () => {
  const { checkAuth } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'

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

    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const submitData = new FormData()
      submitData.append('firstName', formData.firstName)
      submitData.append('lastName', formData.lastName)
      submitData.append('email', formData.email)
      submitData.append('password', formData.password)
      submitData.append('mobile', formData.mobile)

      await axios.post(API_ENDPOINTS.auth.userRegister, submitData, multipartConfig)

      showSuccess('Registration successful!')
      await checkAuth(true)
      showSuccess('Welcome!')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Registration error:', error)
      const serverMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Registration failed. Please try again.'
      setErrors({ general: serverMessage })
      showError(serverMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      mode="user"
      eyebrow="Join the table"
      title={
        <>
          Start with a{' '}
          <span className="italic text-[#e55a00]">craving.</span>
        </>
      }
      subtitle="Create an account to save reels, order from local kitchens, and keep every event ticket together."
      image="https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop"
      imageAlt="Butter chicken and garlic naan on a restaurant table"
      sideEyebrow="The FoodReel edit"
      sideTitle="From scroll to table."
      sideCopy="Save what looks good, order what you crave, and keep the whole food trail in one place."
      sideNote="Watch. Connect. Taste."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="firstName"
            label="First name"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Manab"
            autoComplete="given-name"
            error={errors.firstName}
          />
          <AuthField
            id="lastName"
            label="Last name"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Biswas"
            autoComplete="family-name"
            error={errors.lastName}
          />
        </div>

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="you@example.com"
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

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default UserRegister
