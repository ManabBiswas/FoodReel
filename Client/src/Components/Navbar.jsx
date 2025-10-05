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
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check user auth (always check for user authentication)
      try {
        const userResponse = await axios.get(API_ENDPOINTS.auth.userVerify, axiosConfig)
        if (userResponse?.data?.user) {
          setUser(userResponse.data.user)
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

          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            <Link to="/" className="text-gray-700 hover:text-red-500 transition cursor-pointer">Home</Link>
            <Link to="/CreateFood" className="text-gray-700 hover:text-red-500 transition cursor-pointer">Create Food</Link>
            <Link to="/partner-register" className="text-gray-700 hover:text-red-500 transition cursor-pointer">Partner</Link>
            <Link to="/profile" className="text-gray-700 hover:text-red-500 transition cursor-pointer">Profile</Link>
            {user || partner ? (
              <button 
                onClick={handleLogout} 
                className="text-gray-700 hover:text-red-500 transition cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-red-500 transition cursor-pointer">Login</Link>
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

      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-4 pb-4 space-y-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition cursor-pointer">Home</Link>
            <Link to="/CreateFood" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition cursor-pointer">Create Food</Link>
            <Link to="/partner-register" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition cursor-pointer">Partner</Link>
            <Link to="/profile" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition cursor-pointer">Profile</Link>
            {user || partner ? (
              <button 
                onClick={() => {
                  setMobileOpen(false)
                  handleLogout()
                }} 
                className="block text-gray-700 hover:text-red-500 transition cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition cursor-pointer">Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar