"use client"

import PricingCard from "./PricingCard"
import { useI18n } from "@/lib/i18n"

export default function Pricing() {
  const { t } = useI18n()

  if (!t) return null

  const plans = [
    { ...t.pricing?.plans?.basic, highlight: false },
    { ...t.pricing?.plans?.standard, highlight: true },
    { ...t.pricing?.plans?.premium, highlight: false },
  ]

  const priceIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_EXPLORER,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_IMPORTER,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PARTNER,
  ]

  return (
    <section id="pricing" className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* BIG FADED TITLE */}
      <h2 className="absolute top-10 left-1/2 -translate-x-1/2 text-[120px] font-bold text-red-500/5 select-none whitespace-nowrap">
        {t.pricing?.title}
      </h2>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
        {plans.map((plan, i) => (
          <PricingCard
            key={i}
            title={plan.title}
            price={plan.price}
            features={plan.features}
            highlight={plan.highlight}
            ctaText={plan.cta}
            priceId={priceIds[i]}
          />
        ))}
      </div>

    </section>
  )
}
