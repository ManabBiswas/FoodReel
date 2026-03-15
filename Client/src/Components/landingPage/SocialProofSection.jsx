import React from 'react'

const stats = [
  { value: '2,000+', label: 'Restaurants',  emoji: '🍽️' },
  { value: '100k+',  label: 'Foodies',      emoji: '😋' },
  { value: '50+',    label: 'Cities',        emoji: '📍' },
  { value: '4.8★',   label: 'Avg. rating',  emoji: '⭐' },
]

const SocialProofSection = () => {
  return (
    <section
      className="border-y border-border-light bg-background-white"
      style={{ borderColor: 'var(--color-border-light)' }}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-1.5 text-center"
            >
              <span className="text-2xl" aria-hidden>{stat.emoji}</span>
              <p
                className="font-display text-3xl font-extrabold tracking-tight"
                style={{ color: 'var(--color-text-base)' }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs font-semibold uppercase tracking-widest font-sans"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialProofSection