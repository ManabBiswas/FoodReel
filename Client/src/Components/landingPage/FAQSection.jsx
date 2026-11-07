import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'

const FAQS = [
  {
    question: 'What is FoodReel?',
    answer:
      'FoodReel is food discovery built around short reels. Every reel is tied to a real dish from a real kitchen, so you can go from watching to ordering in a few taps.',
  },
  {
    question: 'Where is FoodReel available?',
    answer:
      "We're live in 50+ cities across India. What you see depends on which partner kitchens are active near you — the feed grows city by city.",
  },
  {
    question: 'How do I order a dish I see in a reel?',
    answer:
      'Open the reel and tap Order Now. Choose your quantity and delivery address, then pay securely at checkout. The partner kitchen gets the order right away.',
  },
  {
    question: 'Do I need an account to watch reels?',
    answer:
      'You can browse this page without one. To watch the full reel feed, save dishes, follow kitchens, and place orders, create a free account.',
  },
  {
    question: 'How do restaurants join FoodReel?',
    answer:
      'Create a partner account, add your dishes, and publish reels from the partner dashboard. Our team reviews new kitchens and menu items before they appear in the feed.',
  },
  {
    question: 'How are payments handled?',
    answer:
      "Checkout runs through Razorpay, one of India's leading payment gateways. FoodReel doesn't store your card details.",
  },
  {
    question: 'What if something goes wrong with an order?',
    answer:
      'Open the order from My Orders to track its status or request a cancellation where eligible. If you need a hand, contact us and our team will look into it.',
  },
  {
    question: 'Can I host a FoodFest event?',
    answer:
      "Yes. Send an event proposal from the events page. Once it's approved, you can manage tiers, zones, and ticket sales from the organizer dashboard.",
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
}

const FAQSection = () => {
  return (
    <section
      id="faq"
      className="border-y px-6 py-20 md:py-24"
      style={{
        borderColor: 'var(--color-border-light)',
        background: 'var(--color-background-white)',
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        {/* Intro */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p
            className="font-sans text-xs font-bold uppercase tracking-[0.22em]"
            style={{ color: '#c2410c' }}
          >
            Good to know
          </p>
          <h2
            className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl"
            style={{ color: 'var(--color-text-base)', textWrap: 'balance' }}
          >
            Questions, answered.
          </h2>
          <p
            className="mt-4 max-w-md font-sans text-sm leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Everything you need to know before your first reel — or your first order.
          </p>
          <Link
            to="/contact-us"
            className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-bold text-[#c2410c] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2"
          >
            Still curious? Talk to us
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Accordion */}
        <div className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
          {FAQS.map(({ question, answer }) => (
            <details
              key={question}
              className="group border-b"
              style={{ borderColor: 'var(--color-border-light)' }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <span
                  className="font-sans text-base font-semibold leading-snug"
                  style={{ color: 'var(--color-text-base)' }}
                >
                  {question}
                </span>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-medium)] transition-colors duration-200 group-open:border-[var(--color-primary)] group-open:bg-[var(--color-primary)]">
                  <Plus
                    className="h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 group-open:rotate-45 group-open:text-[#1a1208]"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <p
                className="max-w-2xl pb-5 pr-12 font-sans text-sm leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  )
}

export default FAQSection
