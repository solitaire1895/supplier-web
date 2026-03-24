"use client"

import PricingCard from "./PricingCard"

export default function Pricing() {
  return (
    <section className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* BIG FADED TITLE */}
      <h2 className="absolute top-10 left-1/2 -translate-x-1/2 text-[120px] font-bold text-rgba(239,68,68,1)/5 select-none">
        Pricing
      </h2>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">

        <PricingCard
          title="Basic Plan"
          price="$9.99"
          features={[
            "Access to supplier database",
            "Basic product insights",
            "Favorites & notes",
            "Limited analytics",
          ]}
        />

        <PricingCard
          title="Standard Plan"
          price="$19.99"
          highlight
          features={[
            "Full price comparison",
            "Winning products access",
            "Affiliate system (5%)",
            "Advanced filters",
            "AI insights",
          ]}
        />

        <PricingCard
          title="Premium Plan"
          price="$39.99"
          features={[
            "Partner program (10%)",
            "Advanced analytics",
            "AI negotiation assistant",
            "Bulk comparison",
            "Private suppliers",
          ]}
        />

      </div>

    </section>
  )
}