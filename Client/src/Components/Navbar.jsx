import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    // Apply theme class to root element and persist
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  try { localStorage.setItem('theme', theme) } catch { console.debug('Could not persist theme') }
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-md bg-gradient-to-tr from-yellow-400 to-red-400 flex items-center justify-center text-white font-bold">FR</div>
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">FoodReel</span>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Home</Link>
            <Link to="/CreateFood" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Create Food</Link>
            <Link to="/partner-register" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Partner</Link>
            <Link to="/user-login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Login</Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="ml-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {theme === 'dark' ? (
                // Sun icon (light)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 4.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0110 4.5zM10 15.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM4.5 10a.75.75 0 01-.75-.75v-.5a.75.75 0 011.5 0v.5A.75.75 0 014.5 10zM15.25 10a.75.75 0 01-.75-.75v-.5a.75.75 0 011.5 0v.5a.75.75 0 01-.75.75zM6.22 6.22a.75.75 0 011.06 0l.35.35a.75.75 0 01-1.06 1.06l-.35-.35a.75.75 0 010-1.06zM12.37 12.37a.75.75 0 011.06 0l.35.35a.75.75 0 01-1.06 1.06l-.35-.35a.75.75 0 010-1.06zM6.22 13.78a.75.75 0 010-1.06l.35-.35a.75.75 0 011.06 1.06l-.35.35a.75.75 0 01-1.06 0zM12.37 7.63a.75.75 0 010-1.06l.35-.35a.75.75 0 011.06 1.06l-.35.35a.75.75 0 01-1.06 0zM10 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
                </svg>
              ) : (
                // Moon icon (dark)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 116.707 2.707a7 7 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 pt-4 pb-4 space-y-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-700 dark:text-gray-300">Home</Link>
            <Link to="/CreateFood" onClick={() => setMobileOpen(false)} className="block text-gray-700 dark:text-gray-300">Create Food</Link>
            <Link to="/partner-register" onClick={() => setMobileOpen(false)} className="block text-gray-700 dark:text-gray-300">Partner</Link>
            <Link to="/user-login" onClick={() => setMobileOpen(false)} className="block text-gray-700 dark:text-gray-300">Login</Link>
            <button onClick={() => { toggleTheme(); setMobileOpen(false) }} className="w-full text-left text-gray-700 dark:text-gray-300">Toggle Theme</button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar