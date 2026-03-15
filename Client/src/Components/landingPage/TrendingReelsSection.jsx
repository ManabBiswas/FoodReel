import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { Loader2, ArrowRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

/* Fallback placeholder cards while loading or on error */
const PLACEHOLDER_LABELS = ['Artisan Sushi', 'Wood-fire Pizza', 'Street Tacos', 'Spicy Ramen']

const ReelCard = ({ reel, index }) => {
  const [imgError, setImgError] = useState(false)
  const src = !imgError && (reel.image || reel.video)

  return (
    <Link to="/reels" className="group block">
      <div
        className="relative overflow-hidden rounded-2xl bg-surface-muted"
        style={{ aspectRatio: '3/4' }}
      >
        {/* Media */}
        {src ? (
          <img
            src={src}
            alt={reel.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Coloured gradient fallback */
          <div
            className="absolute inset-0"
            style={{
              background: [
                'linear-gradient(135deg,#FF6B35,#F7931E)',
                'linear-gradient(135deg,#2C3E50,#4A90D9)',
                'linear-gradient(135deg,#C0392B,#E74C3C)',
                'linear-gradient(135deg,#1ABC9C,#16A085)',
              ][index % 4],
            }}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
            <Play className="w-6 h-6 fill-primary text-primary ml-1" />
          </div>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm font-bold font-sans line-clamp-2">
            {reel.name || PLACEHOLDER_LABELS[index]}
          </p>
        </div>
      </div>
    </Link>
  )
}

const TrendingReelsSection = () => {
  const [reels, setReels]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchTrending = async () => {
      try {
        setLoading(true)
        setError('')

        const { data } = await axios.get(API_ENDPOINTS.food.getTrending, {
          ...axiosConfig,
          params: { limit: 4 },
        })

        if (!cancelled) {
          const formatted = (data.foods ?? []).slice(0, 4).map((food) => ({
            id:    food._id,
            name:  food.name,
            image: food.image  ?? null,
            video: food.video  ?? null,
            type:  food.type,
          }))
          setReels(formatted)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Trending reels fetch failed:', err)
          setError('Could not load trending reels.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTrending()
    return () => { cancelled = true }
  }, [])

  /* Skeleton placeholders */
  const renderSkeletons = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl bg-border-light animate-pulse"
        style={{ aspectRatio: '3/4', background: 'var(--color-border-light)' }}
      />
    ))

  /* Empty-state reels when backend returns nothing */
  const displayReels = reels.length > 0
    ? reels
    : PLACEHOLDER_LABELS.map((name, i) => ({ id: i, name, image: null, video: null }))

  return (
    <section
      className="section-padding px-6"
      style={{ background: 'var(--color-surface-muted)' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div className="space-y-1">
            <h2
              className="font-serif text-4xl font-bold md:text-5xl"
              style={{ color: 'var(--color-text-base)' }}
            >
              Trending Reels
            </h2>
            <p className="font-sans" style={{ color: 'var(--color-text-muted)' }}>
              What everyone's craving right now
            </p>
          </div>
          <Link
            to="/reels"
            className="hidden sm:flex items-center gap-1.5 font-bold font-sans text-sm hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{renderSkeletons()}</div>
        ) : error ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {displayReels.map((reel, i) => (
              <ReelCard key={reel.id} reel={reel} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {displayReels.map((reel, i) => (
              <ReelCard key={reel.id} reel={reel} index={i} />
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-10 text-center sm:hidden">
          <Link to="/reels">
            <button
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 font-bold text-white font-sans transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              View All Reels <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TrendingReelsSection