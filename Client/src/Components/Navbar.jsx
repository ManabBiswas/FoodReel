import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { Menu, X, User, LogOut, ChefHat, Home, Film, ShoppingBag, UserCircle } from 'lucide-react'
import Logo from '../assets/logo.png'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [partner, setPartner] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check user auth (always check for user authentication)
        try {
          const userResponse = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
          if (userResponse?.data?.user) {
            setUser(userResponse.data.user)
            console.log(userResponse.data.user)
          }
        } catch {
          // User not authenticated - this is fine for most pages
          setUser(null)
        }

        // Check partner auth (only if needed, and handle 401 gracefully)
        try {
          const partnerResponse = await axios.get(API_ENDPOINTS.auth.partnerCheck, axiosConfig)
          if (partnerResponse?.data?.foodPartner) {
            setPartner(partnerResponse.data.foodPartner)
            console.log(partnerResponse.data.foodPartner)
          }
        } catch {
          // Partner not authenticated - this is fine for user pages
          setPartner(null)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // Reset both states on general error
        setUser(null)
        setPartner(null)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      if (user) {
        await axios.post(API_ENDPOINTS.auth.userLogout, {}, axiosConfig)
        setUser(null)
        navigate('/')
      } else if (partner) {
        await axios.post(API_ENDPOINTS.auth.partnerLogout, {}, axiosConfig)
        setPartner(null)
        navigate('/')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Clear local state anyway if logout fails
      setUser(null)
      setPartner(null)
      navigate('/')
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 cursor-pointer">
              <img
                src={Logo}
                alt="FoodReel Logo"
                className="h-12 w-32 rounded-lg object-contain"
              />

            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            {/* Common links for all */}
            <Link to="/" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link to="/reels" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
              <Film className="w-4 h-4" />
              <span>Reels</span>
            </Link>

            {/* Partner-specific links */}
            {partner && (
              <>
                <Link to="/partner-dashboard" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/CreateFood" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>Create Food</span>
                </Link>
                <Link to="/partner-profile" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
                  <UserCircle className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* User-specific links */}
            {user && !partner && (
              <>
                <Link to="/create-post" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
                  <Film className="w-4 h-4" />
                  <span>Create Post</span>
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-red-500 transition cursor-pointer flex items-center gap-1">
                  <UserCircle className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* Auth buttons */}
            {user || partner ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link 
                  to="/partner-register" 
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Join as Partner</span>
                </Link>
                <Link 
                  to="/login" 
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Login as User</span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-4 pb-4 space-y-3">
            {/* Common links for all */}
            <Link 
              to="/" 
              onClick={() => setMobileOpen(false)} 
              className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link 
              to="/reels" 
              onClick={() => setMobileOpen(false)} 
              className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
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
                  className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/CreateFood" 
                  onClick={() => setMobileOpen(false)} 
                  className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
                >
                  <ChefHat className="w-5 h-5" />
                  <span>Create Food</span>
                </Link>
                <Link 
                  to="/partner-profile" 
                  onClick={() => setMobileOpen(false)} 
                  className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
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
                  className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
                >
                  <Film className="w-5 h-5" />
                  <span>Create Post</span>
                </Link>
                <Link 
                  to="/profile" 
                  onClick={() => setMobileOpen(false)} 
                  className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition cursor-pointer py-2"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* Auth buttons */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {user || partner ? (
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link 
                    to="/partner-register" 
                    onClick={() => setMobileOpen(false)} 
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer"
                  >
                    <ChefHat className="w-5 h-5" />
                    <span>Join as Partner</span>
                  </Link>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileOpen(false)} 
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition cursor-pointer"
                  >
                    <User className="w-5 h-5" />
                    <span>Login as User</span>
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