import React, { useEffect, useState } from 'react'

const BackToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed right-6 bottom-6 z-50 flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg hover:from-red-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-300 transform hover:scale-110 group"
      title="Back to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400 to-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
    </button>
  )
}

export default BackToTop
