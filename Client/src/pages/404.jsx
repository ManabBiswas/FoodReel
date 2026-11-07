import React, { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CalendarDays, Film, Sparkles } from 'lucide-react'
import { createTimeline, stagger } from 'animejs'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import { splitForReveal } from '../utils/splitReveal'

const popularPages = [
  {
    to: '/events',
    title: 'FoodFest events',
    copy: 'Find a festival, compare tickets, and keep your passes together.',
    Icon: CalendarDays
  },
  {
    to: '/reels',
    title: 'Reels',
    copy: 'Watch what local kitchens are cooking right now.',
    Icon: Film
  },
  {
    to: '/about',
    title: 'About FoodReel',
    copy: 'The story behind the feed, the table, and the community.',
    Icon: Sparkles
  }
]

const ErrorPage = () => {
  const eyebrowRef = useRef(null)
  const digitsRef = useRef(null)
  const headingRef = useRef(null)
  const copyRef = useRef(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const digits = splitForReveal(digitsRef.current, {
      by: 'chars',
      accessible: false
    })
    const heading = splitForReveal(headingRef.current)

    if (!heading) return

    const eyebrow = eyebrowRef.current
    const copy = copyRef.current

    if (eyebrow) eyebrow.style.opacity = '0'
    if (copy) copy.style.opacity = '0'

    const timeline = createTimeline({
      defaults: { ease: 'out(3)', duration: 850 }
    })

    timeline.add(eyebrowRef.current, {
      opacity: [0, 1],
      y: [8, 0],
      duration: 450
    }, 0)

    if (digits) {
      timeline.add(digits.units, {
        y: ['115%', '0%'],
        opacity: [0, 1],
        duration: 900,
        delay: stagger(80)
      }, 80)
    }

    timeline
      .add(heading.units, {
        y: ['115%', '0%'],
        opacity: [0, 1],
        duration: 850,
        delay: stagger(45)
      }, 280)
      .add(copyRef.current, {
        opacity: [0, 1],
        y: [10, 0],
        duration: 550
      }, 600)

    return () => {
      timeline.revert()
      digits?.splitter.revert()
      heading.splitter.revert()
      if (eyebrow) eyebrow.style.opacity = ''
      if (copy) copy.style.opacity = ''
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f2e8]">
      <Navbar />

      <main className="flex flex-1 items-center px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <p
              ref={eyebrowRef}
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a3412]"
            >
              404 / off the menu
            </p>
            <p
              ref={digitsRef}
              aria-hidden="true"
              className="mt-2 font-serif text-[7rem] font-black leading-none text-[#ff6a00] sm:text-[10rem]"
            >
              404
            </p>
            <h1
              ref={headingRef}
              className="mt-2 max-w-xl font-serif text-4xl font-black leading-[1.02] text-[#1a1208] sm:text-5xl"
              style={{ textWrap: 'balance' }}
            >
              This page isn&apos;t on the menu.
            </h1>
            <p
              ref={copyRef}
              className="mt-5 max-w-lg font-sans text-base leading-relaxed text-[#5f5548]"
            >
              The link may have moved, or the page was never plated. Start with one of
              these instead.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800]"
              >
                Back home
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d9cdb9] px-5 py-3 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:border-[#1a1208]"
              >
                Browse FoodFest
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e6d9c4] bg-[#fffdf8] p-6 sm:p-8">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a3412]">
              Popular pages
            </p>
            <ul className="mt-4 divide-y divide-[#e6d9c4]">
              {popularPages.map(({ to, title, copy, Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-start justify-between gap-4 py-4 transition-colors hover:text-[#9a3412]"
                  >
                    <span className="flex items-start gap-3">
                      {React.createElement(Icon, {
                        className: 'mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]',
                        'aria-hidden': true
                      })}
                      <span>
                        <span className="block font-serif text-xl font-bold text-[#1a1208] group-hover:text-[#9a3412]">
                          {title}
                        </span>
                        <span className="mt-1 block font-sans text-sm leading-relaxed text-[#6b6460]">
                          {copy}
                        </span>
                      </span>
                    </span>
                    <ArrowUpRight
                      className="mt-1 h-4 w-4 shrink-0 text-[#9e9890] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#9a3412] motion-reduce:transform-none"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-[#e6d9c4] pt-5 font-sans text-sm leading-relaxed text-[#6b6460]">
              If a link inside FoodReel sent you here,{' '}
              <Link
                to="/contact-us"
                className="font-semibold text-[#9a3412] underline decoration-[#ffb800] decoration-2 underline-offset-4 transition-colors hover:text-[#1a1208]"
              >
                tell us
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ErrorPage
