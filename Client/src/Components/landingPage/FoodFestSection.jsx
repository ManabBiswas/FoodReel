import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight, Ticket } from 'lucide-react'

const events = [
    {
        id: 1,
        date: 'November 20–22, 2026',
        city: 'Mumbai',
        title: 'Chaat Carnival 2026',
        image: 'https://images.pexels.com/photos/39025942/pexels-photo-39025942.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
        tag: 'Street Food',
        cta: 'Taste the crunch',
        link: '/events',
    },
    {
        id: 2,
        date: 'December 04–06, 2026',
        city: 'Bangalore',
        title: 'Dosa Trail 2026',
        image: 'https://images.pexels.com/photos/20422129/pexels-photo-20422129.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
        tag: 'South Indian',
        cta: 'Follow the crisp',
        link: '/events',
    },
    {
        id: 3,
        date: 'December 18–20, 2026',
        city: 'Delhi',
        title: 'Thali Nights 2026',
        image: 'https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
        tag: 'North Indian',
        cta: 'Build your thali',
        link: '/events',
    },
]

const steps = [
    { num: 1, label: 'Plan', sub: 'Browse upcoming events' },
    { num: 2, label: 'Book Tickets', sub: 'Secure your spot instantly' },
    { num: 3, label: 'Participate', sub: 'Eat, explore, experience' },
    { num: 4, label: 'Share to Reels', sub: 'Inspire the community' },
]

const FoodFestSection = () => {
    return (
        <section
            className="section-padding px-6"
            style={{ background: 'var(--color-background-dark)' }}
        >
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 grid gap-16 lg:grid-cols-2 lg:items-center">
                    {/* ── Left: description ─────────────────────────────── */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <span
                                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest font-sans"
                                style={{ background: 'rgba(255,184,0,0.15)', color: 'var(--color-accent)' }}
                            >
                                Community Events
                            </span>

                            <h2 className="font-serif text-5xl font-black leading-tight text-white md:text-6xl">
                                <span style={{ color: 'var(--color-text-inverse)' }}>FoodFest </span>
                                <span style={{ color: 'var(--color-accent)' }}>2026</span>
                            </h2>

                            <p className="text-lg leading-relaxed font-sans" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                The ultimate playground for food creators. Plan your culinary journey
                                and turn your experiences into content.
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="grid grid-cols-2 gap-4">
                            {steps.map(({ num, label, sub }) => (
                                <div
                                    key={num}
                                    className="flex items-start gap-3 rounded-2xl p-4"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    <span
                                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold font-sans"
                                        style={{ background: 'var(--color-primary)', color: '#fff' }}
                                    >
                                        {num}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-white font-sans">{label}</p>
                                        <p className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.55)' }}>{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/events"
                            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold font-sans text-sm transition-opacity hover:opacity-90"
                            style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
                        >
                            <Ticket className="w-4 h-4" />
                            Browse all events
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* ── Right: event cards ─────────────────────────────── */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {events.slice(0, 2).map((event) => (
                            <Link key={event.id} to={event.link}>
                                <div
                                    className="group overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {/* Image */}
                                    <div className="relative h-44 overflow-hidden">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                                        />
                                        <span
                                            className="absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold font-sans uppercase tracking-wide"
                                            style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
                                        >
                                            {event.tag}
                                        </span>
                                    </div>

                                    <div className="p-5 space-y-3">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> {event.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {event.city}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-white font-sans">{event.title}</h3>

                                        <span
                                            className="inline-flex items-center gap-1 text-sm font-bold font-sans transition-colors group-hover:underline"
                                            style={{ color: 'var(--color-accent)' }}
                                        >
                                            {event.cta}
                                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default FoodFestSection