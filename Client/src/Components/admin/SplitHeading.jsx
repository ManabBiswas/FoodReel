import { useLayoutEffect, useRef } from 'react'
import { animate, cubicBezier, splitText, stagger } from 'animejs'

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true


const SplitHeading = ({ text, as: Tag = 'h2', className, style }) => {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined

    el.textContent = text
    if (prefersReducedMotion()) return undefined

    const splitter = splitText(el, { chars: true, words: false })
    if (!splitter.chars.length) {
      splitter.revert()
      return undefined
    }

    const animation = animate(splitter.chars, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 420,
      delay: stagger(12),
      easing: EASE_OUT,
    })

    return () => {
      animation.pause()
      splitter.revert()
    }
  }, [text])

  return <Tag ref={ref} className={className} style={style} />
}

export default SplitHeading
