import Navbar from "@/components/layout/navbar"
import Hero from "@/components/sections/hero"
import Features from "@/components/sections/features"
import Pricing from "@/components/sections/pricing"
import About from "@/components/sections/about"
import Footer from "@/components/sections/footer"

export default function Home() {
  return (
    <main className="bg-black text-white">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <About />
      <Footer />
    </main>
  )
}