import React from 'react'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from 'recharts'

/* ─── Data ─────────────────────────────────────────────────────── */
const stats = [
  {
    id:      'restaurants',
    value:   '2,000+',
    label:   'Restaurants',
    sub:     'Active partners',
    fill:    '#ff6a00',
    pct:     82,
  },
  {
    id:      'foodies',
    value:   '100k+',
    label:   'Foodies',
    sub:     'Registered users',
    fill:    '#ffb800',
    pct:     94,
  },
  {
    id:      'cities',
    value:   '50+',
    label:   'Cities',
    sub:     'Across India',
    fill:    '#ff6a00',
    pct:     68,
  },
  {
    id:      'rating',
    value:   '4.8',
    label:   'Avg. rating',
    sub:     'From 24k reviews',
    fill:    '#ffb800',
    pct:     96,
  },
]

/* ─── Single radial stat card ──────────────────────────────────── */
const StatCard = ({ value, label, sub, fill, pct }) => {
  const chartData = [{ name: label, value: pct, fill }]

  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl px-6 py-4 transition-transform hover:-translate-y-0.5"
      style={{
        background: 'var(--color-background-white)',
        border:     '1px solid var(--color-border-light)',
        boxShadow:  'var(--shadow-sm)',
      }}
    >
      {/* Radial chart */}
      <div className="relative h-24 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="88%"
            outerRadius="125%"
            data={chartData}
            startAngle={220}
            endAngle={-40}
            barSize={6}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: 'var(--color-border-light)' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Centre value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-xl font-extrabold leading-none tracking-tight"
            style={{ color: fill }}
          >
            {value}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="text-center space-y-0.5 ">
        <p
          className="text-sm font-bold font-sans"
          style={{ color: 'var(--color-text-base)' }}
        >
          {label}
        </p>
        <p
          className="text-xs font-sans"
          style={{ color: 'var(--color-text-faint)' }}
        >
          {sub}
        </p>
      </div>
    </div>
  )
}

/* ─── Section ──────────────────────────────────────────────────── */
const SocialProofSection = () => {
  return (
    <section
      className="border-y"
      style={{
        borderColor: 'var(--color-border-light)',
        background:  'var(--color-surface-muted)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        {/* Header */}
        <div className="mb-10 text-center space-y-1">
          <p
            className="text-xs font-bold uppercase tracking-widest font-sans"
            style={{ color: 'var(--color-primary)' }}
          >
            By the numbers
          </p>
          <h2
            className="font-serif text-2xl font-bold"
            style={{ color: 'var(--color-text-base)' }}
          >
            Trusted by foodies &amp; partners across India
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.id} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialProofSection