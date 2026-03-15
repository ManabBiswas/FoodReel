import React from 'react'
import Navbar          from '../Components/Navbar'
import Footer          from '../Components/Footer'
import BackToTop       from '../Components/BackToTop'
import HeroSection            from '../Components/landingPage/HeroSection'
import SocialProofSection     from '../Components/landingPage/SocialProofSection'
import HowItWorksSection      from '../Components/landingPage/HowItWorksSection'
import TrendingReelsSection   from '../Components/landingPage/TrendingReelsSection'
import FoodFestSection        from '../Components/landingPage/FoodFestSection'
import ValuePropositionsSection from '../Components/landingPage/ValuePropositionsSection'
import CTABannerSection       from '../Components/landingPage/CTABannerSection'

const Home = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light)' }}>
      <Navbar />

      <main>
        {/* 1. Hero — above the fold, primary CTA */}
        <HeroSection />

        {/* 2. Trust bar — immediate credibility */}
        <SocialProofSection />

        {/* 3. Feature overview — what the product does */}
        <HowItWorksSection />

        {/* 4. Trending reels — live backend content, drives curiosity */}
        <TrendingReelsSection />

        {/* 5. FoodFest — community angle, dark section for visual variety */}
        <FoodFestSection />

        {/* 6. Value props — audience-split benefits */}
        <ValuePropositionsSection />

        {/* 7. CTA — final conversion push for partners */}
        <CTABannerSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}

export default Home