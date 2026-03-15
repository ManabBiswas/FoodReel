import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Menu, X, User, LogOut, ChefHat, Home, Film, ShoppingBag, UserCircle, Plus, ShoppingCart } from 'lucide-react'
import Logo from '../assets/logo.png'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, partner, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition">
            <img
              src={Logo}
              alt="FoodReel Logo"
              className="h-12 w-32 rounded-lg object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            {/* Common links for all */}
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Home</span>
            </Link>
            <Link to="/reels" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
              <Film className="w-4 h-4" />
              <span className="hidden md:inline">Reels</span>
            </Link>

            {/* Partner-specific links */}
            {partner && (
              <>
                <Link to="/partner-dashboard" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
                <Link to="/CreateFood" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
                  <ChefHat className="w-4 h-4" />
                  <span className="hidden md:inline">Create</span>
                </Link>
                <Link to="/partner-profile" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Profile</span>
                </Link>
              </>
            )}

            {/* User-specific links */}
            {user && !partner && (
              <>
                <Link to="/create-post" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Create</span>
                </Link>
                <Link to="/order/history" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Orders</span>
                </Link>
                <Link to="/cart" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden md:inline">Cart</span>
                </Link>
                <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer flex items-center gap-1 text-sm font-medium font-sans">
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Profile</span>
                </Link>
              </>
            )}

            {/* Auth buttons */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer text-sm font-medium font-sans"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to="/partner-register"
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-slate-900 rounded-lg hover:bg-accent/90 transition cursor-pointer text-sm font-medium font-sans"
                >
                  <ChefHat className="w-4 h-4" />
                  <span className="hidden md:inline">Partner</span>
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer text-sm font-medium font-sans"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-gray-900 dark:text-white" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 pt-4 pb-4 space-y-3">
            {/* Common links for all */}
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              to="/reels"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
            >
              <Film className="w-5 h-5" />
              <span>Reels</span>
            </Link>

            {/* Partner-specific links */}
            {partner && (
              <>
                <Link
                  to="/partner-dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/CreateFood"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <ChefHat className="w-5 h-5" />
                  <span>Create Food</span>
                </Link>
                <Link
                  to="/partner-profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* User-specific links */}
            {user && !partner && (
              <>
                <Link
                  to="/create-post"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Post</span>
                </Link>
                <Link
                  to="/order/history"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary transition cursor-pointer py-2 text-sm font-medium font-sans"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* Auth buttons */}
            <div className="border-t border-primary/10 pt-4 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer text-sm font-medium font-sans"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/partner-register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-slate-900 rounded-lg hover:bg-accent/90 transition cursor-pointer text-sm font-medium font-sans w-full"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Join as Partner</span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer text-sm font-medium font-sans w-full"
                  >
                    <User className="w-4 h-4" />
                    <span>Login</span>
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

export default Navbar
                  