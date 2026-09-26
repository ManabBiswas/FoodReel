import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { Heart, Store, ShoppingCart, MapPin, Users, Film } from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────── */
const values = [
  {
    Icon: Users,
    title: 'Community First',
    desc: 'Building a space where foodies connect, share, and celebrate the local dining scene together.',
  },
  {
    Icon: Store,
    title: 'Support Local',
    desc: 'Championing independent restaurants and local artisans by giving them a powerful visual voice.',
  },
  {
    Icon: ShoppingCart,
    title: 'Discover & Order',
    desc: 'Seamlessly moving from visual discovery to your first bite with integrated ordering technology.',
  },
  {
    Icon: MapPin,
    title: 'Local Focus',
    desc: 'Hyper-local content ensures you discover the hidden gems right in your neighbourhood.',
  },
]

const foodImages = [
  {
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=600&fit=crop',
    alt: 'Chef plating a high-end dish',
    cls: 'aspect-[3/4]',
  },
  {
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop',
    alt: 'Busy restaurant kitchen',
    cls: 'aspect-square',
  },
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
    alt: 'Food festival stalls',
    cls: 'aspect-square',
  },
  {
    src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=600&fit=crop',
    alt: 'People sharing pizza',
    cls: 'aspect-[3/4]',
  },
]

/* ─── Component ─────────────────────────────────────────────────── */
const About = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="flex-1">

        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-6 pt-20 pb-20 lg:px-0"
          style={{ background: 'var(--color-background-light)' }}
        >
          {/* Background glow blobs */}
          <div
            className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
          />

          <div className="relative mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 lg:items-center px-6">
            {/* Left */}
            <div>
              <span
                className="mb-6 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest font-sans"
                style={{ background: 'rgba(255,184,0,0.15)', color: 'var(--color-accent)' }}
              >
                Our Mission
              </span>

              <h1
                className="font-serif text-5xl font-black leading-[1.05] tracking-tight md:text-7xl"
                style={{ color: 'var(--color-text-base)' }}
              >
                The story behind{' '}
                <em className="not-italic" style={{ color: 'var(--color-primary)' }}>
                  the sizzle
                </em>
              </h1>

              <p
                className="mt-6 max-w-lg text-lg leading-relaxed font-sans"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Connecting food lovers with the pulse of local cuisine through the power
                of cinematic short-form video. We're more than an app — we're a
                celebration of culinary craft.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/reels">
                  <button
                    className="rounded-xl px-8 py-4 font-bold font-sans transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-glow)' }}
                  >
                    Watch Reels
                  </button>
                </Link>
                <Link to="/partner-register">
                  <button
                    className="rounded-xl px-8 py-4 font-bold font-sans transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{
                      border: '2px solid var(--color-primary)',
                      color: 'var(--color-primary)',
                      background: 'transparent',
                    }}
                  >
                    Partner with Us
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — stacked images */}
            <div className="relative">
              {/* Main image */}
              <div
                className="overflow-hidden rounded-[2rem]"
                style={{
                  border: '8px solid #fff',
                  boxShadow: 'var(--shadow-xl)',
                  transform: 'rotate(2deg) scale(0.97)',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=600&fit=crop"
                  alt="Gourmet food being prepared"
                  className="aspect-square w-full object-cover"
                />
              </div>

              {/* Floating inset */}
              <div
                className="absolute -bottom-6 -left-6 hidden md:block overflow-hidden rounded-2xl"
                style={{
                  border: '4px solid #fff',
                  boxShadow: 'var(--shadow-lg)',
                  transform: 'rotate(-5deg)',
                  width: '220px',
                  aspectRatio: '16/9',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop"
                  alt="Street food close up"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Origin story ──────────────────────────────────── */}
        <section className="py-24 px-6" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2
              className="font-serif text-4xl font-bold"
              style={{ color: 'var(--color-text-base)' }}
            >
              The origin story
            </h2>

            <div
              className="mx-auto h-1.5 w-20 rounded-full"
              style={{ background: 'var(--color-accent)' }}
            />

            <p
              className="text-lg leading-relaxed font-sans"
              style={{ color: 'var(--color-text-muted)' }}
            >
              FoodReel was born at the intersection of entertainment and utility.
              We realised that the joy of discovering a new dish through short-form
              video shouldn't end at the 'like' button.
            </p>
            <p
              className="text-lg leading-relaxed font-sans"
              style={{ color: 'var(--color-text-muted)' }}
            >
              We built a bridge between visual inspiration and seamless ordering,
              making every crave-worthy moment actionable. By focusing on the visual
              narrative of food, we empower creators and restaurants to tell stories
              that satisfy more than just the eyes.
            </p>
          </div>
        </section>

        {/* ── 3. Core values ───────────────────────────────────── */}
        <section className="py-24 px-6" style={{ background: 'var(--color-background-light)' }}>
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-16 text-center space-y-3">
              <h2
                className="font-serif text-4xl font-bold md:text-5xl"
                style={{ color: 'var(--color-text-base)' }}
              >
                Our core values
              </h2>
              <div
                className="mx-auto h-1.5 w-20 rounded-full"
                style={{ background: 'var(--color-accent)' }}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background:  'var(--color-background-white)',
                    border:      '1px solid var(--color-border-light)',
                    boxShadow:   'var(--shadow-sm)',
                  }}
                >
                  <div
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300"
                    style={{ background: 'rgba(255,106,0,0.1)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.querySelector('svg').style.color = '#fff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,106,0,0.1)'; e.currentTarget.querySelector('svg').style.color = 'var(--color-primary)' }}
                  >
                    {Icon && <Icon className="w-7 h-7" strokeWidth={1.8} style={{ color: 'var(--color-primary)', transition: 'color 0.3s' }} />}
                  </div>
                  <h3
                    className="mb-3 text-lg font-bold font-sans"
                    style={{ color: 'var(--color-text-base)' }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed font-sans"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Who we serve ──────────────────────────────────── */}
        <section className="py-24 px-6" style={{ background: 'var(--color-background-dark)' }}>
          <div className="mx-auto max-w-7xl grid gap-20 lg:grid-cols-2 lg:items-center">
            {/* Left: text */}
            <div>
              <h2 className="font-serif text-4xl font-bold  mb-14" style={{color: 'var(--color-text-inverse)'}}>
                Who we serve
              </h2>

              <div className="space-y-12">
                {/* Food lovers */}
                <div className="flex gap-6">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ border: '1.5px solid var(--color-accent)' }}
                  >
                    <Heart className="w-5 h-5" style={{ color: 'var(--color-accent)' }} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-bold font-sans" style={{color: 'var(--color-text-inverse)'}}>Food Lovers</h4>
                    <p className="leading-relaxed font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Never ask "where is that from?" again. Discover trending dishes through
                      immersive video and order in two taps.
                    </p>
                  </div>
                </div>

                {/* Food partners */}
                <div className="flex gap-6">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ border: '1.5px solid var(--color-primary)' }}
                  >
                    <Film className="w-5 h-5" style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xl font-bold text-white font-sans"style={{color: 'var(--color-text-inverse)'}}>Food Partners</h4>
                    <p className="leading-relaxed font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      From local bistros to large-scale FoodFest organisers, we provide the
                      platform to showcase your culinary artistry to a hungry audience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: photo mosaic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3 pt-8">
                <img
                  src={foodImages[0].src}
                  alt={foodImages[0].alt}
                  className={`${foodImages[0].cls} w-full rounded-2xl object-cover`}
                  style={{ border: '3px solid rgba(255,255,255,0.08)' }}
                />
                <img
                  src={foodImages[1].src}
                  alt={foodImages[1].alt}
                  className={`${foodImages[1].cls} w-full rounded-2xl object-cover`}
                  style={{ border: '3px solid rgba(255,255,255,0.08)' }}
                />
              </div>
              <div className="flex flex-col gap-3">
                <img
                  src={foodImages[2].src}
                  alt={foodImages[2].alt}
                  className={`${foodImages[2].cls} w-full rounded-2xl object-cover`}
                  style={{ border: '3px solid rgba(255,255,255,0.08)' }}
                />
                <img
                  src={foodImages[3].src}
                  alt={foodImages[3].alt}
                  className={`${foodImages[3].cls} w-full rounded-2xl object-cover`}
                  style={{ border: '3px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. CTA banner ────────────────────────────────────── */}
        <section className="px-6 py-20" style={{ background: 'var(--color-background-light)' }}>
          <div className="mx-auto max-w-4xl">
            <div
              className="relative overflow-hidden rounded-[2.5rem] px-8 py-20 text-center md:px-20"
              style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-glow)' }}
            >
              {/* Decorative circles */}
              <div
                className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-20"
                style={{ background: 'var(--color-accent)' }}
              />
              <div
                className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-10"
                style={{ background: '#fff' }}
              />

              <div className="relative z-10 space-y-6">
                <h2 className="font-serif text-4xl font-black text-white md:text-5xl">
                  Ready to join the community?
                </h2>
                <p
                  className="mx-auto max-w-xl text-lg font-sans"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  Whether you're a hungry foodie or a passionate restaurant owner,
                  there's a place for you in the FoodReel story.
                </p>

                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Link to="/register">
                    <button
                      className="rounded-xl px-10 py-4 font-bold font-sans transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ background: '#fff', color: 'var(--color-primary)' }}
                    >
                      Download App
                    </button>
                  </Link>
                  <Link to="/contact-us">
                    <button
                      className="rounded-xl px-10 py-4 font-bold font-sans transition-all hover:bg-white/10 active:scale-[0.97]"
                      style={{
                        border:      '2px solid rgba(255,255,255,0.35)',
                        color:       '#fff',
                        background:  'transparent',
                      }}
                    >
                      Contact Sales
                    </button>
                  </Link>
                </div>

                {/* Micro trust signals */}
                <div className="flex flex-wrap justify-center gap-6 pt-2">
                  {['Free to join', 'No hidden fees', 'Go live in 24h'].map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-sm font-sans" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

export default About