import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Zap, ChevronRight, Store, TrendingUp, Megaphone } from 'lucide-react'

const userBenefits = [
  {
    // num: 1,
    Icon: Sparkles,
    title: 'Browse the Feed',
    description: 'Discover trending food reels personalised for your location and taste.',
  },
  {
    // num: 2,
    Icon: Zap,
    title: 'Crave & Order',
    description: "Tap 'Order Now' on any reel to get the exact meal delivered to your doorstep.",
  },
  {
    // num: 3,
    Icon: Megaphone,
    title: 'Join the Party',
    description: 'Attend FoodFests, earn badges, and post your own reviews to the feed.',
  },
]

const partnerBenefits = [
  {
    // num: 1,
    Icon: Store,
    title: 'Showcase Your Kitchen',
    description: 'Upload short, high-quality videos of your signature dishes and daily specials.',
  },
  {
    // num: 2,
    Icon: Zap,
    title: 'Drive Direct Sales',
    description: 'Convert inspiration into orders with our integrated checkout system.',
  },
  {
    // num: 3,
    Icon: TrendingUp,
    title: 'Grow with FoodFest',
    description: 'Participate in community events to gain massive exposure and loyal customers.',
  },
]

const BenefitItem = ({
    //  num,
     Icon, title, description }) => (
  <li className="flex items-start gap-4">
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold font-sans"
      style={{ background: 'var(--color-primary)', color: '#fff' }}
    >
      {Icon && <Icon />}
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
          <div className="space-y-8 mt-10 py-4">
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
              {userBenefits.map((b) => <BenefitItem key={b.num} {...b} />)}
            </ul>

            <Link to="/register">
              <button
                className="flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-bold font-sans transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Join as Foodie <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
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
              {partnerBenefits.map(({ num, Icon, title, description }) => (
                <li key={num} className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold font-sans"
                    style={{ background: 'rgba(255,184,0,0.25)', color: 'var(--color-accent)' }}
                  >
                    {Icon && <Icon />}
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

            <Link to="/partner-register">
              <button
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold font-sans transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
              >
                Become a Partner <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ValuePropositionsSection