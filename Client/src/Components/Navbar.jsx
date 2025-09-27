import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/logo.png'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={Logo} 
                alt="FoodReel Logo" 
                className="h-12 w-12 rounded-lg object-contain"
              />
              <span className="text-lg font-semibold text-gray-800">FoodReel</span>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            <Link to="/" className="text-gray-700 hover:text-red-500 transition">Home</Link>
            <Link to="/CreateFood" className="text-gray-700 hover:text-red-500 transition">Create Food</Link>
            <Link to="/partner-register" className="text-gray-700 hover:text-red-500 transition">Partner</Link>
            <Link to="/user-login" className="text-gray-700 hover:text-red-500 transition">Login</Link>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="px-4 pt-4 pb-4 space-y-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition">Home</Link>
            <Link to="/CreateFood" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition">Create Food</Link>
            <Link to="/partner-register" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition">Partner</Link>
            <Link to="/user-login" onClick={() => setMobileOpen(false)} className="block text-gray-700 hover:text-red-500 transition">Login</Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar