import { useLayoutEffect, useRef } from 'react'
import { animate, cubicBezier } from 'animejs'

/* Dashboard numbers use the same motion vocabulary as the rest of the app:
   --ease-out for settling values, --ease-in-out for the scramble reveal. */
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)
const EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1)
const DIGITS = '0123456789'

const defaultFormat = (n) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

const scrambleDigits = (chars, revealed) => {
  let out = ''
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i]
    out += i < revealed || !/[0-9]/.test(char)
      ? char
      : DIGITS[Math.floor(Math.random() * DIGITS.length)]
  }
  return out
}

/**
 * A dashboard number that scrambles into place on first mount (or when
 * `resetKey` changes), then eases between live values.
 *
 * The scramble is deliberately a one-time reveal: the 8s live tick updates
 * numbers an admin is reading, so those use a short count-up instead of
 * churning every digit again.
 *
 * Screen readers get the settled value through an sr-only sibling; the
 * visual span is aria-hidden so random digits are never announced.
 */
const ScrambleNumber = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  countDuration = 500,
  resetKey,
  format = defaultFormat,
  className,
}) => {
  const formatRef = useRef(format)
  formatRef.current = format

  const numeric = Number(value)
  const isNumeric = Number.isFinite(numeric)
  const finalText = `${prefix}${isNumeric ? formatRef.current(numeric) : (value ?? '')}${suffix}`

  const visualRef = useRef(null)
  const previousRef = useRef(isNumeric ? numeric : 0)
  const hasPlayedRef = useRef(false)
  const resetRef = useRef(resetKey)

  useLayoutEffect(() => {
    const to = Number(value)
    const fmt = formatRef.current
    const text = `${prefix}${Number.isFinite(to) ? fmt(to) : (value ?? '')}${suffix}`

    if (!Number.isFinite(to)) {
      if (visualRef.current) visualRef.current.textContent = text
      return undefined
    }

    const isReset = hasPlayedRef.current && resetRef.current !== resetKey
    resetRef.current = resetKey

    if (prefersReducedMotion()) {
      hasPlayedRef.current = true
      previousRef.current = to
      if (visualRef.current) visualRef.current.textContent = text
      return undefined
    }

    let animation
    let state
    let isScramble = false

    if (!hasPlayedRef.current || isReset) {
      isScramble = true
      hasPlayedRef.current = false
      previousRef.current = to

      const chars = fmt(to).split('')
      state = { progress: 0 }
      if (visualRef.current) visualRef.current.textContent = `${prefix}${scrambleDigits(chars, 0)}${suffix}`

      animation = animate(state, {
        progress: 1,
        duration,
        easing: EASE_IN_OUT,
        onUpdate: () => {
          const revealed = Math.floor(state.progress * chars.length)
          if (visualRef.current) visualRef.current.textContent = `${prefix}${scrambleDigits(chars, revealed)}${suffix}`
        },
        onComplete: () => {
          hasPlayedRef.current = true
          previousRef.current = to
          if (visualRef.current) visualRef.current.textContent = text
        },
      })
    } else {
      const from = previousRef.current
      if (from === to) {
        if (visualRef.current) visualRef.current.textContent = text
        return undefined
      }

      state = { value: from }
      animation = animate(state, {
        value: to,
        duration: countDuration,
        easing: EASE_OUT,
        onUpdate: () => {
          const next = Number.isInteger(to) ? Math.round(state.value) : state.value
          if (visualRef.current) visualRef.current.textContent = `${prefix}${fmt(next)}${suffix}`
        },
        onComplete: () => {
          previousRef.current = to
          if (visualRef.current) visualRef.current.textContent = text
        },
      })
    }

    return () => {
      animation?.pause()
      if (isScramble) previousRef.current = to
      else if (state) previousRef.current = state.value
    }
  }, [value, resetKey, prefix, suffix, duration, countDuration, format])

  return (
    <>
      <span ref={visualRef} className={className} aria-hidden="true" />
      <span className="sr-only">{finalText}</span>
    </>
  )
}

export default ScrambleNumber
