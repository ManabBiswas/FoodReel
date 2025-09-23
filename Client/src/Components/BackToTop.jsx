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
      className="fixed right-6 bottom-6 z-50 flex items-center justify-center h-12 w-12 rounded-full bg-blue-900/65 text-white backdrop-blur-sm shadow-lg hover:bg-blue-900/85 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-opacity"
      title="Back to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

export default BackToTop
