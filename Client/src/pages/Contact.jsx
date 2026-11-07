import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Send
} from 'lucide-react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import BackToTop from '../Components/BackToTop'
import { API_ENDPOINTS, axiosConfig } from '../config/Api'

const fieldClass =
  'w-full rounded-xl border border-[#d9cdb9] bg-white px-4 py-3 font-sans text-[15px] text-[#1a1208] placeholder:text-[#9e9890] transition-colors focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/15'

const labelClass = 'mb-1.5 block font-sans text-[13px] font-semibold text-[#3f3428]'

const Contact = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setStatus('sending')
    try {
      await axios.post(
        API_ENDPOINTS.contact.send,
        { name, email, message },
        axiosConfig
      )
      setStatus('sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f2e8]">
      <Navbar />

      <main>
        <section className="border-b border-[#e6d9c4] px-5 pb-14 pt-14 sm:px-8 md:pb-20 md:pt-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a3412]">
                Contact
              </p>
              <h1
                className="mt-4 max-w-3xl font-serif text-5xl font-black leading-[0.98] text-[#1a1208] sm:text-6xl lg:text-7xl"
                style={{ textWrap: 'balance' }}
              >
                Tell us what&apos;s{' '}
                <span className="italic text-[#e55a00]">cooking.</span>
              </h1>
              <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-[#5f5548] sm:text-lg">
                Questions about an order, a partnership, or a FoodFest? Send a note and
                we&apos;ll route it to the right desk.
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-[#e6d9c4] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <span aria-hidden="true" className="h-px w-10 bg-[#ffb800]" />
              <p className="font-sans text-sm leading-relaxed text-[#6b6460]">
                One form. The right team. A reply by email.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="rounded-[1.75rem] border border-[#e6d9c4] bg-[#fffdf8] p-6 sm:p-8 md:p-10">
              <h2 className="font-serif text-3xl font-bold text-[#1a1208]">
                Send a message
              </h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#6b6460]">
                All fields are required.
              </p>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className={labelClass}>
                      Your name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Manab Biswas"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className={labelClass}>
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    rows={6}
                    placeholder="How can we help?"
                    className={`${fieldClass} resize-y`}
                  />
                </div>

                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-6 py-3.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Send message
                      </>
                    )}
                  </button>

                  <div aria-live="polite">
                    {status === 'sent' && (
                      <p className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#15803d]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Message sent. We&apos;ll reply by email.
                      </p>
                    )}
                    {status === 'error' && (
                      <p className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#b91c1c]">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        Couldn&apos;t send that. Please try again.
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[1.75rem] border border-[#e6d9c4] bg-[#fffdf8] p-6 sm:p-8">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a3412]">
                  What happens next
                </p>
                <ol className="mt-6 space-y-6">
                  {[
                    {
                      number: '01',
                      title: 'We read it',
                      copy: 'Your note lands with the FoodReel team, not a queue.'
                    },
                    {
                      number: '02',
                      title: 'We route it',
                      copy: 'Orders, partnerships, and FoodFest questions go to the right desk.'
                    },
                    {
                      number: '03',
                      title: 'You hear back',
                      copy: 'We reply by email with the next step.'
                    }
                  ].map((step) => (
                    <li key={step.number} className="flex gap-4">
                      <span className="font-serif text-lg italic text-[#c2410c]">
                        {step.number}
                      </span>
                      <div>
                        <h3 className="font-sans text-sm font-bold text-[#1a1208]">
                          {step.title}
                        </h3>
                        <p className="mt-1 font-sans text-sm leading-relaxed text-[#6b6460]">
                          {step.copy}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative overflow-hidden rounded-[1.75rem] bg-[#1a1208] p-6 text-[#fffdf8] sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,184,0,0.35) 0%, transparent 70%)'
                  }}
                />
                <div className="relative">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffd04d]">
                    FoodFest
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#fffdf8]">
                    Host your own event.
                  </h2>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-white/70">
                    Propose a festival, get admin approval, and run ticket sales from
                    your organizer studio.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link
                      to="/events/host"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#ff6a00] px-4 py-2.5 font-sans text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#ffb800]"
                    >
                      Propose an event
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      to="/events"
                      className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-white/75 transition-colors hover:text-white"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Browse events
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}

export default Contact
