import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Video, Plus, Handshake, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { CgProfile } from "react-icons/cg";
import { FaPlus } from "react-icons/fa6";
import { GrHomeRounded } from "react-icons/gr";
import { MdOutlineHandshake } from "react-icons/md";
import { Film } from 'lucide-react';

const MenuBarBottom = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  // const isUser = isAuthenticated && location.pathname === '/profile'
  const isPartner = isAuthenticated && location.pathname === '/partner-profile'

  const menuItems = [
    {
      path: '/',
      label: 'Home',
      icon: <GrHomeRounded className="h-4 w-4 text-amber-50" />
    },
    {
      path: '/reels',
      label: 'Reels',
      icon: <Film className="h-4 w-4 text-amber-50" />
    },
    {
      path: isAuthenticated
        ? (isPartner ? '/create-food' : '/create-post')
        : (isPartner ? '/partner-login' : '/login'),
      label: 'Create',
      icon: <FaPlus className="h-4 w-4 text-amber-50" />
    },

    {
      path: isAuthenticated
        ? (isPartner ? '/partner-profile' : '/profile')
        : (isPartner ? '/partner-login' : '/login'),
      label: isPartner ? 'Partner Profile' : 'Profile',
      icon: isPartner
        ? <MdOutlineHandshake className="h-4 w-4 text-amber-50" />
        : <CgProfile className="h-4 w-4 text-amber-50" />
    }


  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-white/20 z-[100] shadow-glass">
      <nav className="flex justify-around ">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 rounded-2xl transition-all duration-300 group relative ${isActive
                ? 'text-white transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400'
                }`}
            >
              {/* Active background with glassmorphism */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl shadow-glass-orange animate-scale-in"></div>
              )}

              {/* Icon container */}
              <div className={`relative z-10 transition-all duration-300 ${isActive ? 'transform scale-110 animate-bounce-soft' : 'group-hover:scale-110'
                }`}>
                <span className="text-lg mb-1 block">{item.icon}</span>
              </div>

              {/* Label */}
              <span className="relative z-10 text-[8px] font-medium transition-all duration-300">
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