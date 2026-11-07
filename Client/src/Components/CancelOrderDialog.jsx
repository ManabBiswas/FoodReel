import React, { useEffect, useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'

const USER_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Delivery taking too long',
  'Found a cheaper option',
  'Item not available',
  'Other',
]

const PARTNER_REASONS = [
  'Item unavailable',
  'Out of ingredients',
  'Kitchen at capacity',
  'Cannot fulfil in time',
  'Delivery unavailable in your area',
  'Other',
]

/**
 * Collects a cancellation reason before the order is cancelled, so the reason
 * is stored on the order and visible to both parties.
 */
const CancelOrderDialog = ({
  open,
  mode = 'user',
  onClose,
  onConfirm,
  cancelling = false,
}) => {
  const reasons = mode === 'partner' ? PARTNER_REASONS : USER_REASONS
  const [selected, setSelected] = useState(reasons[0])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setSelected(reasons[0])
      setNote('')
    }
  }, [open, reasons])

  if (!open) return null

  const isOther = selected === 'Other'
  const canConfirm = !isOther || note.trim().length > 0

  const finalReason = isOther ? note.trim() : selected

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,18,8,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !cancelling) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </span>
            <div>
              <h3 id="cancel-dialog-title" className="font-serif text-lg font-bold text-gray-900">
                {mode === 'partner' ? 'Cancel this order?' : 'Cancel your order?'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Please tell us why — {mode === 'partner' ? 'the customer will see this' : 'the restaurant will see this'}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {reasons.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelected(reason)}
                className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all cursor-pointer ${
                  selected === reason
                    ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          {isOther && (
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="cancel-reason-note">
                Tell us more
              </label>
              <textarea
                id="cancel-reason-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                rows="3"
                autoFocus
                placeholder="Add a short reason…"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{note.length}/200</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Keep order
          </button>
          <button
            type="button"
            onClick={() => onConfirm(finalReason)}
            disabled={!canConfirm || cancelling}
            className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
            Cancel order
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelOrderDialog
