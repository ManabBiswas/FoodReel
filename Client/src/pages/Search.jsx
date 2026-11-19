import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Search as SearchIcon, UtensilsCrossed, X } from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import QuickOrderModal from '../Components/QuickOrderModal'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'
import { getFoodMedia } from '../utils/imagekit.utils'

const RESULT_LIMIT = 24

const ResultCard = ({ food, onOrder }) => {
  const media = getFoodMedia(food)
  const price = food.price

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
        {media.src ? (
          <img
            src={media.src}
            alt={food.name || 'Dish'}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-[#c9c2b6]" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-1 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
          {food.name}
        </h2>
        <p className="mt-0.5 line-clamp-1 font-sans text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {food.foodPartner?.companyName || 'FoodReel kitchen'}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-sans text-sm font-bold" style={{ color: 'var(--color-text-base)' }}>
            {price ? `₹${price}` : '—'}
          </span>
          {price ? (
            <button
              type="button"
              onClick={() => onOrder(food)}
              className="rounded-xl px-4 py-2 font-sans text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              style={{ background: 'var(--color-primary)' }}
            >
              Order
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState(searchParams.get('q') ?? '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderFood, setOrderFood] = useState(null)

  const term = input.trim()

  useEffect(() => {
    if (!term) {
      setResults([])
      setError('')
      setLoading(false)
      setSearchParams({}, { replace: true })
      return undefined
    }

    setLoading(true)
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(API_ENDPOINTS.food.getAll, {
          ...axiosConfig,
          params: { q: term, postType: 'food', limit: RESULT_LIMIT }
        })
        if (cancelled) return
        setResults(data.data ?? [])
        setError('')
        setSearchParams({ q: term }, { replace: true })
      } catch {
        if (!cancelled) setError('Search is taking a breather. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, setSearchParams])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#c2410c]">
            Search
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold md:text-5xl" style={{ color: 'var(--color-text-base)' }}>
            Find your next craving.
          </h1>

          <div className="relative mt-8 max-w-2xl">
            <label htmlFor="search-input" className="sr-only">
              Search dishes
            </label>
            <SearchIcon
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9e9890]"
              aria-hidden="true"
            />
            <input
              id="search-input"
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search dishes, kitchens, cravings..."
              autoComplete="off"
              className="w-full rounded-2xl border border-[var(--color-border-medium)] bg-white py-4 pl-12 pr-12 font-sans text-base text-[#1a1208] placeholder:text-[#9e9890] focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/15"
            />
            {input ? (
              <button
                type="button"
                onClick={() => setInput('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#9e9890] transition-colors hover:bg-[#f2ede3] hover:text-[#1a1208]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="mt-10" aria-live="polite">
            {!term ? (
              <p className="font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Type a dish or kitchen name to see what&apos;s cooking.
              </p>
            ) : loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse overflow-hidden rounded-2xl"
                    style={{ background: 'var(--color-border-light)' }}
                  >
                    <div style={{ aspectRatio: '4/3' }} />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-white/60" />
                      <div className="h-3 w-1/2 rounded bg-white/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white px-6 py-12 text-center">
                <p className="font-sans text-sm text-[#9a3412]">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-medium)] bg-white px-6 py-12 text-center">
                <h2 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                  Nothing matched &ldquo;{term}&rdquo;.
                </h2>
                <p className="mx-auto mt-2 max-w-md font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Try a shorter word, or{' '}
                  <Link to="/reels" className="font-semibold underline">
                    browse the reels feed
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                <p className="mb-5 font-sans text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {results.length} {results.length === 1 ? 'dish' : 'dishes'} for &ldquo;{term}&rdquo;
                </p>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.map((food) => (
                    <ResultCard key={food._id} food={food} onOrder={setOrderFood} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <QuickOrderModal
        food={orderFood}
        isOpen={Boolean(orderFood)}
        onClose={() => setOrderFood(null)}
      />
    </div>
  )
}

export default Search
