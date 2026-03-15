import React from 'react'
import { Link } from 'react-router-dom'

const CTABannerSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 md:px-16 text-center text-white relative">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/40 via-transparent to-transparent"></div>

        <div className="relative z-10 mx-auto max-w-2xl space-y-8">
          <h2 className="font-serif text-4xl font-black md:text-5xl leading-tight">
            Turn your kitchen into a viral sensation.
          </h2>
          <p className="text-lg opacity-90 font-sans">
            Join thousands of partners who are growing their brand through the power of short-form food storytelling.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/partner-register">
              <button className="rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-xl hover:scale-105 transition-transform cursor-pointer font-sans">
                Get Started Today
              </button>
            </Link>
            <button className="rounded-xl bg-primary/20 border border-white/30 px-8 py-4 font-bold text-white hover:bg-primary/30 transition-colors backdrop-blur-sm cursor-pointer font-sans">
              Request Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTABannerSection
