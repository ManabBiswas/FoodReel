import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { showError } from '../utils/toast'
import { API_ENDPOINTS } from '../config/Api'
import AuthShell from '../Components/auth/AuthShell'
import AuthField from '../Components/auth/AuthField'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      showError('Password must be at least 6 characters long')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      showError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.auth.resetPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Could not reset the password. Please try again.')
      }
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not reset the password. Please try again.')
      showError(err.message || 'Could not reset the password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const signInLinks = (
    <>
      <Link
        to="/login"
        className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
      >
        Sign in as a food lover
      </Link>
      <span className="text-[#9e9890]"> or </span>
      <Link
        to="/partner-login"
        className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
      >
        as a partner
      </Link>
    </>
  )

  return (
    <AuthShell
      mode="user"
      eyebrow="Set a new password"
      title={
        <>
          Choose a new{' '}
          <span className="italic text-[#e55a00]">password.</span>
        </>
      }
      subtitle="Your old sessions are signed out once the new password is saved."
      image="https://images.pexels.com/photos/38349089/pexels-photo-38349089.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop"
      imageAlt="A warmly lit Indian restaurant dining room"
      sideEyebrow="The FoodReel table"
      sideTitle="A seat at the table."
      sideCopy="Your saved reels, live orders, and FoodFest passes are waiting."
      sideNote="Watch. Connect. Taste."
      footer={done ? null : signInLinks}
    >
      {!token ? (
        <div
          role="alert"
          className="rounded-xl border border-[#f0c7b4] bg-[#fff4ee] px-4 py-4 font-sans text-sm text-[#9a3412]"
        >
          This reset link is missing its token. Open the link from your email
          again, or{' '}
          <Link to="/forgot-password" className="font-semibold underline">
            request a new one
          </Link>
          .
        </div>
      ) : done ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-xl border border-[#cfe3c4] bg-[#f2f8ee] px-4 py-4 font-sans text-sm text-[#3f5a30]"
          >
            <ShieldCheck className="mb-2 h-5 w-5" aria-hidden="true" />
            Password updated. You can sign in now — any previous sessions have
            been signed out.
          </div>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800]"
          >
            Continue to sign in
            <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
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
            id="password"
            label="New password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              if (error) setError('')
            }}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            error={error && password.length < 6 ? error : ''}
          />

          <AuthField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value)
              if (error) setError('')
            }}
            placeholder="Repeat the new password"
            autoComplete="new-password"
            error={error && confirm && password !== confirm ? error : ''}
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                Set new password
                <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

export default ResetPassword
