import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import Features from '../components/landing/Features.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import Pricing from '../components/landing/Pricing.jsx'
import FAQ from '../components/landing/FAQ.jsx'
import CTASection from '../components/landing/CTASection.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function Landing() {
  const location = useLocation()

  // Handles arriving at /#pricing etc. from another page (Navbar links from Terms/Privacy/
  // Contact navigate here first) - the browser can't scroll to these sections on its own
  // since they don't exist until this page has rendered.
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [location.hash])

  return (
    <div className="min-h-screen bg-ink font-sans text-parchment">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
