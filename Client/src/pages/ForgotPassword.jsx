import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { showError } from '../utils/toast'
import { API_ENDPOINTS } from '../config/Api'
import AuthShell from '../Components/auth/AuthShell'
import AuthField from '../Components/auth/AuthField'

const ForgotPassword = () => {
  const [searchParams] = useSearchParams()
  const isPartner = searchParams.get('mode') === 'partner'

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const loginPath = isPartner ? '/partner-login' : '/login'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      showError('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Could not send the reset link. Please try again.')
      }
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send the reset link. Please try again.')
      showError(err.message || 'Could not send the reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      mode={isPartner ? 'partner' : 'user'}
      eyebrow="Reset your password"
      title={
        <>
          Lost your{' '}
          <span className="italic text-[#e55a00]">password?</span>
        </>
      }
      subtitle={
        isPartner
          ? 'Enter the email on your partner account and we will send a reset link.'
          : 'Enter the email on your account and we will send a reset link.'
      }
      image="https://images.pexels.com/photos/38349089/pexels-photo-38349089.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop"
      imageAlt="A warmly lit Indian restaurant dining room"
      sideEyebrow="The FoodReel table"
      sideTitle="A seat at the table."
      sideCopy="Your saved reels, live orders, and FoodFest passes are waiting."
      sideNote="Watch. Connect. Taste."
      footer={
        <>
          Remembered it?{' '}
          <Link
            to={loginPath}
            className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-xl border border-[#cfe3c4] bg-[#f2f8ee] px-4 py-4 font-sans text-sm text-[#3f5a30]"
          >
            <MailCheck className="mb-2 h-5 w-5" aria-hidden="true" />
            If that address has an account, a reset link is on its way. The link
            expires in 30 minutes.
          </div>
          <Link
            to={loginPath}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9d0be] bg-white px-5 py-3.5 font-sans text-sm font-bold text-[#3f3428] transition-colors hover:border-[#ff6a00] hover:text-[#1a1208]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-[#f0c7b4] bg-[#fff4ee] px-4 py-3 font-sans text-sm text-[#9a3412]"
            >
              {error}
            </div>
          )}

          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (error) setError('')
            }}
            placeholder="you@example.com"
            autoComplete="email"
            error={error}
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending link...
              </>
            ) : (
              <>
                Send reset link
                <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

export default ForgotPassword
