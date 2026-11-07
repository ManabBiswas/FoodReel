import { splitText } from 'animejs'

/*
 * Splits a heading into clipped words or characters for a masked entrance.
 * anime.js keeps a visually hidden copy of the original text for assistive
 * technology, so the visible split units are decorative.
 */
const clipUnit = (unit) => {
  const wrapper = unit.parentElement
  if (!wrapper) return

  wrapper.style.display = 'inline-block'
  wrapper.style.overflow = 'clip'
  wrapper.style.verticalAlign = 'top'
  wrapper.style.paddingBottom = '0.12em'
  wrapper.style.marginBottom = '-0.12em'
}

export const splitForReveal = (element, { by = 'words', accessible = true } = {}) => {
  if (!element) return null

  const splitter = splitText(element, {
    words: by === 'words' ? { wrap: 'clip' } : false,
    chars: by === 'chars' ? { wrap: 'clip' } : false,
    accessible
  })

  const units = by === 'chars' ? splitter.chars : splitter.words
  units.forEach((unit) => {
    clipUnit(unit)
    // Apply the start state before paint so the split never flashes visible.
    unit.style.transform = 'translateY(115%)'
    unit.style.opacity = '0'
  })

  return { splitter, units }
}
