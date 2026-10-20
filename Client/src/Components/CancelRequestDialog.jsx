import React, { useEffect, useState } from 'react'
import { X, Loader2, AlertTriangle, ChefHat } from 'lucide-react'

const REASONS = [
  'Item unavailable',
  'Out of ingredients',
  'Kitchen equipment failure',
  'Food quality issue',
  'Cannot prepare in time',
  'Other',
]

/**
 * Collects a reason for asking an admin to cancel an order the partner has
 * already started preparing.
 */
const CancelRequestDialog = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [selected, setSelected] = useState(REASONS[0])
  const [details, setDetails] = useState('')

  useEffect(() => {
    if (open) {
      setSelected(REASONS[0])
      setDetails('')
    }
  }, [open])

  if (!open) return null

  const isOther = selected === 'Other'
  const canConfirm = !isOther || details.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,18,8,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-request-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
              <ChefHat className="h-5 w-5 text-amber-600" />
            </span>
            <div>
              <h3 id="cancel-request-dialog-title" className="font-serif text-lg font-bold text-gray-900">
                Unable to serve this order
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                The food is already being prepared, so an admin has to approve the cancellation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Why can you not serve it?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelected(reason)}
                className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all cursor-pointer ${
                  selected === reason
                    ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="cancel-request-details">
              {isOther ? 'Tell us more' : 'Extra details (optional)'}
            </label>
            <textarea
              id="cancel-request-details"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Anything the admin should know…"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{details.length}/500</p>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              The customer keeps their order until an admin decides. If it is approved they are
              refunded automatically.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => onSubmit(selected, details.trim())}
            disabled={!canConfirm || submitting}
            className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send request
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelRequestDialog
