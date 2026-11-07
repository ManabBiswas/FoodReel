import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

const RISK_REVERSAL = ['Free to join', 'No setup fees', 'Keep your own menu']

const CTABannerSection = () => {
  return (
    <section className="px-6 py-20 md:py-24">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-6 py-14 md:px-16 md:py-20"
        style={{ background: 'var(--color-primary)', color: '#1a1208' }}
      >
        {/* Warm light and depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 82% 0%, rgba(255,208,77,0.55) 0%, transparent 55%), radial-gradient(circle at 0% 100%, rgba(229,90,0,0.5) 0%, transparent 45%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.24em] text-[#1a1208]/80">
            For restaurant partners
          </p>

          <h2
            className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl"
            style={{ color: '#1a1208', textWrap: 'balance' }}
          >
            Turn your kitchen into a viral sensation.
          </h2>

          <p className="mt-5 font-sans text-base leading-relaxed text-[#1a1208]/85 md:text-lg">
            Join thousands of partners growing their brand through short-form food
            storytelling — and turn every reel into an order.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/partner-register"
              className="pressable inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-sans text-sm font-bold text-[#1a1208] shadow-[0_12px_30px_rgba(26,18,8,0.18)] transition-colors duration-200 hover:bg-[#fff6e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1208] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] sm:w-auto"
            >
              Get Started Today
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/contact-us"
              className="pressable inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1a1208]/25 bg-[#1a1208]/5 px-7 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors duration-200 hover:bg-[#1a1208]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1208] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] sm:w-auto"
            >
              Request Demo
            </Link>
          </div>

          {/* Risk reversal */}
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-xs font-semibold text-[#1a1208]/80">
            {RISK_REVERSAL.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default CTABannerSection
