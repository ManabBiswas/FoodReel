import React from 'react'
import { Link } from 'react-router-dom'
import BackToTop from './BackToTop'
import Logo from '../assets/logo.png'
import { Twitter, Facebook, Instagram, Youtube } from 'lucide-react'

const Footer = () => {
  // Navigation Links Data
  const exploreLinks = [
    { to: '/', label: 'Home' },
    { to: '/reels', label: 'Reels' },
    { to: '/CreateFood', label: 'Create Food Reel' },
    { to: '/partner-register', label: 'Become Partner' },
  ]

  const companyLinks = [
    { to: '/about', label: 'About Us' },
    { to: '#', label: 'Careers' },
    { to: '/contact-us', label: 'Contact' },
    { to: '#', label: 'Support' },
  ]

  const socialLinks = [
    { 
      to: '#', 
      label: 'Twitter', 
      icon: Twitter, 
      gradient: 'from-blue-400 to-blue-500',
      hoverGradient: 'hover:from-blue-500 hover:to-blue-600'
    },
    { 
      to: '#', 
      label: 'Facebook', 
      icon: Facebook, 
      gradient: 'from-blue-600 to-blue-700',
      hoverGradient: 'hover:from-blue-700 hover:to-blue-800'
    },
    { 
      to: '#', 
      label: 'Instagram', 
      icon: Instagram, 
      gradient: 'from-pink-500 to-purple-600',
      hoverGradient: 'hover:from-pink-600 hover:to-purple-700'
    },
    { 
      to: '#', 
      label: 'YouTube', 
      icon: Youtube, 
      gradient: 'from-red-500 to-red-600',
      hoverGradient: 'hover:from-red-600 hover:to-red-700'
    },
  ]

  const legalLinks = [
    { to: '#', label: 'Privacy Policy' },
    { to: '#', label: 'Terms of Service' },
    { to: '#', label: 'Cookie Policy' },
  ]

  return (
    <footer className="bg-gradient-to-br from-gray-100 to-gray-200 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand Section - Full width on mobile, spans 2 cols on tablet */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-0 lg:space-y-4">
              <div className="flex items-center space-x-3">


                <img
                  src={Logo}
                  alt="FoodReel Logo"
                  className="h-16 w-36 object-contain"
                />


              </div>

              <div className="text-center sm:text-left lg:text-left">
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                  Discover amazing food through short videos and order directly from talented chefs and restaurants near you.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b-2 border-red-400 pb-2 inline-block">
              Explore
            </h4>
            <ul className="space-y-3">
              {exploreLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.to} 
                    className="text-gray-600 hover:text-red-500 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-3 group-hover:bg-red-400 transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b-2 border-yellow-400 pb-2 inline-block">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.to} 
                    className="text-gray-600 hover:text-yellow-500 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b-2 border-green-400 pb-2 inline-block">
              Stay Connected
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Get the latest food reels and exclusive offers delivered to your inbox.
            </p>

            {/* Social Media Links */}
            <div className="pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Follow Us</p>
              <div className="flex items-center space-x-4">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon
                  return (
                    <Link
                      key={index}
                      to={social.to}
                      aria-label={social.label}
                      className={`w-10 h-10 bg-gradient-to-r ${social.gradient} text-white rounded-lg flex items-center justify-center ${social.hoverGradient} transition-all duration-200 transform hover:scale-110 shadow-lg`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} FoodReel. All rights reserved. Made by Manab for food lovers.
              </p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-end items-center space-x-6 text-sm">
              {legalLinks.map((link, index) => (
                <Link 
                  key={index}
                  to={link.to} 
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BackToTop />
    </footer>
  )
}


export default Footer
