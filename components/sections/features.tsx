"use client"

import { useEffect, useState } from "react"
import FeatureCard from "./feature-card"
import {
  Search,
  BarChart3,
  TrendingUp,
  Star,
  DollarSign,
  Users,
  Brain,
  Zap,
  ShieldCheck,
} from "lucide-react"

export default function Features() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* PARALLAX GLOW */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl"
        style={{
          transform: `translateY(${offset * 0.2}px)`,
          background:
            "radial-gradient(circle at center, rgba(239,68,68,0.25), transparent 70%)",
        }}
      />

      {/* TITLE */}
      <div className="max-w-4xl mx-auto text-center mb-20 relative z-10">
        <p className="text-sm mb-3 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
          Platform Features
        </p>

        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          The Complete
          <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
            {" "}Supplier Command Center
          </span>
        </h2>

        <p className="text-gray-400 mt-6 text-lg">
          Everything you need to discover, analyze, and dominate supplier markets.
        </p>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10 relative z-10">

        <FeatureCard
          icon={<Search />}
          title="Supplier Discovery Engine"
          description="Find the best suppliers worldwide with smart AI-powered filtering, ranking, and niche targeting."
        />

        <FeatureCard
          icon={<Star />}
          title="Supplier Profiles"
          description="Access detailed supplier data including pricing tiers, delivery times, reviews, and reliability scores."
        />

        <FeatureCard
          icon={<TrendingUp />}
          title="Winning Products"
          description="Identify trending, high-demand products with strong margins using real-time data insights."
        />

        <FeatureCard
          icon={<BarChart3 />}
          title="Price Comparison"
          description="Compare supplier pricing, shipping costs, and profit margins instantly across multiple vendors."
        />

        <FeatureCard
          icon={<DollarSign />}
          title="Profit Simulator"
          description="Calculate ROI, break-even points, and profit margins before making sourcing decisions."
        />

        <FeatureCard
          icon={<Users />}
          title="Affiliate & Partner System"
          description="Monetize your network with referral links, commissions, and advanced partner analytics."
        />

        <FeatureCard
          icon={<Brain />}
          title="AI Supplier Advisor"
          description="Get intelligent recommendations based on your budget, niche, and target market."
        />

        <FeatureCard
          icon={<Zap />}
          title="Auto Sourcing Mode"
          description="Describe a product and let AI find, compare, and recommend the best suppliers instantly."
        />

        <FeatureCard
          icon={<ShieldCheck />}
          title="Trust & Risk Scoring"
          description="Avoid unreliable suppliers with AI-powered fraud detection and trust scoring."
        />

      </div>
    </section>
  )
}