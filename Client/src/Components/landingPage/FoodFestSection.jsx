import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight, Ticket } from 'lucide-react'

const events = [
    {
        id: 1,
        date: 'March 12–15, 2026',
        city: 'Mumbai',
        title: 'Burger Mania 2026',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        tag: 'Street Food',
        link: '/work',
    },
    {
        id: 2,
        date: 'April 05–07, 2026',
        city: 'Bangalore',
        title: 'Global Street Treats',
        image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop',
        tag: 'International',
        link: '/work',
    },
    {
        id: 3,
        date: 'May 18–20, 2026',
        city: 'Delhi',
        title: 'Green Eats Fest',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        tag: 'Vegan',
        link: '/work',
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
                                <span style={{ color: 'var(--color-text-inverse)' }}>FoodFest{'  '}</span>
                                
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
                                        <p className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/work">
                            <button
                                className="flex items-center gap-2 rounded-xl px-6 py-3 font-bold font-sans text-sm transition-opacity hover:opacity-90"
                                style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
                            >
                                <Ticket className="w-4 h-4" />
                                View Calendar
                            </button>
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
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <span
                                            className="absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold font-sans uppercase tracking-wide"
                                            style={{ background: 'var(--color-accent)', color: 'var(--color-background-dark)' }}
                                        >
                                            {event.tag}
                                        </span>
                                    </div>

                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-3 text-xs font-sans" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> {event.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {event.city}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-white font-sans">{event.title}</h3>

                                        <button
                                            className="w-full rounded-xl py-2.5 text-sm font-bold font-sans transition-opacity hover:opacity-90"
                                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                                        >
                                            Coming Soon
                                        </button>
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