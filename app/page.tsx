import LandingNav from "@/components/landing/landing-nav"
import Hero from "@/components/landing/hero"
import IntroStats from "@/components/landing/intro-stats"
import ProductTabs from "@/components/landing/product-tabs"
import Solutions from "@/components/landing/solutions"
import AiShowcase from "@/components/landing/ai-showcase"
import Steps from "@/components/landing/steps"
import VideoBand from "@/components/landing/video-band"
import Pricing from "@/components/sections/pricing"
import Faq from "@/components/landing/faq"
import FinalCta from "@/components/landing/final-cta"
import LandingFooter from "@/components/landing/landing-footer"

export default function Home() {
  return (
    <main className="landing min-h-screen">
      <LandingNav />
      <Hero />
      <IntroStats />
      <ProductTabs />
      <Solutions />
      <AiShowcase />
      <Steps />
      <VideoBand />
      <Pricing />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </main>
  )
}
