import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChefHat, Film, Home, LogOut, ShoppingBag, Sparkles, User } from 'lucide-react'
import Logo from '../assets/logo.png'
import { useAuth } from '../hooks/useAuth'

const EXPLORE = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/reels', label: 'Reels', icon: Film },
  { to: '/about', label: 'About us', icon: Sparkles },
  { to: '/contact-us', label: 'Contact', icon: ArrowUpRight },
]

const ACCOUNT = [
  { to: '/create-post', label: 'Create a post' },
  { to: '/order/history', label: 'My orders' },
  { to: '/cart', label: 'Cart' },
  { to: '/profile', label: 'Profile settings' },
]

const PARTNER = [
  { to: '/CreateFood', label: 'Add your food' },
  { to: '/partner-dashboard', label: 'Partner dashboard' },
  { to: '/partner-profile', label: 'Partner profile' },
]

const linkCls =
  'group inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-sans ' +
  'text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-white/40'

const FooterLink = ({ to, label, icon: Icon }) => (
  <li>
    <Link to={to} className={linkCls}>
      {Icon && <Icon className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />}
      {label}
    </Link>
  </li>
)

const CTA_BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-xl text-sm font-bold font-sans ' +
  'transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'

const CtaButton = ({ to, children, variant = 'primary' }) => {
  const styles =
    variant === 'primary'
      ? { background: 'var(--color-primary)', color: '#fff' }
      : { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }

  return (
    <Link to={to} className="inline-block">
      <button
        type="button"
        className={`${CTA_BASE} px-6 py-3 shadow-lg hover:shadow-xl`}
        style={styles}
      >
        {children}
      </button>
    </Link>
  )
}

const Column = ({ title, children }) => (
  <div>
    <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/45 font-sans">{title}</h3>
    <ul className="space-y-1">{children}</ul>
  </div>
)

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { isAuthenticated, authType, user, partner, admin, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName =
    user?.firstName || partner?.companyName || admin?.email || 'FoodReel member'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: 'var(--color-background-dark)', color: 'var(--color-text-inverse)' }}
    >
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-8">
        {/* ── CTA strip ──────────────────────────────────────────── */}
        <div className="mb-14 flex flex-col items-center gap-6 rounded-3xl px-6 py-10 text-center md:flex-row md:justify-between md:text-left"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <div className="max-w-xl">
            <h2
              className="font-serif text-2xl font-bold sm:text-3xl"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 55%, var(--color-accent-light) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Put your kitchen on the reel
            </h2>
            <p className="mt-2 text-sm font-sans text-white/60">
              Reach foodies already scrolling. Create your menu, track orders and grow your revenue.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CtaButton to="/partner-register">
              <ChefHat className="h-4 w-4" /> Become a partner
            </CtaButton>
            <CtaButton to="/reels" variant="ghost">
              <Film className="h-4 w-4" /> Start exploring
            </CtaButton>
          </div>
        </div>

        {/* ── Link columns ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex cursor-pointer items-center gap-2 rounded-lg transition-opacity hover:opacity-80">
              <img src={Logo} alt="FoodReel" className="h-11 w-32 object-contain" />
            </Link>
            <p className="mt-4 max-w-xs text-sm font-sans leading-relaxed text-white/55">
              The future of food discovery. Immersive stories, instant cravings, seamless fulfillment.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold font-sans text-white/70"
              style={{ background: 'rgba(255,106,0,0.16)', border: '1px solid rgba(255,106,0,0.35)' }}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Made for foodies
            </div>
          </div>

          <Column title="Explore">
            {EXPLORE.map((item) => (
              <FooterLink key={item.to} {...item} />
            ))}
          </Column>

          <Column title="For you">
            {ACCOUNT.map((item) => (
              <FooterLink key={item.to} {...item} />
            ))}
          </Column>

          <Column title="For partners">
            {PARTNER.map((item) => (
              <FooterLink key={item.to} {...item} />
            ))}
          </Column>
        </div>

        {/* ── Auth strip ─────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {isAuthenticated ? (
            <>
              <div className="min-w-0">
                <p className="text-sm font-sans text-white/60">
                  Signed in as{' '}
                  <span className="font-bold text-white">{displayName}</span> —{' '}
                  {authType === 'partner' ? 'your menu and orders are synced.' : authType === 'admin' ? 'admin controls are unlocked.' : 'your cart and orders are synced.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(authType === 'partner'
                  ? [
                      { to: '/partner-dashboard', label: 'Dashboard' },
                      { to: '/CreateFood', label: 'Add food' },
                    ]
                  : authType === 'admin'
                    ? [{ to: '/admin/dashboard', label: 'Admin dashboard' }]
                    : [
                        { to: '/cart', label: 'Cart' },
                        { to: '/order/history', label: 'My orders' },
                      ]
                ).map((item) => (
                  <Link key={item.to} to={item.to} className="inline-block">
                    <button
                      type="button"
                      className={`${CTA_BASE} px-5 py-2.5 text-white shadow-lg hover:shadow-xl`}
                      style={{ background: 'var(--color-primary)' }}
                    >
                      {item.label}
                    </button>
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Log out"
                  title="Log out"
                  className={`${CTA_BASE} px-4 py-2.5 text-white/80 hover:text-white disabled:opacity-50`}
                  style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-sans text-white/60">
                New here? Sign in to sync your cart, orders and saved reels.
              </p>
              <div className="flex gap-3">
                <Link to="/login" className="inline-block">
                  <button
                    type="button"
                    className={`${CTA_BASE} px-5 py-2.5 text-white shadow-lg hover:shadow-xl`}
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <User className="h-4 w-4" /> Sign in
                  </button>
                </Link>
                <Link to="/register" className="inline-block">
                  <button
                    type="button"
                    className={`${CTA_BASE} px-5 py-2.5 text-white/80 hover:text-white`}
                    style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                  >
                    Create account
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────── */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs font-sans text-white/45 sm:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.10)' }}
        >
          <p>© {currentYear} FoodReel Inc. All rights reserved.</p>
          <p>Immersive stories · Instant cravings · Seamless fulfillment</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
