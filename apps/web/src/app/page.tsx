import { HeroSection } from '../components/landing/hero-section'
import { FeaturesSection } from '../components/landing/features-section'
import { HowItWorksSection } from '../components/landing/how-it-works-section'
import { CTASection } from '../components/landing/cta-section'
import { Header } from '../components/layout/header'
import { Footer } from '../components/layout/footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
