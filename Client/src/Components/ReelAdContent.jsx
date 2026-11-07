import React, { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Sparkles, Tag } from 'lucide-react'
import { showWarning } from '../utils/toast'
import { copyText } from '../utils/clipboard'

const PROMOTION_LABELS = {
  discount: 'Discount',
  bogo: 'Buy one get one',
  combo: 'Combo deal',
  seasonal: 'Seasonal special',
  announcement: 'Announcement'
}

const formatPrice = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return value
  return number.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const ReelAdContent = ({ ad, onAdClick }) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [ad?._id, ad?.promoCode])

  if (!ad) return null

  // Support both the mapped reel shape and a raw Advertisement document.
  const brandName =
    ad.brandName ||
    ad.businessName ||
    ad.partnerId?.companyName ||
    ad.partnerId?.email ||
    'Sponsored'
  const brandLogo = ad.brandLogo || ad.partnerId?.profileImage || null
  const title = ad.title || ad.name || 'Special offer'
  const hasLink = Boolean(ad.ctaLink && ad.ctaLink !== '#')
  const hasPromoCode = Boolean(ad.promoCode)
  const hasPrices = Boolean(ad.prices?.original || ad.prices?.discounted)

  const handleCta = async () => {
    if (hasLink) {
      onAdClick?.(ad)
      return
    }

    if (!hasPromoCode) return

    const copied = await copyText(ad.promoCode)
    if (copied) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } else {
      // Clipboard access can be blocked; still tell the user what happened
      // instead of leaving the button looking unresponsive.
      showWarning('Could not copy the code — select it manually')
    }
  }

  return (
    <>
      {/* Minimal Ad Badge - Top Right */}
      <div className="absolute right-4 top-4 z-20">
        <div className="flex items-center gap-1.5 rounded-md border border-white/20 bg-black/40 px-2.5 py-1 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-white/70" />
          <span className="text-xs font-medium text-white/70">Ad</span>
        </div>
      </div>

      {/* Premium CTA Card - Bottom */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/45" />

        <div className="relative p-5 pb-8 pt-20">
          {/* Brand Header */}
          <div className="mb-4 flex items-center gap-3">
            {brandLogo && (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95 p-1.5 shadow-xl">
                <img src={brandLogo} alt="" className="h-full w-full rounded-lg object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">{brandName}</h4>
              <p className="text-xs text-white/60">Sponsored</p>
            </div>
          </div>

          {/* Ad Content */}
          <div className="mb-4">
            <h3 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] sm:text-2xl">
              {title}
            </h3>
            {ad.description && (
              <p className="mb-3 line-clamp-2 text-sm text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{ad.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {ad.promotionType && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Tag className="h-3.5 w-3.5" />
                  {PROMOTION_LABELS[ad.promotionType] || ad.promotionType}
                </span>
              )}

              {hasPromoCode && (
                <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-300/70 bg-amber-300/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-100 backdrop-blur">
                  {ad.promoCode}
                </span>
              )}
            </div>

            {hasPrices && (
              <div className="mt-3 flex items-baseline gap-2">
                {ad.prices?.discounted && (
                  <span className="text-2xl font-bold text-amber-200">
                    ₹{formatPrice(ad.prices.discounted)}
                  </span>
                )}
                {ad.prices?.original && (
                  <span
                    className={`text-sm text-white/50 ${
                      ad.prices?.discounted ? 'line-through' : 'font-semibold text-white/90'
                    }`}
                  >
                    ₹{formatPrice(ad.prices.original)}
                  </span>
                )}
              </div>
            )}

            {ad.validUntil && (
              <p className="mt-2 text-xs text-white/55">
                Valid until {new Date(ad.validUntil).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* CTA Button — only rendered when it actually does something. */}
          {(hasLink || hasPromoCode) && (
            <button
              type="button"
              onClick={handleCta}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-black shadow-2xl transition-all hover:bg-gray-100 active:bg-gray-200"
            >
              {hasLink ? (
                <>
                  <span className="text-base">{ad.ctaText || 'View offer'}</span>
                  <ExternalLink className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                  <span className="text-base">{copied ? 'Code copied!' : 'Copy promo code'}</span>
                </>
              )}
            </button>
          )}

          {hasLink && (
            <div className="mt-2 text-center">
              <span className="text-xs text-white/40">
                {ad.ctaLink.replace(/^https?:\/\//, '').split('/')[0]}
              </span>
            </div>
          )}

          <span className="sr-only" aria-live="polite">
            {copied ? 'Promo code copied to clipboard' : ''}
          </span>
        </div>
      </div>
    </>
  )
}

export default ReelAdContent
