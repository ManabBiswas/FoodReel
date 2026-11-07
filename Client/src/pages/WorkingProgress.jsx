import React, { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CalendarDays, Film, Store } from 'lucide-react'
import { createTimeline, stagger } from 'animejs'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { splitForReveal } from '../utils/splitReveal'

const destinations = [
  {
    to: '/events',
    title: 'FoodFest',
    copy: 'Browse upcoming festivals, compare tickets, and keep every pass together.',
    Icon: CalendarDays
  },
  {
    to: '/reels',
    title: 'Reels',
    copy: 'Watch what local kitchens are cooking right now.',
    Icon: Film
  },
  {
    to: '/partner-register',
    title: 'Partner with us',
    copy: 'Put your kitchen on the feed and turn discovery into orders.',
    Icon: Store
  }
]

const WorkingProgress = () => {
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const copyRef = useRef(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const heading = splitForReveal(headingRef.current)
    if (!heading) return

    const eyebrow = eyebrowRef.current
    const copy = copyRef.current

    if (eyebrow) eyebrow.style.opacity = '0'
    if (copy) copy.style.opacity = '0'

    const timeline = createTimeline({
      defaults: { ease: 'out(3)', duration: 850 }
    })

    timeline
      .add(eyebrowRef.current, {
        opacity: [0, 1],
        y: [8, 0],
        duration: 450
      }, 0)
      .add(heading.units, {
        y: ['115%', '0%'],
        opacity: [0, 1],
        duration: 850,
        delay: stagger(45)
      }, 100)
      .add(copyRef.current, {
        opacity: [0, 1],
        y: [10, 0],
        duration: 550
      }, 450)

    return () => {
      timeline.revert()
      heading.splitter.revert()
      if (eyebrow) eyebrow.style.opacity = ''
      if (copy) copy.style.opacity = ''
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f2e8]">
      <Navbar />

      <main className="flex flex-1 items-center px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <p
            ref={eyebrowRef}
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a3412]"
          >
            In the kitchen
          </p>
          <h1
            ref={headingRef}
            className="mt-4 max-w-3xl font-serif text-5xl font-black leading-[0.98] text-[#1a1208] sm:text-6xl lg:text-7xl"
            style={{ textWrap: 'balance' }}
          >
            This page is still{' '}
            <span className="italic text-[#e55a00]">plating.</span>
          </h1>
          <p
            ref={copyRef}
            className="mt-6 max-w-xl font-sans text-base leading-relaxed text-[#5f5548] sm:text-lg"
          >
            We&apos;re building this part of FoodReel. The rest of the table is ready.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {destinations.map(({ to, title, copy, Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-2xl border border-[#e6d9c4] bg-[#fffdf8] p-6 transition-colors hover:border-[#1a1208]"
              >
                {React.createElement(Icon, {
                  className: 'h-5 w-5 text-[#e55a00]',
                  'aria-hidden': true
                })}
                <h2 className="mt-6 font-serif text-2xl font-bold text-[#1a1208]">
                  {title}
                </h2>
                <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-[#6b6460]">
                  {copy}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-bold text-[#9a3412]">
                  Explore
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e6d9c4] bg-[#fffdf8] p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-sans text-sm leading-relaxed text-[#5f5548]">
              Looking for something specific? Tell us what you need.
            </p>
            <Link
              to="/contact-us"
              className="inline-flex shrink-0 items-center gap-2 font-sans text-sm font-bold text-[#9a3412] transition-colors hover:text-[#1a1208]"
            >
              Contact us
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default WorkingProgress
