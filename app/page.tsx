import Navbar from "@/components/layout/navbar"
import CarouselHero from "@/components/sections/hero-carousel"
import Features from "@/components/sections/features"
import HowItWorks from "@/components/sections/how-it-works"
import Pricing from "@/components/sections/pricing"
import About from "@/components/sections/about"
import Footer from "@/components/sections/footer"

export default function Home() {
  return (
    <main className="bg-black text-white">
      <Navbar />
      <CarouselHero />
      <Features />
      <HowItWorks />
      <Pricing />
      <About />
      <Footer />
    </main>
  )
}