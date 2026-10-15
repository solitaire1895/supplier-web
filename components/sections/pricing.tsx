"use client"

import PricingCard from "./PricingCard"
import CountrySelect from "@/components/billing/country-select"
import { useI18n } from "@/lib/i18n"
import { PAID_PLANS } from "@/lib/plans"
import { useBillingCountry } from "@/lib/use-billing-country"

export default function Pricing() {
  const { t, lang } = useI18n()
  const { countries, country, setCountry, priceLabel } = useBillingCountry()

  if (!t) return null

  const plans = [
    { ...t.pricing?.plans?.basic, highlight: false },
    { ...t.pricing?.plans?.standard, highlight: true },
    { ...t.pricing?.plans?.premium, highlight: false },
  ]

  // Same order as `plans` above (basic, standard, premium).
  const planKeys = PAID_PLANS

  return (
    <section id="pricing" className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* BIG FADED TITLE */}
      <h2 className="absolute top-10 left-1/2 -translate-x-1/2 text-[120px] font-bold text-red-500/5 select-none whitespace-nowrap">
        {t.pricing?.title}
      </h2>

      {/* COUNTRY / CURRENCY */}
      <div className="relative z-10 mb-10 flex justify-center">
        <CountrySelect
          countries={countries}
          value={country.iso}
          onChange={setCountry}
          lang={lang}
          label={t.subscription.payFrom}
        />
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
        {plans.map((plan, i) => (
          <PricingCard
            key={i}
            title={plan.title}
            price={priceLabel(planKeys[i], lang)}
            features={plan.features}
            highlight={plan.highlight}
            ctaText={plan.cta}
            plan={planKeys[i]}
            country={country.iso}
          />
        ))}
      </div>

    </section>
  )
}
