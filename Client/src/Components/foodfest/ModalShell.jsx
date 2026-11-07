import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'  // createPortal is used to render the modal outside of the main React component tree, allowing it to overlay other content without being affected by parent styles or z-index issues.
import { X } from 'lucide-react'

/**
 * Accessible modal frame used by the FoodFest purchase and stall flows.
 */
const ModalShell = ({ title, onClose, busy = false, maxWidth = 'max-w-lg', children }) => {
  const titleId = useId()
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    closeRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) onCloseRef.current?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
      style={{ background: 'rgba(17, 13, 5, 0.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl`}
        style={{ background: 'var(--color-background-white)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          <h2
            id={titleId}
            className="font-serif text-lg font-bold leading-tight"
            style={{ color: 'var(--color-text-base)' }}
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body // Render the modal into the body to avoid z-index and stacking context issues
  )
}

export default ModalShell
