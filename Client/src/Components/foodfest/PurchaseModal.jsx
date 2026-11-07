import React, { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSWRConfig } from 'swr'
import ModalShell from './ModalShell'
import { API_ENDPOINTS, axiosConfig } from '../../config/Api'
import { useAuth } from '../../hooks/useAuth'
import { useNow } from '../../hooks/useNow'
import { newIdempotencyKey } from '../../utils/idempotencyKey'
import { extractApiError, showSuccess, showWarning } from '../../utils/toast'
import {
  PENDING_TICKET_HOLD_MS,
  formatCurrency,
  formatDateRange,
  formatRemaining,
} from '../../utils/foodfest'
import { CreditCard, LoaderCircle, CircleCheck, TriangleAlert, Clock, RefreshCw, Ticket, ExternalLink } from 'lucide-react'

const TONES = {
  error: { background: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#DC2626' },
  warning: { background: '#FFFBEB', border: '#FCD34D', text: '#92400E', icon: '#D97706' },
  info: { background: 'var(--color-surface-muted)', border: 'var(--color-border-light)', text: 'var(--color-text-muted)', icon: 'var(--color-text-muted)' },
}

const Alert = ({ tone = 'error', children }) => {
  const palette = TONES[tone] || TONES.error
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ background: palette.background, border: `1px solid ${palette.border}` }}
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.icon }} />
      <p className="text-sm leading-relaxed font-sans" style={{ color: palette.text }}>
        {children}
      </p>
    </div>
  )
}

const BusyPanel = ({ title, description }) => (
  <div className="flex flex-col items-center py-10 text-center">
    <LoaderCircle className="h-10 w-10 animate-spin" style={{ color: 'var(--color-primary)' }} />
    <p className="mt-4 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
      {title}
    </p>
    <p className="mt-1 max-w-sm text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
      {description}
    </p>
  </div>
)

const primaryButton =
  'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold font-sans transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const PurchaseModal = ({ event, tier, onClose }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutate } = useSWRConfig()
  const now = useNow(1000)

  const [phase, setPhase] = useState('idle')
  const [purchase, setPurchase] = useState(null)
  const [verifyAttempt, setVerifyAttempt] = useState(null)
  const [error, setError] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)

  // One key per modal session. A network retry reuses it, so the server
  // replays the same ticket and Razorpay order instead of reserving a second seat.
  const idempotencyKeyRef = useRef(newIdempotencyKey())
  const paymentSubmittedRef = useRef(false)

  const holdExpired = expiresAt ? now >= expiresAt : false
  const busy = phase === 'creating' || phase === 'verifying'

  const verifyPayment = useCallback(
    async (response, order) => {
      setError('')
      setPhase('verifying')

      try {
        const { data } = await axios.post(
          API_ENDPOINTS.foodfest.ticketVerify,
          {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ticketId: order.ticketId,
          },
          axiosConfig
        )

        showSuccess(
          data?.alreadyFinalised
            ? 'Ticket already confirmed.'
            : 'Ticket confirmed. Your QR pass is ready.'
        )

        setPhase('success')

        // Do not let a refresh failure turn a successful verification into an
        // error screen. The My Tickets page fetches fresh data on mount.
        mutate(API_ENDPOINTS.foodfest.myTickets).catch(() => {})
        navigate('/my-tickets', { state: { highlightTicketId: data?.ticket?.id } })
      } catch (err) {
        const code = err.response?.data?.code
        const terminal = code === 'TICKET_EXPIRED' || code === 'TICKET_REFUNDED'

        setError(extractApiError(err, 'Could not verify the payment. Please retry.'))
        setVerifyAttempt({ response, order })
        setPhase(terminal ? 'failed' : 'verify_error')
      }
    },
    [mutate, navigate]
  )

  const openCheckout = useCallback(
    (order) => {
      if (typeof window.Razorpay !== 'function') {
        setError('The payment gateway could not load. Disable any ad blocker and try again.')
        setPhase('pending')
        return
      }

      paymentSubmittedRef.current = false
      const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()

      let checkout
      try {
        checkout = new window.Razorpay({
          key: order.keyId,
          amount: Math.round(order.amount * 100),
          currency: order.currency || 'INR',
          name: 'FoodReel',
          description: `${event.name} - ${tier.name}`,
          order_id: order.razorpayOrderId,
          prefill: {
            name: profileName,
            email: user?.email || '',
            contact: user?.mobile || user?.phone || '',
          },
          notes: { ticketId: String(order.ticketId) },
          theme: { color: '#ff6a00' },
          handler: (response) => {
            paymentSubmittedRef.current = true
            verifyPayment(response, order)
          },
          modal: {
            ondismiss: () => {
              if (paymentSubmittedRef.current) return
              setError('Payment was not completed. Your seat is held for a short time.')
              setPhase('pending')
            },
          },
        })
      } catch {
        setError('The payment window could not open. Please retry.')
        setPhase('pending')
        return
      }

      try {
        checkout.on('payment.failed', (response) => {
          if (paymentSubmittedRef.current) return
          setError(response?.error?.description || 'The payment attempt failed. You can try again.')
          setPhase('pending')
          showWarning('Payment failed. Your seat is still held for a few minutes.')
        })
      } catch {
        // A gateway script that loaded but is missing the event API should not
        // prevent the checkout window itself from opening.
      }

      try {
        checkout.open()
        setPhase('awaiting_payment')
      } catch {
        setError('The payment window could not open. Please retry.')
        setPhase('pending')
      }
    },
    [event, tier, user, verifyPayment]
  )

  const startPurchase = useCallback(async () => {
    if (typeof window.Razorpay !== 'function') {
      setError('The payment gateway could not load. Disable any ad blocker and try again.')
      setPhase('error')
      return
    }

    setError('')
    setPhase('creating')

    try {
      const { data } = await axios.post(
        API_ENDPOINTS.foodfest.ticketPurchase,
        { eventId: event._id, tierId: tier._id },
        {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Idempotency-Key': idempotencyKeyRef.current,
          },
        }
      )

      setPurchase(data)
      setExpiresAt(Date.now() + PENDING_TICKET_HOLD_MS)
      openCheckout(data)
    } catch (err) {
      setError(extractApiError(err, 'Could not start the ticket purchase.'))
      setPhase('error')
    }
  }, [event, tier, openCheckout])

  const retryPayment = useCallback(() => {
    if (!purchase) return

    if (holdExpired) {
      setError('This ticket hold has expired. The seat has been released.')
      setPhase('failed')
      return
    }

    openCheckout(purchase)
  }, [purchase, holdExpired, openCheckout])

  const restart = useCallback(() => {
    idempotencyKeyRef.current = newIdempotencyKey()
    setPurchase(null)
    setVerifyAttempt(null)
    setExpiresAt(null)
    setError('')
    setPhase('idle')
  }, [])

  const goToTickets = () => {
    onClose()
    navigate('/my-tickets')
  }

  const remaining = expiresAt ? expiresAt - now : null

  let content = null

  if (phase === 'idle') {
    content = (
      <div className="space-y-5">
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-sans"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Ticket
              </p>
              <p className="mt-1 font-serif text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>
                {tier.name}
              </p>
              <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
                {event.name}
              </p>
              <p className="mt-1 text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
                {formatDateRange(event.startTime, event.endTime)}
              </p>
            </div>
            <p className="shrink-0 font-serif text-2xl font-black" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(tier.price)}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
          One ticket per purchase. Your QR pass appears in My Tickets as soon as the payment is
          confirmed.
        </p>

        {error ? <Alert>{error}</Alert> : null}

        <button type="button" onClick={startPurchase} className={primaryButton} style={{ background: 'var(--color-primary)', color: '#fff' }}>
          <CreditCard className="h-4 w-4" />
          Pay {formatCurrency(tier.price)}
        </button>

        <p className="text-center text-xs font-sans" style={{ color: 'var(--color-text-faint)' }}>
          Secure payment by Razorpay
        </p>
      </div>
    )
  } else if (phase === 'creating') {
    content = <BusyPanel title="Reserving your ticket" description="This takes a few seconds. Do not close this window." />
  } else if (phase === 'awaiting_payment') {
    content = (
      <BusyPanel
        title="Complete the payment"
        description={`Use the Razorpay window to pay ${formatCurrency(purchase?.amount ?? tier.price)}. Keep this page open until it closes.`}
      />
    )
  } else if (phase === 'verifying') {
    content = <BusyPanel title="Confirming your payment" description="Razorpay has your payment. We are confirming it and generating your QR pass." />
  } else if (phase === 'pending') {
    content = (
      <div className="space-y-5">
        <Alert tone="warning">
          {error || 'Payment was not completed. Your seat is held for a short time.'}
        </Alert>

        <div className="rounded-2xl px-4 py-3" style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: '#92400E' }} />
            <p className="text-sm font-bold font-sans" style={{ color: '#92400E' }}>
              {holdExpired
                ? 'Ticket hold expired'
                : remaining !== null
                  ? `Seat held for ${formatRemaining(remaining)}`
                  : 'Seat held for a few minutes'}
            </p>
          </div>
          <p className="mt-1 text-xs leading-relaxed font-sans" style={{ color: '#92400E' }}>
            {holdExpired
              ? 'The reservation has been released. Start a new purchase to try again.'
              : 'Finish the payment before the hold ends or the seat is released automatically.'}
          </p>
        </div>

        <div className="space-y-2">
          {!holdExpired && purchase ? (
            <button type="button" onClick={retryPayment} className={primaryButton} style={{ background: 'var(--color-primary)', color: '#fff' }}>
              <RefreshCw className="h-4 w-4" />
              Retry payment
            </button>
          ) : null}

          {holdExpired ? (
            <button type="button" onClick={restart} className={primaryButton} style={{ background: 'var(--color-primary)', color: '#fff' }}>
              <Ticket className="h-4 w-4" />
              Start a new purchase
            </button>
          ) : null}

          <button
            type="button"
            onClick={goToTickets}
            className={secondaryButton}
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }}
          >
            <ExternalLink className="h-4 w-4" />
            View my tickets
          </button>
        </div>
      </div>
    )
  } else if (phase === 'verify_error') {
    content = (
      <div className="space-y-5">
        <Alert>{error}</Alert>

        <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-start gap-2">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--color-text-muted)' }}>
              Your payment may have been captured. Retry verification before paying again. It is
              safe to verify the same payment more than once.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => verifyAttempt && verifyPayment(verifyAttempt.response, verifyAttempt.order)}
            className={primaryButton}
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry verification
          </button>
          <button
            type="button"
            onClick={goToTickets}
            className={secondaryButton}
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }}
          >
            <ExternalLink className="h-4 w-4" />
            View my tickets
          </button>
        </div>
      </div>
    )
  } else if (phase === 'failed') {
    content = (
      <div className="space-y-5">
        <Alert>{error}</Alert>

        <div className="space-y-2">
          <button type="button" onClick={restart} className={primaryButton} style={{ background: 'var(--color-primary)', color: '#fff' }}>
            <RefreshCw className="h-4 w-4" />
            Start a new purchase
          </button>
          <button
            type="button"
            onClick={onClose}
            className={secondaryButton}
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-base)' }}
          >
            Close
          </button>
        </div>
      </div>
    )
  } else if (phase === 'error') {
    content = (
      <div className="space-y-5">
        <Alert>{error}</Alert>
        <button type="button" onClick={startPurchase} className={primaryButton} style={{ background: 'var(--color-primary)', color: '#fff' }}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    )
  } else {
    content = (
      <div className="flex flex-col items-center py-10 text-center">
        <CircleCheck className="h-10 w-10" style={{ color: '#15803D' }} />
        <p className="mt-4 font-serif text-lg font-bold" style={{ color: 'var(--color-text-base)' }}>
          Ticket confirmed
        </p>
        <p className="mt-1 text-sm font-sans" style={{ color: 'var(--color-text-muted)' }}>
          Opening My Tickets...
        </p>
      </div>
    )
  }

  return (
    <ModalShell title="Buy tickets" onClose={onClose} busy={busy}>
      {content}
    </ModalShell>
  )
}

export default PurchaseModal
