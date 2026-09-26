import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PlayCircle, ChevronRight, Heart, Star, BookmarkCheck, ShoppingBag, MoreVertical } from 'lucide-react'
import Logo from '../../assets/logo.png'

// Same abbreviation rules as Reel.jsx's formatCount, so mock counts read
// exactly like the real feed (8.2K, not 8.2k).
const formatCount = (count) => {
  if (!count) return '0'
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const HeroSection = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [heroImageFailed, setHeroImageFailed] = useState(false)

  return (
    <section className="relative px-6 py-20 md:py-28 bg-background-light overflow-hidden">
      {/* Decorative background shapes */}
      <div
        className="pointer-events-none absolute -top-40 right-0 h-[700px] w-[700px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 lg:items-center">
        {/* ── Left: copy ─────────────────────────────────────── */}
        <div className="flex flex-col gap-8">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-semibold text-primary font-sans">Now live across 50+ cities</span>
          </div>

          {/* Headline */}
          <div className="space-y-5">
            <h1
              className="font-serif text-6xl font-black leading-[1.05] tracking-tight md:text-7xl text-text-base"
              style={{ textWrap: 'balance' }}
            >
              Don't just scroll,{' '}
              <em className="text-primary not-italic">Taste.</em>
            </h1>
            <p className="max-w-lg text-lg text-text-muted leading-relaxed font-sans">
              Discover your next obsession through immersive short-form reels.
              Watch the taste, smell the story, and order instantly.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link to="/reels">
              <button className="flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 font-bold text-white shadow-glow hover:bg-primary-dark active:scale-[0.97] transition-all cursor-pointer font-sans">
                <PlayCircle className="w-5 h-5 flex-shrink-0" />
                Watch Reels
              </button>
            </Link>
            <button
              onClick={() => navigate(isAuthenticated ? '/cart' : '/login')}
              className="flex items-center gap-2 rounded-xl border-2 border-border-light bg-background-white px-8 py-4 font-bold text-text-base hover:border-border-medium hover:bg-surface-muted active:scale-[0.97] transition-all cursor-pointer font-sans"
            >
              {isAuthenticated ? 'View Cart' : 'Order Now'}
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>

          {/* Social proof mini */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2.5">
              {['bg-orange-100', 'bg-yellow-100', 'bg-green-100', 'bg-blue-100'].map((bg, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full ${bg} border-2 border-white flex items-center justify-center text-base`}
                  aria-hidden
                >
                  {['🧑‍🍳', '😋', '👩', '🍜'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-text-muted font-sans">
              <span className="font-bold text-text-base">100k+</span> foodies ordering daily
            </p>
          </div>
        </div>

        {/* ── Right: phone mockup ─────────────────────────────── */}
        <div className="relative flex justify-center lg:justify-end">
          {/* Phone */}
          <div className="relative z-10 animate-float">
            <div
              className="w-[270px] md:w-[310px] rounded-[3rem] overflow-hidden"
              style={{
                border: '10px solid #111',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              <div className="relative bg-black" style={{ aspectRatio: '9/19.5' }}>
                {heroImageFailed ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background: 'linear-gradient(160deg, var(--color-primary-dark) 0%, var(--color-primary) 45%, var(--color-accent) 100%)' }}
                  >
                    <img src={Logo} alt="FoodReel" className="h-10 w-auto object-contain" />
                    <span className="text-white/80 text-xs font-semibold font-sans">Fresh reels, daily</span>
                  </div>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=1300&fit=crop&auto=format&q=80"
                    alt="Freshly baked pizza on a wooden board"
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={() => setHeroImageFailed(true)}
                  />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />

                {/* Top bar — mirrors ReelPageHeader: logo + "Reels" + overflow menu.
                    There is no LIVE badge on the real reel page. */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={Logo}
                      alt="FoodReel"
                      className="h-5 w-auto object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
                    />
                    <span
                      className="text-white/80 text-[9px] font-semibold uppercase tracking-[0.18em] font-sans"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                    >
                      Reels
                    </span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full">
                    <MoreVertical className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
                  </div>
                </div>

                {/* Side actions — mirrors the real reel rail for a food post:
                    like (with count) → review → save → shop. No share action,
                    because ReelActionButtons has no share control. */}
                <div className="absolute right-3 bottom-28 flex flex-col items-center gap-3.5">
                  {/* Like */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full bg-red-500/30 backdrop-blur-sm flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </div>
                    <span className="text-white text-[9px] font-sans">{formatCount(8234)}</span>
                  </div>

                  {/* Review (shown because this is a tagged food post) */}
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>

                  {/* Save */}
                  <div className="w-8 h-8 rounded-full bg-orange-500/30 backdrop-blur-sm flex items-center justify-center">
                    <BookmarkCheck className="w-4 h-4 text-orange-400 fill-orange-400" />
                  </div>

                  {/* Shop */}
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Bottom info — same shape as ReelBottomInfo */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">T</div>
                    <span className="text-white text-xs font-medium font-sans truncate">Tandoori Nights</span>
                    <span className="text-white/70 text-[10px] font-sans truncate hidden sm:inline">Kolkata</span>
                    <span
                      className="ml-auto text-[10px] font-bold rounded-full px-2 py-0.5 font-sans flex-shrink-0"
                      style={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                    >
                      Following
                    </span>
                  </div>
                  <p className="text-white text-sm font-bold font-sans mb-2.5">
                    Wood-Fired Margherita Pizza
                  </p>
                  {/* Order bar */}
                  <div
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <div>
                      <p className="text-[9px] text-white/75 font-sans">One tap order</p>
                      <p className="text-white font-bold text-sm font-sans">₹349</p>
                    </div>
                    <span className="text-white text-xs font-bold font-sans">Order now →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating notification card */}
          <div
            className="absolute -left-6 top-1/3 z-20 hidden lg:flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-sans"
            style={{ boxShadow: 'var(--shadow-xl)', animation: 'float 3s ease-in-out infinite 1s' }}
          >
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-text-base">Order confirmed!</p>
              <p className="text-[10px] text-text-muted">Est. delivery 25 min</p>
            </div>
          </div>

          {/* Floating rating card */}
          <div
            className="absolute -right-4 bottom-1/4 z-20 hidden lg:flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-sans"
            style={{ boxShadow: 'var(--shadow-xl)', animation: 'float 3s ease-in-out infinite 0.5s' }}
          >
            <span className="text-xl">⭐</span>
            <div>
              <p className="text-xs font-bold text-text-base">4.9 rating</p>
              <p className="text-[10px] text-text-muted">2,400 reviews</p>
            </div>
          </div>

          {/* Glow effects */}
          <div className="pointer-events-none absolute bottom-0 -right-8 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        </div>
      </div>
    </section>
  )
}

export default HeroSection