/**
 * Shared FoodFest formatting and state helpers.
 *
 * These are deliberately pure functions: the same event/tier/ticket document
 * must render the same way on the browse page, the detail page, and the ticket
 * wallet. Keeping the maths here also keeps the components small.
 */

export const PENDING_TICKET_HOLD_MS = 15 * 60 * 1000

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatCurrency = (value) => inr.format(Number(value) || 0)

export const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateRange = (start, end) => {
  if (!start) return ''
  const startText = formatDate(start)
  if (!end) return startText
  const endText = formatDate(end)
  return startText === endText ? startText : `${startText} - ${endText}`
}

export const formatTimeRange = (start, end) => {
  if (!start || !end) return ''
  const opts = { hour: '2-digit', minute: '2-digit' }
  const startText = new Date(start).toLocaleTimeString('en-IN', opts)
  const endText = new Date(end).toLocaleTimeString('en-IN', opts)
  return `${startText} - ${endText}`
}

export const getEventSalesState = (event, now = Date.now()) => {
  if (!event) return { onSale: false, label: 'Unavailable' }
  if (event.status === 'completed') return { onSale: false, label: 'Event ended' }
  if (event.status === 'cancelled') return { onSale: false, label: 'Event cancelled' }
  if (event.status === 'draft') return { onSale: false, label: 'Not announced' }

  const start = event.salesStart ? new Date(event.salesStart).getTime() : null
  const end = event.salesEnd ? new Date(event.salesEnd).getTime() : null

  // The backend enforces the event window for live events too, so the UI must
  // not advertise "Live now" once the sales window has closed.
  if (start && now < start) {
    return { onSale: false, label: `Sales open ${formatDate(event.salesStart)}` }
  }
  if (end && now > end) return { onSale: false, label: 'Sales closed' }
  if (event.status === 'live') return { onSale: true, label: 'Live now' }
  return { onSale: true, label: 'On sale' }
}

export const getTierSalesState = (tier, now = Date.now()) => {
  if (!tier || tier.active === false) return { onSale: false, label: 'Unavailable' }

  const start = tier.salesStart ? new Date(tier.salesStart).getTime() : null
  const end = tier.salesEnd ? new Date(tier.salesEnd).getTime() : null

  if (start && now < start) {
    return { onSale: false, label: `Opens ${formatDate(tier.salesStart)}` }
  }
  if (end && now > end) return { onSale: false, label: 'Sales closed' }
  return { onSale: true, label: 'On sale' }
}

export const getTierAvailability = (tier) =>
  Math.max(0, (tier?.quantity ?? 0) - (tier?.sold ?? 0) - (tier?.reserved ?? 0))

export const getPendingExpiry = (ticket) => {
  const created = ticket?.createdAt ? new Date(ticket.createdAt).getTime() : NaN
  return Number.isNaN(created) ? null : created + PENDING_TICKET_HOLD_MS
}

export const formatRemaining = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return 'Expired'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export const TICKET_STATUS_META = {
  pending_payment: {
    label: 'Payment pending',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FCD34D',
  },
  valid: {
    label: 'Valid',
    bg: '#DCFCE7',
    text: '#15803D',
    border: '#86EFAC',
  },
  used: {
    label: 'Scanned',
    bg: '#E5E7EB',
    text: '#374151',
    border: '#D1D5DB',
  },
  expired: {
    label: 'Expired',
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#E5E7EB',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FCA5A5',
  },
  refunded: {
    label: 'Refunded',
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#93C5FD',
  },
}

export const getTicketStatusMeta = (status) =>
  TICKET_STATUS_META[status] || {
    label: status || 'Unknown',
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#E5E7EB',
  }

export const getTicketGroup = (status) => {
  if (status === 'valid' || status === 'pending_payment') return 'upcoming'
  if (status === 'used') return 'scanned'
  return 'past'
}
