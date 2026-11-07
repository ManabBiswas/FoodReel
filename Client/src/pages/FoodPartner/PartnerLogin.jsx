import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { showError, showSuccess } from '../../utils/toast'
import AuthShell from '../../Components/auth/AuthShell'
import AuthField from '../../Components/auth/AuthField'

const PartnerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { isAuthenticated, isPartner, loginPartner } = useAuth()

  useEffect(() => {
    if (isAuthenticated && isPartner) {
      navigate('/partner-dashboard')
    }
  }, [isAuthenticated, isPartner, navigate])

  const validateForm = () => {
    const newErrors = {}

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
      showError('Please check the form for errors')
      setLoading(false)
      return
    }

    const result = await loginPartner(formData)

    if (result.success) {
      showSuccess('Login successful! Redirecting to dashboard...')
      setFormData({ email: '', password: '' })
      navigate('/partner-dashboard', { replace: true })
    } else {
      setErrors({ general: result.error })
      showError(result.error || 'Login failed. Please try again.')
    }

    setLoading(false)
  }

  return (
    <AuthShell
      mode="partner"
      eyebrow="Partner access"
      title={
        <>
          Back in the{' '}
          <span className="italic text-[#e55a00]">kitchen.</span>
        </>
      }
      subtitle="Sign in to manage your menu, orders, and FoodFest stalls from one dashboard."
      image="https://images.pexels.com/photos/31860145/pexels-photo-31860145.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop"
      imageAlt="A chef plating a tandoori dish in a warmly lit kitchen"
      sideEyebrow="For food partners"
      sideTitle="Your kitchen, on the feed."
      sideCopy="Turn visual discovery into orders and keep every service detail in one place."
      sideNote="Cook. Post. Grow."
      footer={
        <>
          New partner?{' '}
          <Link
            to="/partner-register"
            className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
          >
            Create a partner account
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
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password}
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            <>
              Sign in to dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default PartnerLogin
