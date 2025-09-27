import React from 'react'
import { Link } from 'react-router-dom'
import BackToTop from './BackToTop'
import Logo from '../assets/logo.png'

const Footer = () => {
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
                  className="h-16 w-16 rounded-xl object-contain shadow-lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">FoodReel</h3>
                  <p className="text-sm text-gray-600">Delivering joy, one bite at a time.</p>
                </div>
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
              <li>
                <Link to="/" className="text-gray-600 hover:text-red-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-3 group-hover:bg-red-400 transition-colors"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/CreateFood" className="text-gray-600 hover:text-red-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-3 group-hover:bg-red-400 transition-colors"></span>
                  Create Food Reel
                </Link>
              </li>
              <li>
                <Link to="/partner-register" className="text-gray-600 hover:text-red-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-3 group-hover:bg-red-400 transition-colors"></span>
                  Become Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b-2 border-yellow-400 pb-2 inline-block">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                  Support
                </a>
              </li>
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
                <a 
                  href="#" 
                  aria-label="Twitter"
                  className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg flex items-center justify-center hover:from-blue-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-110 shadow-lg"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20c7.55 0 11.67-6.26 11.67-11.67 0-.18 0-.35-.01-.53A8.34 8.34 0 0022 5.92a8.19 8.19 0 01-2.36.65 4.07 4.07 0 001.8-2.25 8.17 8.17 0 01-2.6.99A4.1 4.1 0 0015.5 4c-2.27 0-4.11 1.84-4.11 4.11 0 .32.04.63.1.93A11.64 11.64 0 013 5.16a4.1 4.1 0 001.27 5.48 4.07 4.07 0 01-1.86-.51v.05c0 2.04 1.45 3.75 3.37 4.13a4.1 4.1 0 01-1.85.07 4.11 4.11 0 003.83 2.85A8.23 8.23 0 012 18.58a11.63 11.63 0 006.29 1.84" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  aria-label="Facebook"
                  className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-110 shadow-lg"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12a10 10 0 10-11.5 9.95v-7.05H8.9v-2.9h1.6V9.4c0-1.6.95-2.5 2.4-2.5.7 0 1.4.1 1.4.1v1.6h-.8c-.8 0-1 .5-1 1v1.2h1.7l-.3 2.9h-1.4V22A10 10 0 0022 12z" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  aria-label="Instagram"
                  className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg flex items-center justify-center hover:from-pink-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-110 shadow-lg"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.5A4.5 4.5 0 1016.5 13 4.5 4.5 0 0012 8.5zM18 7.5a1 1 0 11-1 1 1 1 0 011-1z" />
                  </svg>
                </a>
                <a 
                  href="#" 
                  aria-label="YouTube"
                  className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-110 shadow-lg"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
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
              <a href="#" className="text-gray-500 hover:text-red-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-red-500 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-red-500 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
      <BackToTop />
    </footer>
  )
}


export default Footer
