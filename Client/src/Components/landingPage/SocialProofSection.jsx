import React from 'react'

/* ─── Data ─────────────────────────────────────────────────────── */
const stats = [
  {
    id: 'restaurants',
    value: '2,000+',
    label: 'Partner kitchens',
    sub: 'Cooking with FoodReel',
  },
  {
    id: 'foodies',
    value: '100k+',
    label: 'Foodies',
    sub: 'Registered members',
  },
  {
    id: 'cities',
    value: '50+',
    label: 'Cities',
    sub: 'Across India',
  },
  {
    id: 'rating',
    value: '4.8',
    label: 'Average rating',
    sub: 'From 24k reviews',
  },
]

/* ─── Section ──────────────────────────────────────────────────── */
const SocialProofSection = () => {
  return (
    <section
      className="border-y"
      style={{
        borderColor: 'var(--color-border-light)',
        background: 'var(--color-surface-muted)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16">
          {/* Claim */}
          <div>
            <p
              className="font-sans text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: '#c2410c' }}
            >
              By the numbers
            </p>
            <h2
              className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl"
              style={{ color: 'var(--color-text-base)', textWrap: 'balance' }}
            >
              Trusted by foodies &amp; partners across India
            </h2>
            <p
              className="mt-4 max-w-md font-sans text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              One feed for discovery, one checkout for dinner — built with kitchens in
              every city we call home.
            </p>
          </div>

          {/* Proof */}
          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border md:grid-cols-4"
            style={{
              background: 'var(--color-border-light)',
              borderColor: 'var(--color-border-light)',
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="px-4 py-5 sm:px-5 sm:py-6"
                style={{ background: 'var(--color-background-white)' }}
              >
                <p
                  className="font-serif text-2xl font-black leading-none sm:text-3xl"
                  style={{ color: 'var(--color-primary-dark)' }}
                >
                  {stat.value}
                </p>
                <p
                  className="mt-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {stat.label}
                </p>
                <p
                  className="mt-1.5 font-sans text-[11px] leading-snug"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialProofSection
