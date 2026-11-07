import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { showError, showSuccess } from '../../utils/toast'
import AuthShell from '../../Components/auth/AuthShell'
import AuthField from '../../Components/auth/AuthField'

const UserLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { loginUser } = useAuth()

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }))
    if (errors[event.target.name]) {
      setErrors((current) => ({ ...current, [event.target.name]: '' }))
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setErrors({})

    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const result = await loginUser(formData)
    if (result.success) {
      showSuccess('Login successful!')
      const from = location.state?.from
      const safeFrom =
        typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
          ? from
          : '/'
      navigate(safeFrom, { replace: true })
    } else {
      setErrors({ general: result.error })
      showError(result.error || 'Login failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <AuthShell
      mode="user"
      eyebrow="Welcome back"
      title={
        <>
          Pick up where you{' '}
          <span className="italic text-[#e55a00]">left off.</span>
        </>
      }
      subtitle="Sign in to track orders, save reels, and keep every FoodFest pass in one place."
      image="https://images.pexels.com/photos/38349089/pexels-photo-38349089.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop"
      imageAlt="A warmly lit Indian restaurant dining room"
      sideEyebrow="The FoodReel table"
      sideTitle="A seat at the table."
      sideCopy="Your saved reels, live orders, and FoodFest passes are waiting."
      sideNote="Watch. Connect. Taste."
      footer={
        <>
          New to FoodReel?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
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
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
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
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default UserLogin
