import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChefHat, Heart, MapPin, Play, ShoppingCart, Store, Users } from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'

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

const audiences = [
  {
    Icon: Heart,
    title: 'Food lovers',
    desc: 'Never ask “where is that from?” again. Discover trending dishes through immersive video and order in two taps.',
  },
  {
    Icon: ChefHat,
    title: 'Food partners',
    desc: 'From local bistros to large-scale FoodFest organisers, we provide the platform to showcase your culinary artistry to a hungry audience.',
  },
]

/*
 * Food photography is served from Pexels under the Pexels License
 * (https://www.pexels.com/license/) and used as editorial atmosphere,
 * not as depictions of real FoodReel partners.
 *
 *   photo 38349089  warmly lit Indian restaurant interior
 *   photo 31537385  biryani served with a boiled egg
 *   photo 7625056   butter chicken with garlic naan
 *   photo 20229309  street-food cook at his stall
 *   photo 31860145  chef plating a tandoori dish
 */
const foodImages = [
  {
    src: 'https://images.pexels.com/photos/38349089/pexels-photo-38349089.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    alt: 'A warmly lit Indian restaurant dining room',
    cls: 'aspect-[3/4]',
  },
  {
    src: 'https://images.pexels.com/photos/31537385/pexels-photo-31537385.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    alt: 'Biryani served with a boiled egg',
    cls: 'aspect-square',
  },
  {
    src: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
    alt: 'Butter chicken with garlic naan',
    cls: 'aspect-square',
  },
  {
    src: 'https://images.pexels.com/photos/20229309/pexels-photo-20229309.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    alt: 'A street-food cook at his stall',
    cls: 'aspect-[3/4]',
  },
]

const promises = ['Free to join', 'No hidden fees', 'Go live in 24h']

/* ─── Small shared pieces ──────────────────────────────────────── */
const Eyebrow = ({ children, onOrange = false }) => (
  <div className="flex items-center gap-3">
    <span
      aria-hidden="true"
      className={`h-px w-10 ${onOrange ? 'bg-[#ffd04d]' : 'bg-[#ffb800]'}`}
    />
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.28em] font-sans ${
        onOrange ? 'text-[#fffdf8]' : 'text-[#c2410c]'
      }`}
    >
      {children}
    </span>
  </div>
)

/* ─── Component ─────────────────────────────────────────────────── */
const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f2e8]">
      <Navbar />

      <main className="flex-1">
        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <section
          aria-labelledby="about-hero-heading"
          className="relative overflow-hidden border-b border-[#e6d9c4] px-6 pb-24 pt-16 sm:pt-20 md:pb-32 lg:pt-24"
        >
          {/* Warm glows and a fine grain keep the ivory field from feeling flat. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-48 -top-48 h-[620px] w-[620px] rounded-full opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(255,184,0,0.24) 0%, transparent 65%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,106,0,0.10) 0%, transparent 65%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #1a1208 0.5px, transparent 0.5px)',
              backgroundSize: '6px 6px',
            }}
          />

          <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:items-center">
            {/* Left */}
            <div>
              <Eyebrow>The FoodReel story</Eyebrow>

              <h1
                id="about-hero-heading"
                className="mt-6 max-w-2xl font-serif text-4xl font-black leading-[0.98] text-[#1a1208] sm:text-5xl lg:text-6xl xl:text-7xl"
                style={{ textWrap: 'balance' }}
              >
                The story behind{' '}
                <span className="block italic text-[#e55a00]">the sizzle.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5f5548] font-sans sm:text-lg">
                Connecting food lovers with the pulse of local cuisine through the power of
                cinematic short-form video. We’re more than an app — we’re a celebration of
                culinary craft.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/reels"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6a00] px-6 py-3.5 text-sm font-bold text-[#1a1208] font-sans transition-colors hover:bg-[#ffb800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
                >
                  Watch reels
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  to="/partner-register"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ffb800]/60 px-6 py-3.5 text-sm font-bold text-[#c2410c] font-sans transition-colors hover:border-[#1a1208] hover:bg-[#1a1208] hover:text-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
                >
                  Partner with us
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                {['Watch', 'Connect', 'Taste'].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a6a54] font-sans"
                  >
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#ffb800]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — editorial photo with an overlapping note */}
            <div className="relative mx-auto w-full max-w-[460px] pb-10 lg:max-w-[520px] lg:pb-0">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-[2.75rem] border border-[#ffb800]/35 sm:-inset-4"
              />

              <div className="relative overflow-hidden rounded-[2.2rem] border-[10px] border-[#fffdf8] bg-[#1a1208] shadow-[0_40px_90px_-40px_rgba(58,38,14,0.7)]">
                <img
                  src="https://images.pexels.com/photos/31860145/pexels-photo-31860145.jpeg?auto=compress&cs=tinysrgb&w=900&h=1125&fit=crop"
                  alt="A chef plating a tandoori dish in a local kitchen"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#120d08]/60 via-transparent to-[#120d08]/25"
                />

                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#1a1208]/35 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur font-sans">
                  From the feed
                </span>

                <Link
                  to="/reels"
                  aria-label="Watch reels on FoodReel"
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-[#1a1208]/35 text-white backdrop-blur transition-colors hover:bg-[#ffb800] hover:text-[#1a1208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208]"
                >
                  <Play
                    className="ml-0.5 h-4 w-4 fill-current"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Link>
              </div>

              <div className="absolute -bottom-7 left-4 right-4 rounded-2xl border border-[#e6d9c4] bg-[#fffdf8] p-5 shadow-[0_24px_60px_-30px_rgba(58,38,14,0.55)] sm:left-6 sm:right-auto sm:w-72">
                <p className="font-serif text-lg italic leading-snug text-[#1a1208]">
                  “Every dish has a story worth watching.”
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span aria-hidden="true" className="h-px w-6 bg-[#ffb800]" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c2410c] font-sans">
                    The FoodReel edit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Origin story ──────────────────────────────────── */}
        <section
          aria-labelledby="origin-heading"
          className="border-b border-[#e6d9c4] bg-[#fffdf8] px-6 py-24 md:py-32"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <div>
              <Eyebrow>01 / Our beginning</Eyebrow>
              <h2
                id="origin-heading"
                className="mt-6 max-w-md font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                It started with a <span className="italic text-[#e55a00]">craving.</span>
              </h2>
              <div aria-hidden="true" className="mt-8 h-px w-20 bg-[#ffb800]" />
              <p className="mt-8 max-w-xs font-serif text-xl italic leading-snug text-[#c2410c]">
                From a single scroll to a seat at the table.
              </p>
            </div>

            <div className="lg:border-l lg:border-[#e6d9c4] lg:pl-12">
              <p className="text-xl leading-relaxed text-[#3f3428] font-sans md:text-2xl">
                FoodReel was born at the intersection of entertainment and utility. We realised
                that the joy of discovering a new dish through short-form video shouldn’t end at
                the ‘like’ button.
              </p>
              <p className="mt-6 text-base leading-relaxed text-[#5f5548] font-sans md:text-lg">
                We built a bridge between visual inspiration and seamless ordering, making every
                crave-worthy moment actionable. By focusing on the visual narrative of food, we
                empower creators and restaurants to tell stories that satisfy more than just the
                eyes.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-10 bg-[#ffb800]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5c35] font-sans">
                  The FoodReel team
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Core values ───────────────────────────────────── */}
        <section
          aria-labelledby="values-heading"
          className="relative overflow-hidden border-b border-[#e6d9c4] px-6 py-24 md:py-32"
          style={{ background: '#f7f2e8' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-48 top-0 h-[480px] w-[480px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,184,0,0.20) 0%, transparent 65%)',
            }}
          />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow>02 / What we stand for</Eyebrow>
                <h2
                  id="values-heading"
                  className="mt-5 font-serif text-4xl font-bold text-[#1a1208] md:text-5xl"
                >
                  Our core values
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[#5f5548] font-sans md:text-right">
                The principles behind every reel, every order, and every partnership.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {values.map(({ Icon, title, desc }, index) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-[#e6d9c4] bg-[#fffdf8] p-7 shadow-[0_22px_60px_-40px_rgba(58,38,14,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ffb800]/70 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span
                    aria-hidden="true"
                    className="absolute right-5 top-4 font-serif text-5xl italic leading-none text-[#1a1208]/[0.06]"
                  >
                    0{index + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e3d2b6] bg-[#fff4e0] text-[#e55a00] transition-colors duration-300 group-hover:bg-[#1a1208] group-hover:text-[#ffd04d]">
                    {Icon && <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />}
                  </span>
                  <h3 className="mt-6 font-serif text-2xl font-bold text-[#1a1208]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5f5548] font-sans">{desc}</p>
                  <span
                    aria-hidden="true"
                    className="mt-6 block h-px w-10 bg-[#ffb800]/60 transition-all duration-300 group-hover:w-16"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Who we serve ──────────────────────────────────── */}
        <section
          aria-labelledby="audience-heading"
          className="relative overflow-hidden border-b border-[#e3d2b6] px-6 py-24 md:py-32"
          style={{ background: '#f1e4d0' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(255,184,0,0.28) 0%, transparent 65%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'radial-gradient(circle, #1a1208 0.5px, transparent 0.5px)',
              backgroundSize: '6px 6px',
            }}
          />

          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <Eyebrow>03 / Who we serve</Eyebrow>
              <h2
                id="audience-heading"
                className="mt-5 max-w-lg font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Made for both sides of <span className="italic text-[#e55a00]">the table.</span>
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#5f5548] font-sans">
                Whether you’re chasing your next favourite dish or putting your kitchen on the
                map, FoodReel is built for you.
              </p>

              <div className="mt-10 space-y-4">
                {audiences.map(({ Icon, title, desc }) => (
                  <article
                    key={title}
                    className="rounded-[1.5rem] border border-[#e3d2b6] bg-[#fffdf8] p-6 shadow-[0_20px_50px_-36px_rgba(58,38,14,0.5)]"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ffb800]/40 bg-[#fff4e0] text-[#e55a00]">
                        {Icon && <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />}
                      </span>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-[#1a1208]">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#5f5548] font-sans">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Photo mosaic */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4 pt-10">
                <img
                  src={foodImages[0].src}
                  alt={foodImages[0].alt}
                  loading="lazy"
                  decoding="async"
                  className={`${foodImages[0].cls} w-full rounded-[1.5rem] border-[6px] border-[#fffdf8] object-cover shadow-[0_24px_60px_-36px_rgba(58,38,14,0.55)]`}
                />
                <img
                  src={foodImages[1].src}
                  alt={foodImages[1].alt}
                  loading="lazy"
                  decoding="async"
                  className={`${foodImages[1].cls} w-full rounded-[1.5rem] border-[6px] border-[#fffdf8] object-cover shadow-[0_24px_60px_-36px_rgba(58,38,14,0.55)]`}
                />
              </div>
              <div className="flex flex-col gap-4">
                <img
                  src={foodImages[2].src}
                  alt={foodImages[2].alt}
                  loading="lazy"
                  decoding="async"
                  className={`${foodImages[2].cls} w-full rounded-[1.5rem] border-[6px] border-[#fffdf8] object-cover shadow-[0_24px_60px_-36px_rgba(58,38,14,0.55)]`}
                />
                <img
                  src={foodImages[3].src}
                  alt={foodImages[3].alt}
                  loading="lazy"
                  decoding="async"
                  className={`${foodImages[3].cls} w-full rounded-[1.5rem] border-[6px] border-[#fffdf8] object-cover shadow-[0_24px_60px_-36px_rgba(58,38,14,0.55)]`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Closing invitation ────────────────────────────── */}
        <section
          aria-labelledby="about-cta-heading"
          className="px-6 py-24 md:py-32"
          style={{ background: '#f7f2e8' }}
        >
          <div className="mx-auto max-w-6xl">
            <div
              className="relative overflow-hidden rounded-[2.5rem] border border-[#ff8533] px-7 py-14 shadow-[0_50px_100px_-50px_rgba(255,106,0,0.6)] sm:px-10 md:px-14 md:py-20"
              style={{ background: 'linear-gradient(150deg, #ff8a3d 0%, #ff6a00 55%, #e55a00 100%)' }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-70"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,184,0,0.45) 0%, transparent 65%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.045]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #1a1208 0.5px, transparent 0.5px)',
                  backgroundSize: '6px 6px',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#fff4e0]/70 to-transparent"
              />

              <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
                <div>
                  <Eyebrow onOrange>04 / Join the table</Eyebrow>
                  <h2
                    id="about-cta-heading"
                    className="mt-6 max-w-2xl font-serif text-4xl font-black leading-[1.02] text-[#fffdf8] md:text-5xl lg:text-6xl"
                    style={{ textWrap: 'balance' }}
                  >
                    Ready to join <span className="italic text-[#ffd04d]">the community?</span>
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-[#fff4e0] font-sans md:text-lg">
                    Whether you’re a hungry foodie or a passionate restaurant owner, there’s a
                    place for you in the FoodReel story.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-between gap-3 rounded-full bg-[#1a1208] px-6 py-4 text-sm font-bold text-[#fffdf8] font-sans transition-colors hover:bg-[#3a2a16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1208] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6a00]"
                  >
                    Create your account
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    to="/contact-us"
                    className="inline-flex items-center justify-between gap-3 rounded-full border border-white/40 px-6 py-4 text-sm font-bold text-[#fffdf8] font-sans transition-colors hover:border-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fffdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6a00]"
                  >
                    Talk to our team
                    <ArrowRight
                      className="h-4 w-4"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Link>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    {promises.map((item) => (
                      <span
                        key={item}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-[#fff4e0] font-sans"
                      >
                        <Check
                          className="h-3.5 w-3.5 text-[#ffd04d]"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        {item}
                      </span>
                    ))}
                  </div>
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
