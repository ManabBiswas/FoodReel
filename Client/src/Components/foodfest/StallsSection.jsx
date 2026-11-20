import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { useAuth } from '../../hooks/useAuth'
import { swrFetcher } from '../../utils/fetcher'
import { extractApiError, showError, showSuccess, showWarning } from '../../utils/toast'
import { formatCurrency } from '../../utils/foodfest'
import {
  Store,
  ThumbsUp,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  LoaderCircle,
  MessageSquareText,
} from 'lucide-react'

const metaRow = (Icon, text) =>
  text ? (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
      <span className="text-xs leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
        {text}
      </span>
    </div>
  ) : null

const ReviewForm = ({ stallId, onDone }) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    if (!comment.trim()) {
      showWarning('Please write a short review.')
      return
    }
    setSubmitting(true)
    try {
      await axios.post(
        API_ENDPOINTS.foodfest.stallReviews(stallId),
        { rating, comment: comment.trim() },
        axiosConfig
      )
      showSuccess('Review posted')
      setComment('')
      onDone()
    } catch (error) {
      showError(extractApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-xl p-3" style={{ background: 'var(--color-surface-muted)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold font-sans" style={{ color: 'var(--color-text-muted)' }}>
          Your rating
        </span>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="h-4 w-4"
              fill={value <= rating ? '#FFB800' : 'none'}
              style={{ color: value <= rating ? '#FFB800' : 'var(--color-text-faint)' }}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="What did you think of this stall?"
        className="mt-2 w-full resize-none rounded-lg border px-3 py-2 text-sm font-sans outline-none"
        style={{ background: 'var(--color-background-white)', borderColor: 'var(--color-border-light)', color: 'var(--color-text-base)' }}
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold font-sans disabled:opacity-50"
        style={{ background: 'var(--color-primary)', color: '#fff' }}
      >
        {submitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
        Post review
      </button>
      <p className="mt-1.5 text-[10px] font-sans" style={{ color: 'var(--color-text-faint)' }}>
        Reviews are for ticket holders of this event — one per stall.
      </p>
    </form>
  )
}

const StallCard = ({ stall, isAuthenticated, authType, onUpvote, upvoting }) => {
  const navigate = useNavigate()
  const [showReviews, setShowReviews] = useState(false)

  const { data: reviewData, mutate: mutateReviews } = useSWR(
    showReviews ? API_ENDPOINTS.foodfest.stallReviews(stall._id) : null,
    swrFetcher
  )
  const reviews = reviewData?.reviews ?? []

  const handleUpvote = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }
    if (authType !== 'user') {
      showWarning('Sign in with a user account to upvote.')
      return
    }
    onUpvote(stall)
  }

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl"
      style={{ background: 'var(--color-background-white)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}
    >
      {stall.image ? (
        <img src={stall.image} alt={`${stall.owner.name} stall`} className="h-32 w-full object-cover" decoding="async" />
      ) : (
        <div
          className="flex h-32 w-full items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.12), rgba(255,184,0,0.18))' }}
        >
          <Store className="h-10 w-10" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold leading-tight" style={{ color: 'var(--color-text-base)' }}>
            {stall.owner.name}
          </h3>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide font-sans"
            style={
              stall.isOpen
                ? { background: '#DCFCE7', color: '#15803D' }
                : { background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }
            }
          >
            {stall.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          {metaRow(MapPin, stall.position)}
          {metaRow(Clock, stall.timings)}
          {metaRow(Sparkles, stall.conditions)}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>
            <Star className="h-3.5 w-3.5" fill="#FFB800" style={{ color: '#FFB800' }} />
            {stall.rating > 0 ? stall.rating.toFixed(1) : '—'}
            {stall.ratingCount > 0 ? (
              <span className="font-normal" style={{ color: 'var(--color-text-faint)' }}>({stall.ratingCount})</span>
            ) : null}
          </span>

          <button
            type="button"
            onClick={handleUpvote}
            disabled={upvoting}
            aria-pressed={stall.upvoted}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-sans transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={
              stall.upvoted
                ? { background: 'var(--color-primary)', color: '#fff' }
                : { background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }
            }
          >
            <ThumbsUp className="h-3.5 w-3.5" fill={stall.upvoted ? '#fff' : 'none'} />
            {stall.upvoteCount}
          </button>
        </div>

        {stall.items.length > 0 ? (
          <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest font-sans" style={{ color: 'var(--color-text-faint)' }}>
              On the menu
            </p>
            <ul className="mt-1.5 space-y-1">
              {stall.items.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-2 text-xs font-sans">
                  <span className="truncate" style={{ color: 'var(--color-text-base)' }}>{item.name}</span>
                  {item.price != null ? (
                    <span className="shrink-0 font-bold" style={{ color: 'var(--color-primary)' }}>
                      {formatCurrency(item.price)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={() => setShowReviews((open) => !open)}
            className="inline-flex items-center gap-1.5 text-xs font-bold font-sans transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
            aria-expanded={showReviews}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Reviews
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showReviews ? 'rotate-180' : ''}`} />
          </button>

          {showReviews ? (
            <div className="mt-2">
              {reviewData ? (
                reviews.length > 0 ? (
                  <ul className="space-y-2">
                    {reviews.map((review) => (
                      <li key={review._id} className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface-muted)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>
                            {review.user ? `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'FoodReel user' : 'Former member'}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold font-sans" style={{ color: '#B45309' }}>
                            <Star className="h-3 w-3" fill="#FFB800" style={{ color: '#FFB800' }} />
                            {review.rating}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
                          {review.comment}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                    No reviews yet — be the first ticket holder to write one.
                  </p>
                )
              ) : (
                <p className="inline-flex items-center gap-1.5 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Loading reviews
                </p>
              )}

              {isAuthenticated && authType === 'user' ? (
                <ReviewForm stallId={stall._id} onDone={() => mutateReviews()} />
              ) : (
                <p className="mt-2 text-[11px] font-sans" style={{ color: 'var(--color-text-faint)' }}>
                  Sign in with a user account to review.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/**
 * Approved stalls for one event — public section on the event detail page.
 * Upvote toggles server-side; reviews require a paid ticket (server enforces
 * and returns the message shown to the user).
 */
const StallsSection = ({ eventId }) => {
  const { isAuthenticated, authType } = useAuth()
  const [upvotingId, setUpvotingId] = useState(null)

  const { data, mutate } = useSWR(
    eventId ? API_ENDPOINTS.foodfest.stalls(eventId) : null,
    swrFetcher,
    { revalidateOnFocus: false }
  )
  const stalls = data?.stalls ?? []
  if (stalls.length === 0) return null

  const handleUpvote = async (stall) => {
    setUpvotingId(stall._id)
    try {
      await axios.post(API_ENDPOINTS.foodfest.stallUpvote(stall._id), {}, axiosConfig)
      await mutate()
    } catch (error) {
      showError(extractApiError(error))
    } finally {
      setUpvotingId(null)
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
        Stalls
      </h2>
      <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
        Meet the kitchens at the fest. Upvote your favourites — ticket holders can review.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {stalls.map((stall) => (
          <StallCard
            key={stall._id}
            stall={stall}
            isAuthenticated={isAuthenticated}
            authType={authType}
            onUpvote={handleUpvote}
            upvoting={upvotingId === stall._id}
          />
        ))}
      </div>
    </section>
  )
}

export default StallsSection
