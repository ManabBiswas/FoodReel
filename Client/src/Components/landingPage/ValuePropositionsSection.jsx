import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Zap, ChevronRight, Store, TrendingUp, Megaphone } from 'lucide-react'

const userBenefits = [
  {
    Icon: Sparkles,
    title: 'Browse the Feed',
    description: 'Discover trending food reels personalised for your location and taste.',
  },
  {
    Icon: Zap,
    title: 'Crave & Order',
    description: "Tap 'Order Now' on any reel to get the exact meal delivered to your doorstep.",
  },
  {
    Icon: Megaphone,
    title: 'Join the Party',
    description: 'Attend FoodFests, earn badges, and post your own reviews to the feed.',
  },
]

const partnerBenefits = [
  {
    Icon: Store,
    title: 'Showcase Your Kitchen',
    description: 'Upload short, high-quality videos of your signature dishes and daily specials.',
  },
  {
    Icon: Zap,
    title: 'Drive Direct Sales',
    description: 'Convert inspiration into orders with our integrated checkout system.',
  },
  {
    Icon: TrendingUp,
    title: 'Grow with FoodFest',
    description: 'Participate in community events to gain massive exposure and loyal customers.',
  },
]

const BenefitItem = ({ Icon, title, description }) => (
  <li className="flex items-start gap-4">
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold font-sans"
      style={{ background: 'var(--color-primary)', color: '#fff' }}
    >
      {Icon && <Icon aria-hidden="true" />}
    </div>
    <div className="space-y-1">
      <p className="font-bold font-sans" style={{ color: 'var(--color-text-base)' }}>{title}</p>
      <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
        {description}
      </p>
    </div>
  </li>
)

const ValuePropositionsSection = () => {
  return (
    <section
      className="section-padding px-6"
      style={{ background: 'var(--color-background-light)' }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 md:grid-cols-2">
          {/* ── For Food Lovers ──────────────────────────────── */}
          <div className="space-y-8">
            <div className="space-y-2">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest font-sans"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                For Food Lovers
              </span>
              <h2
                className="font-serif text-4xl font-bold"
                style={{ color: 'var(--color-text-base)' }}
              >
                Eat what you watch
              </h2>
            </div>

            <ul className="space-y-6">
              {userBenefits.map((benefit) => (
                <BenefitItem key={benefit.title} {...benefit} />
              ))}
            </ul>

            <div className="space-y-3">
              <Link
                to="/register"
                className="pressable inline-flex items-center gap-3 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              >
                Join as Foodie <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p
                className="font-sans text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Free to join · Save reels · Track every order
              </p>
            </div>
          </div>

          {/* ── For Restaurant Partners ────────────────────── */}
          <div
            className="space-y-8 rounded-3xl p-8 md:p-10"
            style={{
              background: 'var(--color-background-dark)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="space-y-2">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest font-sans"
                style={{ background: 'rgba(255,184,0,0.2)', color: 'var(--color-accent)' }}
              >
                For Restaurant Partners
              </span>
              <h2 className="font-serif text-4xl font-bold text-white" style={{ color: 'var(--color-text-inverse)' }}>
                Grow your kitchen
              </h2>
            </div>

            <ul className="space-y-6">
              {partnerBenefits.map(({ Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold font-sans"
                    style={{ background: 'rgba(255,184,0,0.25)', color: 'var(--color-accent)' }}
                  >
                    {Icon && <Icon aria-hidden="true" />}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold font-sans text-white">{title}</p>
                    <p className="text-sm leading-relaxed font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <Link
                to="/partner-register"
                className="pressable inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 font-sans text-sm font-bold text-[var(--color-background-dark)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background-dark)]"
              >
                Become a Partner <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Free to join · No setup fees · Keep your own menu
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ValuePropositionsSection