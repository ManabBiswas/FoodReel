import React from 'react'
import { Film, Heart, ShoppingCart } from 'lucide-react'

const features = [
    {
        Icon: Film,
        title: 'Immersive Reels',
        description:
            '16-second visual feasts from local chefs and food influencers. Know exactly what you&apos;re getting.',
    accent: 'bg-primary/10 text-primary',
        hover: 'group-hover:bg-primary group-hover:text-white',
    },
    {
        Icon: Heart,
        title: 'Social Interaction',
        description:
            'Follow your favourite chefs, like their secrets, and share your dining experiences with your circle.',
        accent: 'bg-accent/15 text-accent',
        hover: 'group-hover:bg-accent group-hover:text-white',
    },
    {
        Icon: ShoppingCart,
        title: 'Instant Ordering',
        description:
            'Loved what you saw? One tap to order the exact dish featured in the reel. No searching required.',
        accent: 'bg-primary/10 text-primary',
        hover: 'group-hover:bg-primary group-hover:text-white',
    },
]

const HowItWorksSection = () => {
    return (
        <section
            className="section-padding px-6"
            style={{ background: 'var(--color-background-light)' }}
        >
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-16 text-center space-y-3">
                    <h2
                        className="font-serif text-4xl font-bold md:text-5xl"
                        style={{ color: 'var(--color-text-base)' }}
                    >
                        Everything you need, in one app
                    </h2>
                    <p
                        className="mx-auto max-w-md text-base font-sans"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        Crafted for foodies who value experience over listings
                    </p>
                </div>

                {/* Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    {features.map(({ Icon, title, description, accent, hover }) => (
                        <div
                            key={title}
                            className="group rounded-2xl bg-background-white p-8 transition-all duration-300 hover:-translate-y-1"
                            style={{ boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border-light)' }}
                        >
                            {/* Icon */}
                            <div
                                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${accent} ${hover} transition-colors duration-300`}
                            >
                               {Icon && <Icon className="w-7 h-7" strokeWidth={1.8} />}
                            </div>

                            <h3
                                className="mb-3 text-xl font-bold font-sans"
                                style={{ color: 'var(--color-text-base)' }}
                            >
                                {title}
                            </h3>
                            <p
                                className="text-base leading-relaxed font-sans"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                {description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HowItWorksSection