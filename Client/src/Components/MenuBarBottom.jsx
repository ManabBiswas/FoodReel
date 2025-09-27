import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const MenuBarBottom = () => {
  const location = useLocation()

  const menuItems = [
    {
      path: '/',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Home',
      emoji: '🏠'
    },
    {
      path: '/reels',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Reels',
      emoji: '🎬'
    },
    {
      path: '/CreateFood',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Create',
      emoji: '➕'
    },
    {
      path: '/partner-register',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: 'Partner',
      emoji: '🤝'
    },
    {
      path: '/user-login',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Profile',
      emoji: '👤'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-white/20 z-50 sm:hidden shadow-glass">
      <nav className="flex justify-around py-2 px-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 group relative ${
                isActive
                  ? 'text-white transform scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400'
              }`}
            >
              {/* Active background with glassmorphism */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl shadow-glass-orange animate-scale-in"></div>
              )}
              
              {/* Icon container */}
              <div className={`relative z-10 transition-all duration-300 ${
                isActive ? 'transform scale-110 animate-bounce-soft' : 'group-hover:scale-110'
              }`}>
                <span className="text-lg mb-1 block">{item.emoji}</span>
              </div>
              
              {/* Label */}
              <span className="relative z-10 text-xs font-medium transition-all duration-300">
                {item.label}
              </span>
              
              {/* Hover effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-accent-100 to-primary-100 dark:from-accent-900 dark:to-primary-900 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Bottom safe area for devices with home indicator */}
      <div className="h-2 bg-transparent"></div>
    </div>
  )
}

export default MenuBarBottom