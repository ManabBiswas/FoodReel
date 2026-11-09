import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { ArrowRight, Pause, Play } from 'lucide-react'
import { getImageKitThumbnail } from '../../utils/imagekit.utils'

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg,#FF6B35,#F7931E)',
  'linear-gradient(135deg,#2C3E50,#4A90D9)',
  'linear-gradient(135deg,#C0392B,#E74C3C)',
  'linear-gradient(135deg,#1ABC9C,#16A085)',
  'linear-gradient(135deg,#7B4397,#DC2430)',
]

const GRID_CLASS = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'

const ReelCard = ({ reel, index, visible }) => {
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  const hasVideo = reel.type === 'video' && Boolean(reel.video) && !videoError
  const hasImage = Boolean(reel.image) && !imageError
  const showVideo = hasVideo
  const showImage = !hasVideo && hasImage
  const label = reel.name || 'Watch on FoodReel'

  const fallbackBackground = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]
  const mediaClass =
    'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transform-none motion-reduce:transition-none'

  /* Paint a representative first frame without starting playback. Skip this
     while the video is already playing so a hover-started preview isn't
     interrupted when metadata finally arrives. */
  const seekToFirstFrame = () => {
    const video = videoRef.current
    if (!video || !video.paused) return
    if (!Number.isFinite(video.duration) || video.duration <= 0) return

    try {
      video.currentTime = Math.min(0.1, video.duration / 2)
    } catch {
      // Some browsers refuse a seek before enough data is buffered. The
      // gradient underneath keeps the card readable in that case.
    }
  }

  const play = () => {
    const video = videoRef.current
    if (!video) return

    const promise = video.play()
    if (promise && typeof promise.catch === 'function') {
      // Autoplay can be rejected; the play overlay stays visible so the
      // visitor can start it with a click instead.
      promise.catch(() => {})
    }
  }

  const pauseAndRewind = () => {
    const video = videoRef.current
    if (!video) return

    video.pause()
    seekToFirstFrame()
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) play()
    else video.pause()
  }

  return (
    <div
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: visible ? `${index * 75}ms` : '0ms' }}
    >
      <div
        className={`group relative overflow-hidden rounded-2xl bg-surface-muted transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none ${
          showVideo ? 'cursor-pointer' : ''
        }`}
        style={{ aspectRatio: '3/4' }}
      >
        {/* Always paint a gradient underneath so a slow or failed video never
            leaves a black hole in the grid. */}
        <div className="absolute inset-0" style={{ background: fallbackBackground }} />

        {showVideo ? (
          <video
            ref={videoRef}
            src={reel.video}
            poster={hasImage ? reel.image : undefined}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={seekToFirstFrame}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setVideoError(true)}
            aria-hidden="true"
            tabIndex={-1}
            className={mediaClass}
            style={{ background: fallbackBackground }}
          />
        ) : showImage ? (
          <img
            src={reel.image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className={mediaClass}
          />
        ) : null}

        {showVideo ? (
          <>
            {/* Play affordance while paused */}
            <div
              className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/25 transition-opacity duration-300 motion-reduce:transition-none ${
                playing ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <Play className="ml-1 h-6 w-6 fill-primary text-primary" aria-hidden="true" />
              </span>
            </div>

            {/* Pause affordance while the preview is running */}
            <span
              className={`pointer-events-none absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
                playing ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Pause className="h-3.5 w-3.5 fill-white text-white" aria-hidden="true" />
            </span>

            {/* Full-card control: hover plays, click/tap toggles, leave pauses */}
            <button
              type="button"
              onClick={togglePlayback}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') play()
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') pauseAndRewind()
              }}
              aria-label={playing ? `Pause ${label}` : `Play ${label}`}
              className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            />
          </>
        ) : null}

        {/* Bottom label */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
          <p className="line-clamp-2 text-sm font-bold font-sans text-white">{label}</p>
        </div>
      </div>
    </div>
  )
}

/* Fills the last slot when the API returns fewer than five reels, so the
   section ends on a useful action instead of a decorative placeholder. */
const SeeAllCard = ({ index, visible }) => (
  <div
    className={`hidden transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:block ${
      visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
    }`}
    style={{ transitionDelay: visible ? `${index * 75}ms` : '0ms' }}
  >
    <Link
      to="/reels"
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
      style={{ aspectRatio: '3/4', background: 'var(--color-background-dark)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: 'var(--color-primary)' }}
      />

      <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
        Fresh from the feed
      </span>

      <div className="relative">
        <p className="font-serif text-2xl font-bold leading-tight text-white">
          See all reels
        </p>
        <p className="mt-2 font-sans text-xs leading-relaxed text-white/60">
          Dishes from kitchens near you, updated daily.
        </p>
        <span
          className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1a1208] transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none"
          style={{ background: 'var(--color-primary)' }}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  </div>
)

const TrendingReelsSection = () => {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inView, setInView] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const fetchTrending = async () => {
      try {
        setLoading(true)
        setError('')

        const { data } = await axios.get(API_ENDPOINTS.food.getTrending, {
          ...axiosConfig,
          params: { limit: 5 },
        })

        if (!cancelled) {
          const formatted = (data.foods ?? []).slice(0, 5).map((food) => ({
            id: food._id,
            name: food.name,
            image: food.image || getImageKitThumbnail(food.video) || null,
            video: food.video ?? null,
            type: food.type,
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

  /* Reveal the cards only when the section scrolls into view, so the stagger
     is seen instead of finishing while the section is still off-screen. */
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -48px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  /* Flip the cards to their visible state one frame after they mount. Without
     this, a fetch that resolves while the section is already on screen would
     paint the cards in place and skip the stagger entirely. */
  useEffect(() => {
    if (loading || !inView) return undefined

    const frame = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(frame)
  }, [loading, inView])

  /* Skeleton placeholders */
  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse overflow-hidden rounded-2xl"
        style={{ aspectRatio: '3/4', background: 'var(--color-border-light)' }}
      />
    ))

  return (
    <section
      ref={sectionRef}
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
            className="hidden items-center gap-1.5 text-sm font-bold font-sans transition-opacity hover:opacity-70 hover:underline sm:flex"
            style={{ color: '#c2410c' }}
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={GRID_CLASS}>{renderSkeletons()}</div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-border-medium)] bg-[var(--color-background-white)] px-6 py-14 text-center">
            <h3
              className="font-serif text-2xl font-bold"
              style={{ color: 'var(--color-text-base)' }}
            >
              The feed is taking a breather.
            </h3>
            <p
              className="mx-auto mt-2 max-w-md font-sans text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Trending reels couldn&apos;t load right now. The full feed is still
              waiting for you.
            </p>
            <Link
              to="/reels"
              className="pressable mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Browse all reels <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : reels.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-border-medium)] bg-[var(--color-background-white)] px-6 py-14 text-center">
            <h3
              className="font-serif text-2xl font-bold"
              style={{ color: 'var(--color-text-base)' }}
            >
              No reels on the menu yet.
            </h3>
            <p
              className="mx-auto mt-2 max-w-md font-sans text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Fresh dishes land here every day. Explore the feed to see what&apos;s
              cooking now.
            </p>
            <Link
              to="/reels"
              className="pressable mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Explore the feed <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className={GRID_CLASS}>
            {reels.slice(0, 5).map((reel, i) => (
              <ReelCard key={reel.id} reel={reel} index={i} visible={revealed} />
            ))}
            {reels.length < 5 ? (
              <SeeAllCard index={reels.length} visible={revealed} />
            ) : null}
          </div>
        )}

        {/* Mobile CTA — the See-all card is desktop-only */}
        {!loading && !error && reels.length > 0 ? (
          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/reels"
              className="pressable inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 font-sans font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              View All Reels <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default TrendingReelsSection
