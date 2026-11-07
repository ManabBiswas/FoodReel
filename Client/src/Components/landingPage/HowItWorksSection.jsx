import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, onScroll } from 'animejs'
import {
  ArrowRight,
  Clapperboard,
  Clock,
  Heart,
  Play,
  ShoppingBag,
  Star,
  UtensilsCrossed
} from 'lucide-react'

const REEL_IMAGE =
  'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=1400&h=1200&fit=crop'

const AVATARS = [
  { initials: 'AR', background: 'linear-gradient(135deg, #8c5a2b, #c99a4a)' },
  { initials: 'MK', background: 'linear-gradient(135deg, #3f4a3c, #7d8a6f)' },
  { initials: 'SD', background: 'linear-gradient(135deg, #6b3a2a, #a8674f)' },
  { initials: 'JP', background: 'linear-gradient(135deg, #3c3a4a, #7c7890)' },
]

const PROMISES = ['No endless menus', 'Order what you watch', 'Support local kitchens']

const STEPS = [
  {
    id: 'watch',
    number: '01',
    phase: 'Watch',
    title: 'See the dish before you choose it.',
    copy: 'Short reels from kitchens near you. The char, the pour, the finish — decide with your eyes instead of a wall of text.',
    cta: 'Explore the feed',
    to: '/reels',
  },
  {
    id: 'connect',
    number: '02',
    phase: 'Connect',
    title: 'Follow the people behind the plate.',
    copy: 'Save the chefs and spots you love, share a table, and let your circle know what is worth the trip.',
    cta: 'Meet the kitchens',
    to: '/about',
  },
  {
    id: 'taste',
    number: '03',
    phase: 'Taste',
    title: 'Order the exact plate you watched.',
    copy: 'One tap sends the dish from the reel to your door. No menu hunting, no guessing what arrives.',
    cta: 'See how ordering works',
    to: '/reels',
  },
]

/* ─── Step 01 media ─────────────────────────────────────────────── */
const WatchVisual = () => {
  const [imageError, setImageError] = useState(false)

  return (
    <figure className="group relative overflow-hidden rounded-[1.75rem] border border-[#e6d9c4] bg-[#1a1208] shadow-[0_30px_80px_-40px_rgba(58,38,14,0.6)]">
      <div className="relative aspect-[4/5] sm:aspect-[16/11]">
        {!imageError ? (
          <img
            src={REEL_IMAGE}
            alt="Butter chicken and garlic naan from the FoodReel feed"
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-95 transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            <UtensilsCrossed className="h-24 w-24 text-white/[0.06]" strokeWidth={1} />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#120d08]/90 via-[#120d08]/15 to-[#120d08]/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 rounded-[1.4rem] border border-white/15 transition-colors duration-500 group-hover:border-white/30 sm:inset-4"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-6">
          <span className="flex items-center gap-2 rounded-full border border-white/20 bg-[#1a1208]/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur font-sans">
            <Clapperboard className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            16 sec
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-[#1a1208]/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur font-sans">
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#f0c987]" />
            From the feed
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            to="/reels"
            aria-label="Watch this reel on FoodReel"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-[#1a1208]/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#fffdf8] hover:text-[#1a1208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208] motion-reduce:transform-none motion-reduce:transition-none"
          >
            <Play className="ml-0.5 h-6 w-6 fill-current" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>

        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f0c987] font-sans">
              Now playing
            </p>
            <p className="mt-1 font-serif text-2xl font-bold leading-tight text-[#fffdf8]">
              Butter chicken &amp; naan
            </p>
            <p className="mt-1 truncate text-xs text-white/65 font-sans">
              Slow-simmered tomato, garlic naan, fresh coriander.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-[#1a1208]/35 px-2.5 py-1.5 text-xs font-semibold text-white/85 backdrop-blur font-sans">
            <Star className="h-3 w-3 fill-[#f0c987] text-[#f0c987]" aria-hidden="true" />
            4.9
          </span>
        </figcaption>
      </div>
    </figure>
  )
}

/* ─── Step 02 media ─────────────────────────────────────────────── */
const SocialCard = () => (
  <figure className="relative overflow-hidden rounded-[1.75rem] border border-[#e6d9c4] bg-[#fffdf8] p-6 shadow-[0_24px_60px_-38px_rgba(58,38,14,0.5)] sm:p-7">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#c99a4a]/[0.14] blur-2xl"
    />

    <div className="relative flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5c35] font-sans">
        <Heart className="h-3.5 w-3.5 text-[#a46b1f]" strokeWidth={1.5} aria-hidden="true" />
        Community
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5a12] font-sans">
        2k sharing
      </span>
    </div>

    <blockquote className="relative mt-5 font-serif text-2xl font-bold leading-snug text-[#1a1208]">
      “The best tables are the ones you share.”
    </blockquote>
    <p className="relative mt-2 text-sm leading-relaxed text-[#5f5548] font-sans">
      Follow the chefs and foodies who make your city taste better.
    </p>

    <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#eadcc6] pt-5">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {AVATARS.map((avatar) => (
            <span
              key={avatar.initials}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#fffdf8] text-[10px] font-bold text-white shadow-sm font-sans"
              style={{ background: avatar.background }}
            >
              {avatar.initials}
            </span>
          ))}
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#fffdf8] bg-[#f1e4d0] text-[10px] font-bold text-[#6b5b45] shadow-sm font-sans">
            +2k
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#6b5b45] font-sans">foodies sharing</span>
      </div>

      <Link
        to="/reels"
        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5a12] font-sans transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99a4a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8]"
      >
        Follow <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
      </Link>
    </div>
  </figure>
)

/* ─── Step 03 media ─────────────────────────────────────────────── */
const OrderCard = () => (
  <figure
    className="relative overflow-hidden rounded-[1.75rem] border border-[#e3d2b6] p-6 shadow-[0_24px_60px_-38px_rgba(58,38,14,0.55)] sm:p-7"
    style={{ background: 'linear-gradient(150deg, #f8eedf 0%, #efe1c9 100%)' }}
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[#c99a4a]/[0.18] blur-3xl"
    />

    <div className="relative flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 rounded-full border border-[#c99a4a]/40 bg-[#fffdf8]/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5a12] font-sans">
        <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        Order confirmed
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5a12] font-sans">
        28 min
      </span>
    </div>

    <div className="relative mt-5 flex items-center gap-2.5 rounded-2xl border border-[#e3d2b6] bg-[#fffdf8] p-2.5 shadow-[0_10px_24px_-18px_rgba(58,38,14,0.55)] sm:gap-3 sm:p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a46b1f]/[0.12] text-[#8a5a12] sm:h-11 sm:w-11">
        <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1a1208] font-sans">Butter chicken &amp; naan</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#7a6a54] font-sans sm:text-[11px]">
          <Clock className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden="true" /> 28 min · Free
          delivery
        </p>
      </div>
      <span className="shrink-0 rounded-lg bg-[#1a1208] px-2.5 py-2 text-xs font-bold text-[#fffdf8] font-sans sm:px-3">
        ₹249
      </span>
    </div>

    <div className="relative mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#6b5b45] font-sans">
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c99a4a]" />
      One tap from reel to door
    </div>
  </figure>
)

const StepVisual = ({ id }) => {
  if (id === 'watch') return <WatchVisual />
  if (id === 'connect') return <SocialCard />
  return <OrderCard />
}

/* ─── Section ──────────────────────────────────────────────────── */
const HowItWorksSection = () => {
  const listRef = useRef(null)
  const trackRef = useRef(null)
  const fillRef = useRef(null)
  const dotRefs = useRef([])
  const ratiosRef = useRef([])
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const list = listRef.current
    const track = trackRef.current
    const fill = fillRef.current
    if (!list || !track || !fill) return undefined

    const dots = dotRefs.current.filter(Boolean)
    if (dots.length < 2) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let observer = null
    let animation = null
    let frame = 0
    let disposed = false

    const measure = () => {
      const listRect = list.getBoundingClientRect()
      const firstRect = dots[0].getBoundingClientRect()
      const lastRect = dots[dots.length - 1].getBoundingClientRect()
      const start = firstRect.top + firstRect.height / 2 - listRect.top
      const end = lastRect.top + lastRect.height / 2 - listRect.top
      const span = Math.max(0, end - start)

      track.style.top = `${start}px`
      track.style.height = `${span}px`

      ratiosRef.current = dots.map((dot) => {
        const rect = dot.getBoundingClientRect()
        const center = rect.top + rect.height / 2 - listRect.top
        return span > 0 ? (center - start) / span : 0
      })

      if (observer?.target) observer.refresh()
    }

    const scheduleMeasure = () => {
      if (disposed) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    measure()

    if (reduced) {
      fill.style.transform = 'scaleY(1)'
      setActiveIndex(-1)

      const resizeObserver = new ResizeObserver(scheduleMeasure)
      resizeObserver.observe(list)

      return () => {
        disposed = true
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        fill.style.transform = ''
      }
    }

    const updateActive = (progress) => {
      const ratios = ratiosRef.current
      let next = 0

      for (let i = 0; i < ratios.length; i += 1) {
        if (progress >= ratios[i] - 0.001) next = i
      }

      if (next !== activeRef.current) {
        activeRef.current = next
        setActiveIndex(next)
      }
    }

    observer = onScroll({
      target: track,
      enter: '60% start',
      leave: '60% end',
      sync: true,
      onUpdate: (self) => updateActive(self.progress),
    })

    animation = animate(fill, {
      scaleY: [0, 1],
      ease: 'linear',
      autoplay: observer,
    })

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(list)

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleMeasure).catch(() => {})
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      animation.revert()
      observer.revert()
      fill.style.transform = ''
    }
  }, [])

  return (
    <section
      aria-labelledby="experience-heading"
      className="relative border-t border-[#e6d9c4] px-6 py-24 md:py-32"
      style={{ background: '#f7f2e8' }}
    >
      {/* Warm glows and a fine grain keep the ivory field from feeling flat. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(231,185,106,0.22) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,106,0,0.10) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #1a1208 0.5px, transparent 0.5px)',
            backgroundSize: '6px 6px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c99a4a]/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-4xl">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-10 bg-[#c99a4a]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a46b1f] font-sans">
              The FoodReel experience
            </span>
          </div>

          <h2
            id="experience-heading"
            className="mt-6 max-w-3xl font-serif text-4xl font-black leading-[0.98] text-[#1a1208] sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ textWrap: 'balance' }}
          >
            Everything you need,{' '}
            <span className="block italic text-[#a46b1f]">in one app.</span>
          </h2>
        </div>

        {/* Timeline */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
          {/* Sticky chapter guide */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="max-w-xs text-base leading-relaxed text-[#5f5548] font-sans">
              Crafted for foodies who value experience over listings. Watch, connect, and order
              without ever leaving the moment.
            </p>

            <div className="mt-8 border-t border-[#e0d2bb] pt-5">
              <div className="flex items-end justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7a6a54] font-sans">
                  The sequence
                </p>
                <p
                  aria-hidden="true"
                  className="flex items-baseline gap-1.5 font-serif leading-none text-[#1a1208]"
                >
                  <span className="text-4xl font-black">
                    {activeIndex >= 0 ? String(activeIndex + 1).padStart(2, '0') : '03'}
                  </span>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#8a7a63]">
                    {activeIndex >= 0 ? '/ 03' : 'steps'}
                  </span>
                </p>
              </div>

              <ol className="mt-5 space-y-1.5">
                {STEPS.map((step, index) => {
                  const isActive = index === activeIndex

                  return (
                    <li key={step.id}>
                      <a
                        href={`#${step.id}`}
                        aria-current={isActive ? 'step' : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs font-semibold font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a46b1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8] ${
                          isActive ? 'text-[#1a1208]' : 'text-[#8a7a63] hover:text-[#5f5548]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            isActive ? 'bg-[#e55a00]' : 'bg-[#c9b79a] group-hover:bg-[#a46b1f]'
                          }`}
                        />
                        <span className="tabular-nums">{step.number}</span>
                        <span className="uppercase tracking-[0.12em]">{step.phase}</span>
                      </a>
                    </li>
                  )
                })}
              </ol>
            </div>

            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7a6a54] font-sans">
              Watch · Connect · Taste
            </p>
          </aside>

          {/* Ordered steps */}
          <ol
            ref={listRef}
            aria-label="How FoodReel works"
            className="relative space-y-16 sm:space-y-20 lg:space-y-24"
          >
            <div
              ref={trackRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-[21px] top-0 w-0.5 bg-[#d8c29c]"
            >
              <div
                ref={fillRef}
                className="absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-gradient-to-b from-[#c99a4a] via-[#e55a00] to-[#ff6a00] shadow-[0_0_14px_rgba(229,90,0,0.35)]"
              />
            </div>

            {STEPS.map((step, index) => {
              const isActive = index === activeIndex

              return (
                <li
                  key={step.id}
                  id={step.id}
                  className="relative scroll-mt-28 pl-14 sm:pl-16 lg:pl-20"
                >
                  <span
                    ref={(node) => {
                      dotRefs.current[index] = node
                    }}
                    aria-hidden="true"
                    className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border font-sans text-[11px] font-bold tabular-nums transition-colors duration-300 ${
                      isActive
                        ? 'border-[#1a1208] bg-[#1a1208] text-[#fffdf8] shadow-[0_8px_20px_-10px_rgba(26,18,8,0.8)]'
                        : 'border-[#d8c29c] bg-[#f7f2e8] text-[#8a7a63]'
                    }`}
                  >
                    {step.number}
                  </span>

                  <div className="grid gap-7 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-12">
                    <div className="max-w-md">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.24em] font-sans transition-colors duration-300 ${
                          isActive ? 'text-[#a46b1f]' : 'text-[#9a8a72]'
                        }`}
                      >
                        {step.number} / {step.phase}
                      </p>
                      <h3 className="mt-3 font-serif text-3xl font-black leading-[1.04] text-[#1a1208] sm:text-4xl">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-sm leading-relaxed text-[#5f5548] font-sans sm:text-base">
                        {step.copy}
                      </p>
                      <Link
                        to={step.to}
                        className="group mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#8a5a12] font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a46b1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
                      >
                        {step.cta}
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c99a4a]/50 transition-colors duration-300 group-hover:border-[#1a1208] group-hover:bg-[#1a1208] group-hover:text-[#fffdf8]">
                          <ArrowRight
                            className="h-4 w-4"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </span>
                      </Link>
                    </div>

                    <div
                      className={`transition-transform duration-500 motion-reduce:transform-none motion-reduce:transition-none ${
                        isActive ? 'lg:-translate-y-1' : ''
                      }`}
                    >
                      <StepVisual id={step.id} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Refined finish */}
        <div className="mt-16 flex flex-col gap-5 border-t border-[#e0d2bb] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {PROMISES.map((promise) => (
              <span
                key={promise}
                className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b5b45] font-sans"
              >
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c99a4a]" />
                {promise}
              </span>
            ))}
          </div>

          <Link
            to="/reels"
            className="group inline-flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-semibold text-[#8a5a12] font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a46b1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
          >
            Explore the feed
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c99a4a]/50 transition-colors duration-300 group-hover:border-[#1a1208] group-hover:bg-[#1a1208] group-hover:text-[#fffdf8]">
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
