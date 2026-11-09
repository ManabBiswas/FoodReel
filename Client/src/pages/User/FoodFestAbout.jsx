import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { animate, createTimeline, cubicBezier, onScroll, stagger } from 'animejs'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Ticket,
} from 'lucide-react'
import Navbar from '../../Components/Navbar'
import Footer from '../../Components/Footer'
import { API_ENDPOINTS } from '../../config/Api'
import { swrFetcher } from '../../utils/fetcher'

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)
const EASE_OUT_BACK = cubicBezier(0.34, 1.56, 0.64, 1)

/* ─── Content ───────────────────────────────────────────────────── */

const AUDIENCES = [
  {
    label: 'Guests',
    title: 'Browse, buy, walk in.',
    copy: 'Browse published festivals, choose a ticket tier, and carry your QR pass in the same account you use for reels and orders.',
    to: '/events',
    cta: 'Browse events',
  },
  {
    label: 'Food partners',
    title: 'Apply, get approved, serve.',
    copy: 'Apply for a stall with dishes from your menu. Once approved, open your stall on event day and serve the crowd.',
    to: '/partner-foodfest',
    cta: 'Apply for a stall',
  },
  {
    label: 'Organizers',
    title: 'Propose, publish, run the day.',
    copy: 'Propose an event, build ticket tiers and gate zones, publish sales, and track the day from one organizer studio.',
    to: '/events/host',
    cta: 'Propose an event',
  },
]

const GUEST_STEPS = [
  {
    title: 'Find a festival',
    copy: 'Open the events page and browse published FoodFest dates. Each listing shows the venue, dates, and whether ticket sales are open.',
  },
  {
    title: 'Choose a tier',
    copy: 'Ticket tiers can differ by price, quantity, and sale window. Availability updates automatically, so you always see what is left.',
  },
  {
    title: 'Pay securely',
    copy: 'Checkout runs through Razorpay. Your seat is held for 15 minutes while you complete the payment.',
  },
  {
    title: 'Get your QR pass',
    copy: 'As soon as payment is confirmed, your ticket and QR pass appear in My Tickets. No printout needed.',
  },
  {
    title: 'Walk in',
    copy: 'Show the QR at the gate. The event team uses venue zones to keep capacity comfortable and entry moving.',
  },
]

const PARTNER_STEPS = [
  {
    title: 'Add your dishes',
    copy: 'Your food posts are your menu. Add them from the partner dashboard so guests can see what you serve.',
  },
  {
    title: 'Apply for a stall',
    copy: 'Open Stall Applications, pick a published event, and select the dishes you want to bring to the festival.',
  },
  {
    title: 'Get reviewed',
    copy: 'The event team reviews every application. You will receive an email with the decision and any notes.',
  },
  {
    title: 'Open on the day',
    copy: 'Once approved, set up at the venue and toggle your stall open when you are ready to serve.',
  },
]

const ORGANIZER_STEPS = [
  {
    title: 'Propose the event',
    copy: 'Share the venue, dates, and ticket sales window from Host an event. Anyone can propose — no partner account needed.',
  },
  {
    title: 'Get approved',
    copy: 'FoodReel reviews the proposal. Approval unlocks the organizer studio for that event.',
  },
  {
    title: 'Build the festival',
    copy: 'Create ticket tiers with prices and quantities, then add venue zones with capacity thresholds for the gates.',
  },
  {
    title: 'Publish',
    copy: 'Move the event from draft to published. Ticket sales follow the window you set.',
  },
  {
    title: 'Go live',
    copy: 'On event day, mark the event live. Gate check-ins and capacity tracking start working.',
  },
  {
    title: 'Complete and review',
    copy: 'When the gates close, mark the event completed and review the summary from your studio.',
  },
]

const FEATURES = [
  {
    icon: Ticket,
    title: 'Ticket tiers',
    copy: 'Set the price, quantity, and sales window for each tier. Inventory updates as tickets sell.',
  },
  {
    icon: QrCode,
    title: 'QR entry',
    copy: 'Every confirmed ticket gets a QR pass and entry code inside My Tickets.',
  },
  {
    icon: DoorOpen,
    title: 'Venue zones',
    copy: 'Zones track gate capacity with warning and critical thresholds. They are not stall locations.',
  },
  {
    icon: Store,
    title: 'Stall applications',
    copy: 'Food partners apply with their own dishes, and the event team reviews each application.',
  },
  {
    icon: Sparkles,
    title: 'Organizer studio',
    copy: 'Tiers, zones, attendees, sales, and the event lifecycle live in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'One account',
    copy: 'Tickets, QR passes, saved reels, and food orders stay connected to the same FoodReel account.',
  },
]

const FAQS = [
  {
    question: 'Do I need an account to attend FoodFest?',
    answer:
      'Browsing events is open to everyone. Buying a ticket requires a free user account so the QR pass can be issued to you and kept in My Tickets.',
  },
  {
    question: 'Can I buy tickets for friends in one go?',
    answer:
      'Right now it is one ticket per purchase. Complete another purchase for each additional guest, and every pass will appear in My Tickets.',
  },
  {
    question: 'Where do I find my ticket?',
    answer:
      'Open My Tickets from your account menu. Each confirmed ticket shows its QR pass, entry code, event date, and ticket tier.',
  },
  {
    question: 'What is a zone?',
    answer:
      'A zone is an entrance or area used by the event team to manage crowd capacity at the gate. It is not a stall location or a vendor placement.',
  },
  {
    question: 'How does a food partner get a stall?',
    answer:
      'Apply from Stall Applications with dishes from your own menu. The event team reviews the application, and approved partners can toggle their stall open on event day.',
  },
  {
    question: 'Can I host my own FoodFest?',
    answer:
      'Yes. Submit an event proposal with your venue and dates. Once FoodReel approves it, the organizer studio opens for that event.',
  },
  {
    question: 'How are payments handled?',
    answer:
      'Ticket payments run through Razorpay. FoodReel does not store your card details.',
  },
]

/* ─── Shared pieces ─────────────────────────────────────────────── */

const SectionLabel = ({ children, dark = false }) => (
  <p
    className={`flex items-center gap-3 font-sans text-xs font-bold ${
      dark ? 'text-[#ffd04d]' : 'text-[#c2410c]'
    }`}
  >
    <span
      aria-hidden="true"
      className={`h-px w-6 ${dark ? 'bg-[#ffd04d]' : 'bg-[#c2410c]'}`}
    />
    {children}
  </p>
)

const StepList = ({ steps, dark = false }) => (
  <ol className={`border-t ${dark ? 'border-[#3a2a16]' : 'border-[#e6d9c4]'}`}>
    {steps.map((step, index) => (
      <li
        key={step.title}
        className={`grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b py-6 ${
          dark ? 'border-[#3a2a16]' : 'border-[#e6d9c4]'
        }`}
      >
        <span
          className={`font-serif text-xl font-bold leading-none ${
            dark ? 'text-[#ffd04d]' : 'text-[#e55a00]'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <h3
            className={`font-serif text-xl font-bold leading-snug ${
              dark ? 'text-[#fffdf8]' : 'text-[#1a1208]'
            }`}
          >
            {step.title}
          </h3>
          <p
            className={`mt-2 max-w-xl font-sans text-sm leading-relaxed ${
              dark ? 'text-[#fff4e0]/70' : 'text-[#5f5548]'
            }`}
          >
            {step.copy}
          </p>
        </div>
      </li>
    ))}
  </ol>
)

const FeatureRow = ({ icon: Icon, title, copy }) => (
  <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 border-t border-[#e6d9c4] py-5">
    <Icon className="mt-0.5 h-4 w-4 text-[#c2410c]" strokeWidth={1.7} aria-hidden="true" />
    <div>
      <h3 className="font-serif text-lg font-bold text-[#1a1208]">{title}</h3>
      <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#5f5548]">{copy}</p>
    </div>
  </div>
)

/* ─── Animated QR pass ──────────────────────────────────────────── */

const QR_SIZE = 21
const QR_CENTER = (QR_SIZE - 1) / 2

const QR_LAYOUT = (() => {
  const grid = Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(null))
  const finderCells = new Set()

  const set = (x, y, value, finder = false) => {
    if (x < 0 || x >= QR_SIZE || y < 0 || y >= QR_SIZE) return
    grid[y][x] = value
    if (finder) finderCells.add(`${x},${y}`)
  }

  const finder = (originX, originY) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        if (x === -1 || x === 7 || y === -1 || y === 7) {
          set(originX + x, originY + y, false)
          continue
        }
        const outer = x === 0 || x === 6 || y === 0 || y === 6
        const center = x >= 2 && x <= 4 && y >= 2 && y <= 4
        set(originX + x, originY + y, outer || center, true)
      }
    }
  }

  finder(0, 0)
  finder(14, 0)
  finder(0, 14)

  for (let index = 8; index < 13; index += 1) {
    set(index, 6, index % 2 === 0)
    set(6, index, index % 2 === 0)
  }

  let seed = 19
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (grid[y][x] === null) grid[y][x] = random() > 0.52
    }
  }

  const finders = [[], [], []]
  const data = []

  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (!grid[y][x]) continue
      if (!finderCells.has(`${x},${y}`)) {
        data.push({ x, y })
        continue
      }
      const group = x >= 13 ? 1 : y >= 13 ? 2 : 0
      finders[group].push({ x, y })
    }
  }

  return { finders, data }
})()

const AnimatedQr = () => {
  const svgRef = useRef(null)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const finders = [...svg.querySelectorAll('[data-qr-finder]')]
    const modules = [...svg.querySelectorAll('[data-qr-module]')]
    const scan = svg.querySelector('[data-qr-scan]')
    const animated = [...finders, ...modules, scan].filter(Boolean)

    animated.forEach((element) => {
      element.style.transformBox = 'fill-box'
      element.style.transformOrigin = 'center'
    })
    finders.forEach((finder) => {
      finder.style.opacity = '0'
    })
    modules.forEach((module) => {
      module.style.opacity = '0'
    })

    const timeline = createTimeline({ defaults: { ease: EASE_OUT } })

    timeline.add(
      finders,
      {
        scale: [0.55, 1],
        opacity: [0, 1],
        duration: 420,
        delay: stagger(90),
        ease: EASE_OUT_BACK,
      },
      0,
    )

    timeline.add(
      modules,
      {
        scale: [0, 1],
        opacity: [0, 1],
        duration: 340,
        delay: (module) => {
          const x = Number(module.dataset.x)
          const y = Number(module.dataset.y)
          return Math.hypot(x - QR_CENTER, y - QR_CENTER) * 14
        },
        ease: EASE_OUT_BACK,
      },
      240,
    )

    timeline.add(
      scan,
      {
        translateY: [-2, 24],
        opacity: [0, 1],
        duration: 780,
        ease: 'linear',
      },
      520,
    )

    timeline.add(scan, { opacity: 0, duration: 180 }, 1300)

    return () => {
      timeline.pause()
      animated.forEach((element) => {
        element.removeAttribute('style')
      })
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 25 25"
      role="img"
      aria-label="QR entry pass"
      shapeRendering="crispEdges"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="qr-scan-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff6a00" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ff6a00" stopOpacity="1" />
          <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
        </linearGradient>
      </defs>

      {QR_LAYOUT.finders.map((cells, group) => (
        <g key={group} data-qr-finder>
          {cells.map(({ x, y }) => (
            <rect key={`${x}-${y}`} x={x + 2} y={y + 2} width="1" height="1" fill="#1a1208" />
          ))}
        </g>
      ))}

      {QR_LAYOUT.data.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x + 2}
          y={y + 2}
          width="1"
          height="1"
          fill="#1a1208"
          data-qr-module
          data-x={x}
          data-y={y}
        />
      ))}

      <g data-qr-scan opacity="0">
        <rect x="1.5" y="0" width="22" height="2.4" fill="url(#qr-scan-gradient)" opacity="0.55" />
        <rect x="1.5" y="1" width="22" height="0.5" fill="#ff6a00" />
      </g>
    </svg>
  )
}

const FestivalPass = () => (
  <div aria-hidden="true" className="mx-auto w-full max-w-[420px]">
    <div className="relative overflow-hidden rounded-2xl border border-[#e55a00] bg-[#ff6a00] p-6 text-[#1a1208] shadow-[0_24px_50px_-32px_rgba(26,18,8,0.5)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.18em]">FoodFest</p>
          <p className="mt-1 font-serif text-4xl font-black leading-none">Admit one</p>
        </div>
        <Ticket className="h-5 w-5" strokeWidth={1.6} />
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5">
        <div className="space-y-5">
          <div>
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.16em]">Festival</p>
            <p className="mt-1 font-sans text-sm font-bold">Entry pass</p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.16em]">Gate</p>
              <p className="mt-1 font-sans text-sm font-bold">Gate A</p>
            </div>
            <div>
              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.16em]">Entry</p>
              <p className="mt-1 font-sans text-sm font-bold">Scan QR</p>
            </div>
          </div>
        </div>

        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#fffdf8] p-2.5 sm:h-28 sm:w-28 sm:p-3">
          <AnimatedQr />
        </div>
      </div>

      <div className="relative my-6 -mx-6 sm:-mx-7">
        <div className="border-t border-dashed border-[#1a1208]/35" />
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f7f2e8]" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f7f2e8]" />
      </div>

      <div className="flex items-center justify-between font-sans text-[9px] font-bold uppercase tracking-[0.16em]">
        <span>One pass per guest</span>
        <span>FoodReel</span>
      </div>
    </div>
  </div>
)

/* ─── Trust numbers ─────────────────────────────────────────────── */

const TRUST_STATS = [
  {
    value: 15,
    suffix: ' min',
    label: 'Seat hold',
    note: 'Inventory is held while Razorpay checkout completes.',
  },
  {
    value: 1,
    suffix: '',
    label: 'QR pass per ticket',
    note: 'Issued to My Tickets as soon as payment is confirmed.',
  },
  {
    value: 0,
    suffix: '',
    label: 'Card details stored',
    note: 'Payments run through Razorpay, not through FoodReel.',
  },
  {
    value: 3,
    suffix: '',
    label: 'Ways into the festival',
    note: 'Guests, food partners, and organizers each get a route.',
  },
]

const AnimatedStat = ({ value, suffix, label, note }) => {
  const valueRef = useRef(null)

  useLayoutEffect(() => {
    const element = valueRef.current
    if (!element) return undefined

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = `${value}${suffix}`
      return undefined
    }

    element.textContent = `0${suffix}`

    const counter = { value: 0 }
    const animation = animate(counter, {
      value,
      duration: 1100,
      ease: EASE_OUT,
      autoplay: onScroll({
        target: element,
        enter: 'bottom 92%',
        repeat: false,
      }),
      onUpdate: () => {
        element.textContent = `${Math.round(counter.value)}${suffix}`
      },
    })

    return () => {
      animation.pause()
      element.textContent = `${value}${suffix}`
    }
  }, [suffix, value])

  return (
    <div className="bg-[#1a1208] p-5 sm:p-6">
      <dt
        ref={valueRef}
        className="font-serif text-4xl font-black leading-none text-[#ffb800] sm:text-5xl"
      >
        {value}
        {suffix}
      </dt>
      <dd className="mt-3 font-sans text-sm font-bold text-[#fffdf8]">{label}</dd>
      <dd className="mt-1.5 font-sans text-xs leading-relaxed text-[#fff4e0]/55">{note}</dd>
    </div>
  )
}

/* ─── Real reviews ──────────────────────────────────────────────── */

const REVIEW_MIN_LENGTH = 12
const REVIEW_LIMIT = 8
const PARTNER_LIMIT = 4

const formatReviewDate = (dateString) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(date)
}

const fetchCommunityReviews = async () => {
  const feed = await swrFetcher(`${API_ENDPOINTS.food.getAll}?limit=24`)
  const partners = new Map()

  for (const food of feed?.data ?? []) {
    const partner = food.foodPartner
    if (partner?._id && !partners.has(partner._id)) {
      partners.set(partner._id, partner.companyName || 'FoodReel partner')
    }
    if (partners.size >= PARTNER_LIMIT) break
  }

  const results = await Promise.allSettled(
    [...partners].map(async ([partnerId, partnerName]) => {
      const response = await swrFetcher(API_ENDPOINTS.reviews.byPartner(partnerId))
      return (response?.data ?? []).map((review) => ({
        id: review._id,
        userName:
          [review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ') ||
          'FoodReel diner',
        rating: review.rating,
        comment: review.comment?.trim() ?? '',
        foodItem: review.foodItem?.name || 'FoodReel order',
        partnerName,
        verified: review.isVerifiedPurchase,
        createdAt: review.createdAt,
      }))
    }),
  )

  return results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .filter((review) => review.comment.length >= REVIEW_MIN_LENGTH)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, REVIEW_LIMIT)
}

const RatingStars = ({ rating }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= rating ? 'fill-[#ffb800] text-[#ffb800]' : 'text-[#fff4e0]/25'
        }`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    ))}
  </div>
)

const ReviewSlider = ({ reviews }) => {
  const [active, setActive] = useState(0)
  const count = reviews.length

  const go = (direction) => {
    setActive((current) => (current + direction + count) % count)
  }

  return (
    <div
      className="mt-10"
      role="group"
      aria-roledescription="carousel"
      aria-label="FoodReel diner reviews"
    >
      <div className="overflow-hidden rounded-2xl border border-[#3a2a16] bg-[#21170c]">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {reviews.map((review, index) => (
            <figure
              key={review.id}
              className="w-full shrink-0 p-6 sm:p-10"
              aria-hidden={index !== active}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <RatingStars rating={review.rating} />
                {review.verified && (
                  <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-[#ffd04d]">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                    Verified order
                  </span>
                )}
              </div>

              <blockquote className="mt-5 line-clamp-5 max-w-4xl font-serif text-2xl leading-snug text-[#fffdf8] sm:text-3xl">
                “{review.comment}”
              </blockquote>

              <figcaption className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-[#3a2a16] pt-5">
                <div>
                  <p className="font-sans text-sm font-bold text-[#fffdf8]">{review.userName}</p>
                  <p className="mt-1 font-sans text-xs text-[#fff4e0]/55">
                    {review.foodItem} · {review.partnerName}
                  </p>
                </div>
                <p className="font-sans text-xs text-[#fff4e0]/40">
                  {formatReviewDate(review.createdAt)}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {reviews.map((review, index) => (
              <button
                key={review.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Go to review ${index + 1}`}
                aria-current={index === active ? 'true' : undefined}
                className={`h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd04d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208] ${
                  index === active ? 'bg-[#ffb800]' : 'bg-[#fff4e0]/25 hover:bg-[#fff4e0]/50'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-2 font-sans text-xs text-[#fff4e0]/45" aria-live="polite">
              {active + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous review"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#3a2a16] text-[#fffdf8] transition-colors hover:border-[#ffb800] hover:text-[#ffb800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd04d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next review"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#3a2a16] text-[#fffdf8] transition-colors hover:border-[#ffb800] hover:text-[#ffb800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd04d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const CommunityReviews = () => {
  const { data, error, isLoading } = useSWR(
    'foodfest-about/community-reviews',
    fetchCommunityReviews,
    { revalidateOnFocus: false },
  )

  const reviews = data ?? []

  return (
    <section
      aria-labelledby="foodfest-reviews"
      className="border-b border-[#3a2a16] bg-[#1a1208] px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <SectionLabel dark>From FoodReel diners</SectionLabel>
          <h2
            id="foodfest-reviews"
            className="mt-3 max-w-xl font-serif text-4xl font-bold leading-[1.05] text-[#fffdf8] md:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Real plates. Real reviews.
          </h2>
          <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-[#fff4e0]/70">
            Every quote below comes from a diner review on FoodReel. No invented testimonials.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 rounded-2xl border border-[#3a2a16] p-6 font-sans text-sm text-[#fff4e0]/55">
            Loading recent reviews…
          </p>
        ) : error ? (
          <p className="mt-10 rounded-2xl border border-[#3a2a16] p-6 font-sans text-sm text-[#fff4e0]/55">
            Reviews are unavailable right now.{' '}
            <Link to="/reels" className="font-bold text-[#ffd04d] hover:underline">
              Browse the feed
            </Link>{' '}
            instead.
          </p>
        ) : reviews.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-[#3a2a16] p-6 font-sans text-sm text-[#fff4e0]/55">
            No reviews yet. Real diner reviews will appear here after the next orders.
          </p>
        ) : (
          <ReviewSlider reviews={reviews} />
        )}
      </div>
    </section>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */

const FoodFestAbout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f2e8]">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-about-hero"
          className="border-b border-[#e6d9c4] px-6 pb-20 pt-14 sm:pt-16 lg:pt-20"
        >
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center">
            <div>
              <h1
                id="foodfest-about-hero"
                className="max-w-2xl font-serif text-4xl font-black leading-[0.98] text-[#1a1208] sm:text-5xl lg:text-6xl xl:text-7xl"
                style={{ textWrap: 'balance' }}
              >
                One festival.{' '}
                <span className="block italic text-[#e55a00]">Three ways in.</span>
              </h1>

              <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-[#5f5548] sm:text-lg">
                FoodFest is FoodReel’s in-person food festival. Guests buy tickets and walk in
                with a QR pass, food partners apply for stalls, and organizers run the whole day
                from one studio. Here is how each side works.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/events"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
                >
                  Browse events
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  to="/events/host"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1a1208]/25 px-5 py-3 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:border-[#1a1208] hover:bg-[#1a1208] hover:text-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
                >
                  Host an event
                </Link>
              </div>
            </div>

            <FestivalPass />
          </div>
        </section>

        {/* ── What it is ────────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-what"
          className="border-b border-[#e6d9c4] bg-[#fffdf8] px-6 py-20 md:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <div>
              <h2
                id="foodfest-what"
                className="max-w-md font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                A food festival that lives inside FoodReel.
              </h2>
            </div>

            <div className="lg:border-l lg:border-[#e6d9c4] lg:pl-12">
              <p className="font-sans text-xl leading-relaxed text-[#3f3428] md:text-2xl">
                Instead of a separate ticketing website, FoodFest sits next to the reels you
                already browse. One account holds your tickets, QR passes, saved dishes, and food
                orders.
              </p>
              <p className="mt-5 font-sans text-base leading-relaxed text-[#5f5548] md:text-lg">
                Guests move from a published event to a confirmed QR pass without leaving the app.
                Food partners apply with dishes from their own menu, and organizers get a studio
                for ticket tiers, venue zones, sales, and gate capacity.
              </p>

              <div className="mt-8 grid gap-3 border-t border-[#e6d9c4] pt-5 sm:grid-cols-3 sm:gap-6">
                {['Published events only', 'One account for everything', 'Zones manage gates'].map((fact) => (
                  <p key={fact} className="font-sans text-sm font-semibold text-[#3f3428]">
                    {fact}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust numbers ─────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-numbers"
          className="border-b border-[#3a2a16] bg-[#1a1208] px-6 py-14 md:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="foodfest-numbers"
                className="max-w-xl font-serif text-3xl font-bold leading-tight text-[#fffdf8] md:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                The details behind the pass.
              </h2>
              <p className="max-w-sm font-sans text-xs leading-relaxed text-[#fff4e0]/55 sm:text-right">
                Real mechanics built into every FoodFest checkout and gate.
              </p>
            </div>

            <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#3a2a16] bg-[#3a2a16] sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_STATS.map((stat) => (
                <AnimatedStat key={stat.label} {...stat} />
              ))}
            </dl>
          </div>
        </section>

        {/* ── Three audiences ───────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-audiences"
          className="border-b border-[#e6d9c4] bg-[#f7f2e8] px-6 py-20 md:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <h2
                id="foodfest-audiences"
                className="max-w-xl font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Three ways to take part.
              </h2>
              <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-[#5f5548]">
                One festival, three routes in. Guests arrive with a pass, partners with a menu,
                organizers with a plan.
              </p>
            </div>

            <ol className="mt-12 grid gap-x-6 gap-y-10 md:grid-cols-3 lg:gap-x-10">
              {AUDIENCES.map(({ label, title, copy, to, cta }, index) => (
                <li key={label} className="border-t border-[#d8c6a8] pt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      aria-hidden="true"
                      className="font-serif text-2xl font-bold leading-none text-[#e55a00]"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-sans text-xs font-bold text-[#c2410c]">{label}</span>
                  </div>
                  <h3 className="mt-5 max-w-xs font-serif text-2xl font-bold leading-tight text-[#1a1208]">
                    {title}
                  </h3>
                  <p className="mt-2.5 max-w-sm font-sans text-sm leading-relaxed text-[#5f5548]">
                    {copy}
                  </p>
                  <Link
                    to={to}
                    className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#c2410c] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
                  >
                    {cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Guest journey ─────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-guests"
          className="border-b border-[#e6d9c4] bg-[#fffdf8] px-6 py-20 md:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionLabel>For guests</SectionLabel>
              <h2
                id="foodfest-guests"
                className="mt-3 max-w-md font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                From scroll to gate.
              </h2>
              <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-[#5f5548]">
                Five steps from finding a festival to walking in. Your pass stays in the app, so
                there is nothing to print or lose.
              </p>

              <ul className="mt-6 space-y-3 border-t border-[#e6d9c4] pt-5">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" strokeWidth={2} aria-hidden="true" />
                  <span className="font-sans text-sm leading-relaxed text-[#5f5548]">
                    One ticket per purchase. Start another purchase for another guest.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" strokeWidth={2} aria-hidden="true" />
                  <span className="font-sans text-sm leading-relaxed text-[#5f5548]">
                    Seats are held for 15 minutes while you complete payment.
                  </span>
                </li>
              </ul>

              <Link
                to="/events"
                className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#c2410c] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8]"
              >
                Find your next festival
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <StepList steps={GUEST_STEPS} />
          </div>
        </section>

        {/* ── Partner journey ───────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-partners"
          className="border-b border-[#3a2a16] bg-[#1a1208] px-6 py-20 md:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <div>
              <SectionLabel dark>For food partners</SectionLabel>
              <h2
                id="foodfest-partners"
                className="mt-3 max-w-lg font-serif text-4xl font-bold leading-[1.05] text-[#fffdf8] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Bring your kitchen to the crowd.
              </h2>
              <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-[#fff4e0]/70">
                A stall puts your dishes in front of people who already discovered you on
                FoodReel. Apply with your own menu, get reviewed, and open when you are ready.
              </p>

              <div className="mt-7 border-l-2 border-[#ffb800] pl-4">
                <p className="font-sans text-sm leading-relaxed text-[#fff4e0]/75">
                  Stall terms, including any fee, are set by the organizer for each event. One
                  application is allowed per partner per event.
                </p>
              </div>

              <Link
                to="/partner-foodfest"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-3 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd04d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1208]"
              >
                Apply for a stall
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <StepList steps={PARTNER_STEPS} dark />
          </div>
        </section>

        {/* ── Organizer journey ─────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-organizers"
          className="border-b border-[#e3d2b6] bg-[#f1e4d0] px-6 py-20 md:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionLabel>For organizers</SectionLabel>
              <h2
                id="foodfest-organizers"
                className="mt-3 max-w-md font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                From proposal to packed gates.
              </h2>
              <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-[#5f5548]">
                Anyone can propose a FoodFest. Once approved, the organizer studio gives you the
                controls to build, publish, and run the day.
              </p>

              <div className="mt-6 border-t border-[#d8c6a8] pt-5">
                <p className="font-sans text-xs font-bold text-[#c2410c]">Inside the studio</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['Ticket tiers and inventory', 'Venue zones and gate capacity', 'Attendee list and check-ins', 'Event lifecycle controls'].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" strokeWidth={2} aria-hidden="true" />
                      <span className="font-sans text-sm text-[#3f3428]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/events/host"
                className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#c2410c] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1e4d0]"
              >
                Propose your event
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <StepList steps={ORGANIZER_STEPS} />
          </div>
        </section>

        {/* ── What is inside ────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-features"
          className="bg-[#fffdf8] px-6 py-20 md:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2
                id="foodfest-features"
                className="font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                The working parts of a festival day.
              </h2>
              <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-[#5f5548]">
                From the first ticket sale to the last gate check-in.
              </p>
            </div>

            <div className="mt-10 grid gap-x-12 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <FeatureRow key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Real reviews ──────────────────────────────────────── */}
        <CommunityReviews />

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-faq"
          className="border-y border-[#e6d9c4] bg-[#f7f2e8] px-6 py-20 md:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2
                id="foodfest-faq"
                className="max-w-md font-serif text-4xl font-bold leading-[1.05] text-[#1a1208] md:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Before you arrive.
              </h2>
              <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-[#5f5548]">
                The details guests, partners, and organizers ask about most.
              </p>
              <Link
                to="/contact-us"
                className="mt-5 inline-flex items-center gap-2 font-sans text-sm font-bold text-[#c2410c] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
              >
                Still curious? Talk to us
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="border-t border-[#e6d9c4]">
              {FAQS.map(({ question, answer }) => (
                <details key={question} className="group border-b border-[#e6d9c4]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                    <span className="font-sans text-base font-semibold leading-snug text-[#1a1208]">
                      {question}
                    </span>
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#d8c6a8] transition-colors duration-200 group-open:border-[#ff6a00] group-open:bg-[#ff6a00]">
                      <Plus
                        className="h-4 w-4 text-[#7a6a54] transition-transform duration-200 group-open:rotate-45 group-open:text-[#1a1208]"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-5 pr-12 font-sans text-sm leading-relaxed text-[#5f5548]">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────── */}
        <section
          aria-labelledby="foodfest-cta"
          className="bg-[#f7f2e8] px-6 py-20 md:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div
              className="relative overflow-hidden rounded-[2rem] px-6 py-12 sm:rounded-[2.5rem] sm:px-10 sm:py-14 lg:px-14 lg:py-16"
              style={{
                background:
                  'linear-gradient(150deg, #ff8a3d 0%, #ff6a00 55%, #e55a00 100%)',
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,208,77,0.38) 0%, transparent 66%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.12]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #1a1208 0.7px, transparent 0.7px)',
                  backgroundSize: '12px 12px',
                  maskImage: 'linear-gradient(to left, black, transparent)',
                  WebkitMaskImage: 'linear-gradient(to left, black, transparent)',
                }}
              />

              <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)] lg:items-end">
                <div>
                  <h2
                    id="foodfest-cta"
                    className="max-w-2xl font-serif text-4xl font-black leading-[1.02] text-[#1a1208] md:text-5xl lg:text-6xl"
                    style={{ textWrap: 'balance' }}
                  >
                    Your next festival is{' '}
                    <span className="italic">already on the calendar.</span>
                  </h2>
                  <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-[#1a1208]/80 md:text-lg">
                    Find a date near you, put your kitchen on the map, or propose the festival
                    your city is missing.
                  </p>
                </div>

                <div className="flex w-full max-w-xs flex-col gap-3">
                  <Link
                    to="/events"
                    className="group inline-flex items-center justify-between gap-3 rounded-full bg-[#1a1208] px-6 py-3.5 font-sans text-sm font-bold text-[#fffdf8] transition-colors hover:bg-[#3a2a16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1208] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6a00]"
                  >
                    Browse events
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    to="/partner-foodfest"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-[#1a1208]/45 px-6 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#1a1208] hover:text-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1208] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6a00]"
                  >
                    Apply for a stall
                  </Link>
                  <Link
                    to="/events/host"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-[#1a1208]/45 px-6 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#1a1208] hover:text-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1208] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6a00]"
                  >
                    Host an event
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default FoodFestAbout
