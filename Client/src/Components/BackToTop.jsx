import React, { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

const BackToTop = () => {
  const [visible,  setVisible]  = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop    = window.scrollY
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight
      const scrollPct    = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

      setVisible(scrollTop > 300)
      setProgress(Math.min(scrollPct, 100))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  /* SVG ring dimensions */
  const SIZE   = 48
  const STROKE = 3
  const R      = (SIZE - STROKE * 2) / 2
  const CIRC   = 2 * Math.PI * R
  const offset = CIRC - (progress / 100) * CIRC

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="group fixed bottom-6 right-6 z-50 flex items-center justify-center hover:cursor-pointer"
      style={{
        width:  SIZE,
        height: SIZE,
        borderRadius: '50%',
        background:   'var(--color-background-white)',
        boxShadow:    'var(--shadow-lg)',
        border:       '1px solid var(--color-border-light)',
        transition:   'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform  = 'scale(1.08)'
        e.currentTarget.style.boxShadow  = 'var(--shadow-xl)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform  = 'scale(1)'
        e.currentTarget.style.boxShadow  = 'var(--shadow-lg)'
      }}
    >
      {/* Progress ring */}
      <svg
        width={SIZE}
        height={SIZE}
        className="absolute inset-0 pr-0.5"
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth={STROKE}
        />
        {/* Fill */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>

      {/* Arrow icon */}
      <ChevronUp
        className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5 animate-pulse"
        style={{ width: 22, height: 22, color: 'var(--color-primary)', strokeWidth: 2.5 }}
      />
    </button>
  )
}

export default BackToTop