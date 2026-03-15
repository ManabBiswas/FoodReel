import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Menu, X, User, LogOut, ChefHat,
  Home, Film, ShoppingBag, UserCircle,
  Plus, ShoppingCart
} from 'lucide-react'
import Logo from '../assets/logo.png'

const Navbar = () => {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [scrolled,   setScrolled]     = useState(false)
  const { user, partner, logout, isAuthenticated } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  /* Detect scroll to strengthen the glass */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close mobile menu on route change */
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  // const linkCls = (path) =>
  //   `flex items-center gap-1.5 text-sm font-medium font-sans transition-colors duration-150 ${
  //     isActive(path)
  //       ? 'text-primary'
  //       : 'hover:text-primary'
  //   }`

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background:   scrolled
          ? 'rgba(248, 247, 245, 0.72)'
          : 'rgba(248, 247, 245, 0.55)',
        backdropFilter:        'blur(20px) saturate(180%)',
        WebkitBackdropFilter:  'blur(20px) saturate(180%)',
        borderBottom: scrolled
          ? '1px solid rgba(26, 18, 8, 0.1)'
          : '1px solid rgba(26, 18, 8, 0.06)',
        boxShadow: scrolled
          ? '0 4px 24px rgba(26, 18, 8, 0.08)'
          : 'none',
      }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* ── Logo ──────────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src={Logo}
              alt="FoodReel"
              className="h-10 w-28 object-contain"
            />
          </Link>

          {/* ── Desktop nav ───────────────────────────────────── */}
          <div className="hidden sm:flex sm:items-center sm:gap-1">

            {/* Common */}
            <NavLink to="/"      icon={<Home className="w-4 h-4" />}   label="Home"   isActive={isActive('/')} />
            <NavLink to="/reels" icon={<Film className="w-4 h-4" />}   label="Reels"  isActive={isActive('/reels')} />

            {/* Partner links */}
            {partner && (
              <>
                <NavLink to="/partner-dashboard" icon={<ShoppingBag className="w-4 h-4" />} label="Dashboard" isActive={isActive('/partner-dashboard')} />
                <NavLink to="/CreateFood"        icon={<ChefHat     className="w-4 h-4" />} label="Create"    isActive={isActive('/CreateFood')} />
                <NavLink to="/partner-profile"   icon={<UserCircle  className="w-4 h-4" />} label="Profile"   isActive={isActive('/partner-profile')} />
              </>
            )}

            {/* User links */}
            {user && !partner && (
              <>
                <NavLink to="/create-post"    icon={<Plus         className="w-4 h-4" />} label="Create"  isActive={isActive('/create-post')} />
                <NavLink to="/order/history"  icon={<ShoppingBag  className="w-4 h-4" />} label="Orders"  isActive={isActive('/order/history')} />
                <NavLink to="/cart"           icon={<ShoppingCart className="w-4 h-4" />} label="Cart"    isActive={isActive('/cart')} />
                <NavLink to="/profile"        icon={<UserCircle   className="w-4 h-4" />} label="Profile" isActive={isActive('/profile')} />
              </>
            )}

            {/* Auth area */}
            <div className="ml-4 flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold font-sans transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              ) : (
                <>
                  <Link to="/partner-register">
                    <button
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold font-sans transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
                    >
                      <ChefHat className="w-4 h-4" />
                      <span className="hidden md:inline">Partner</span>
                    </button>
                  </Link>
                  <Link to="/login">
                    <button
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold font-sans transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline">Login</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ── Mobile hamburger ──────────────────────────────── */}
          <button
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(26,18,8,0.07)' }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen
              ? <X    className="h-5 w-5" style={{ color: 'var(--color-text-base)' }} />
              : <Menu className="h-5 w-5" style={{ color: 'var(--color-text-base)' }} />
            }
          </button>
        </div>
      </nav>

      {/* ── Mobile panel ────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sm:hidden"
          style={{
            background:  'rgba(248, 247, 245, 0.90)',
            backdropFilter:       'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderTop: '1px solid rgba(26,18,8,0.08)',
          }}
        >
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">

            <MobileLink to="/"      icon={<Home className="w-5 h-5" />}        label="Home"         isActive={isActive('/')} />
            <MobileLink to="/reels" icon={<Film className="w-5 h-5" />}        label="Reels"        isActive={isActive('/reels')} />

            {partner && (
              <>
                <MobileLink to="/partner-dashboard" icon={<ShoppingBag className="w-5 h-5" />} label="Dashboard"    isActive={isActive('/partner-dashboard')} />
                <MobileLink to="/CreateFood"        icon={<ChefHat     className="w-5 h-5" />} label="Create Food"  isActive={isActive('/CreateFood')} />
                <MobileLink to="/partner-profile"   icon={<UserCircle  className="w-5 h-5" />} label="Profile"      isActive={isActive('/partner-profile')} />
              </>
            )}

            {user && !partner && (
              <>
                <MobileLink to="/create-post"   icon={<Plus         className="w-5 h-5" />} label="Create Post" isActive={isActive('/create-post')} />
                <MobileLink to="/order/history" icon={<ShoppingBag  className="w-5 h-5" />} label="My Orders"   isActive={isActive('/order/history')} />
                <MobileLink to="/cart"          icon={<ShoppingCart className="w-5 h-5" />} label="Cart"        isActive={isActive('/cart')} />
                <MobileLink to="/profile"       icon={<UserCircle   className="w-5 h-5" />} label="Profile"     isActive={isActive('/profile')} />
              </>
            )}

            <div
              className="mt-2 space-y-2 border-t pt-4"
              style={{ borderColor: 'rgba(26,18,8,0.08)' }}
            >
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold font-sans transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <>
                  <Link to="/partner-register" className="block">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold font-sans transition-opacity hover:opacity-90"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
                    >
                      <ChefHat className="w-4 h-4" /> Join as Partner
                    </button>
                  </Link>
                  <Link to="/login" className="block">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold font-sans transition-opacity hover:opacity-90"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      <User className="w-4 h-4" /> Login
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* ─── Sub-components ──────────────────────────────────────────── */

const NavLink = ({ to, icon, label, isActive }) => (
  <Link
    to={to}
    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium font-sans transition-colors"
    style={{
      color:      isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
      background: isActive ? 'rgba(255,106,0,0.08)' : 'transparent',
    }}
    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-primary)' }}
    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-text-muted)' }}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
  </Link>
)

const MobileLink = ({ to, icon, label, isActive }) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium font-sans transition-colors"
    style={{
      color:      isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
      background: isActive ? 'rgba(255,106,0,0.08)' : 'transparent',
    }}
  >
    {icon}
    <span>{label}</span>
  </Link>
)

export default Navbar