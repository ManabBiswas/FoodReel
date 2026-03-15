import React from 'react'
import { Link } from 'react-router-dom'
import BackToTop from './BackToTop'
import Logo from '../assets/logo.png'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-900 pt-8 pb-6 border-t border-gray-100 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-4">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <img
                src={Logo}
                alt="FoodReel Logo"
                className="h-12 w-32 object-contain"
              />
            </div>
            <p className="max-w-xs text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-sans">
              The future of food discovery. Immersive stories, instant cravings, seamless fulfillment.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold mb-6 text-gray-900 dark:text-white font-sans" style={{ color: 'var(--color-text-inverse)' }}>Company</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors font-sans">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-sans"></a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-sans">Press</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-sans">Contact</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold mb-6 text-gray-900 dark:text-white font-sans" style={{ color: 'var(--color-text-inverse)' }}>Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors font-sans">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-sans">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-sans">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-bold mb-6 text-gray-900 dark:text-white font-sans"
            style={{ color: 'var(--color-text-inverse)' }}>Account</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all w-full justify-center font-sans">
                  Login as User
                </Link>
              </li>
              <li>
                <Link to="/partner-register" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all w-full justify-center font-sans">
                  Join as Partner
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-sans">© {currentYear} FoodReel Inc. All rights reserved.</p>
          <div className="flex gap-8 text-xs text-gray-400 dark:text-gray-500 font-sans">
            <span>Made with love for foodies</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
