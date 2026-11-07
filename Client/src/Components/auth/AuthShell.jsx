import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Logo from '../../assets/logo.png'

const AuthShell = ({
  mode = 'user',
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt,
  sideEyebrow,
  sideTitle,
  sideCopy,
  sideNote,
  children,
  footer
}) => {
  const alternate =
    mode === 'partner'
      ? { to: '/login', label: 'Food lover sign in' }
      : { to: '/partner-login', label: 'Partner sign in' }

  return (
    <div className="min-h-screen bg-[#f7f2e8]">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to="/" className="shrink-0">
          <img src={Logo} alt="FoodReel" className="h-9 w-24 object-contain" />
        </Link>
        <div className="flex items-center gap-5 font-sans text-sm">
          <Link
            to={alternate.to}
            className="hidden text-[#5f5548] transition-colors hover:text-[#1a1208] sm:inline"
          >
            {alternate.label}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-semibold text-[#9a3412] transition-colors hover:text-[#1a1208]"
          >
            Back home
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 pb-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-stretch lg:pb-16">
        <section className="flex items-center justify-center py-6 lg:py-14">
          <div className="w-full max-w-md">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a3412]">
              {eyebrow}
            </p>
            <h1
              className="mt-4 font-serif text-4xl font-black leading-[1.02] text-[#1a1208] sm:text-5xl"
              style={{ textWrap: 'balance' }}
            >
              {title}
            </h1>
            <p className="mt-4 font-sans text-[15px] leading-relaxed text-[#5f5548]">
              {subtitle}
            </p>
            <div className="mt-8">{children}</div>
            {footer && (
              <div className="mt-7 border-t border-[#e6d9c4] pt-5 font-sans text-sm text-[#5f5548]">
                {footer}
              </div>
            )}
          </div>
        </section>

        <aside className="relative hidden min-h-[620px] overflow-hidden rounded-[2rem] border border-[#e6d9c4] lg:block">
          <img
            src={image}
            alt={imageAlt}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#120d08]/90 via-[#120d08]/30 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-8 xl:p-10">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffd04d]">
              {sideEyebrow}
            </p>
            <p className="mt-3 max-w-sm font-serif text-3xl font-bold leading-tight text-[#fffdf8]">
              {sideTitle}
            </p>
            <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-white/75">
              {sideCopy}
            </p>
            <div className="mt-6 flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.18em] text-white/55">
              <span aria-hidden="true" className="h-px w-8 bg-[#ffb800]" />
              {sideNote}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default AuthShell
