import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-tr from-blue-900 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-md bg-gradient-to-tr from-yellow-400 to-red-400 flex items-center justify-center text-white font-bold">FR</div>
              <div>
                <h3 className="text-lg font-semibold">FoodReel</h3>
                <p className="text-sm text-blue-100/80">Delivering joy, one bite at a time.</p>
              </div>
            </div>
            <p className="text-sm text-blue-100/70">© {new Date().getFullYear()} FoodReel. All rights reserved.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-blue-100/80">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/CreateFood" className="hover:text-white">Create Food</Link></li>
              <li><Link to="/partner-register" className="hover:text-white">Partner</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-blue-100/80">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Stay updated</h4>
            <p className="text-sm text-blue-100/80 mb-3">Subscribe for updates, new features and offers.</p>
            <form className="flex w-full max-w-sm">
              <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 rounded-l-md text-gray-800 focus:outline-none" />
              <button type="submit" className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-r-md font-semibold hover:opacity-95">Subscribe</button>
            </form>

            <div className="mt-6 flex items-center space-x-3">
              <a href="#" aria-label="twitter" className="text-blue-100/80 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20c7.55 0 11.67-6.26 11.67-11.67 0-.18 0-.35-.01-.53A8.34 8.34 0 0022 5.92a8.19 8.19 0 01-2.36.65 4.07 4.07 0 001.8-2.25 8.17 8.17 0 01-2.6.99A4.1 4.1 0 0015.5 4c-2.27 0-4.11 1.84-4.11 4.11 0 .32.04.63.1.93A11.64 11.64 0 013 5.16a4.1 4.1 0 001.27 5.48 4.07 4.07 0 01-1.86-.51v.05c0 2.04 1.45 3.75 3.37 4.13a4.1 4.1 0 01-1.85.07 4.11 4.11 0 003.83 2.85A8.23 8.23 0 012 18.58a11.63 11.63 0 006.29 1.84" /></svg>
              </a>
              <a href="#" aria-label="facebook" className="text-blue-100/80 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.95v-7.05H8.9v-2.9h1.6V9.4c0-1.6.95-2.5 2.4-2.5.7 0 1.4.1 1.4.1v1.6h-.8c-.8 0-1 .5-1 1v1.2h1.7l-.3 2.9h-1.4V22A10 10 0 0022 12z" /></svg>
              </a>
              <a href="#" aria-label="instagram" className="text-blue-100/80 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.5A4.5 4.5 0 1016.5 13 4.5 4.5 0 0012 8.5zM18 7.5a1 1 0 11-1 1 1 1 0 011-1z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
