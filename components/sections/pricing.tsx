"use client"

import PricingCard from "./PricingCard"
import CountrySelect from "@/components/billing/country-select"
import { DisplayHeading, Reveal, SectionLabel } from "@/components/landing/primitives"
import { useI18n } from "@/lib/i18n"
import { PAID_PLANS } from "@/lib/plans"
import { useBillingCountry } from "@/lib/use-billing-country"

/** `showHeader={false}` when the page already has its own title (e.g. /dashboard/subscribe). */
export default function Pricing({ showHeader = true }: { showHeader?: boolean }) {
  const { t, lang } = useI18n()
  const { countries, country, setCountry, priceLabel } = useBillingCountry()

  if (!t) return null

  const p = t.landing.pricing
  const plans = [
    { ...t.pricing?.plans?.basic, highlight: false },
    { ...t.pricing?.plans?.standard, highlight: true },
    { ...t.pricing?.plans?.premium, highlight: false },
  ]

  // Same order as `plans` above (basic, standard, premium).
  const planKeys = PAID_PLANS

  return (
    <section id="pricing" className={`relative bg-ink px-4 text-white sm:px-6 ${showHeader ? "border-t border-white/[0.06] py-28 lg:py-36" : "py-4"}`}>
      <div className="mx-auto max-w-6xl">
        {showHeader && (
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionLabel>{p.label}</SectionLabel>
          <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[56px]">{p.title}</DisplayHeading>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">{p.desc}</p>
        </Reveal>
        )}

        {/* COUNTRY / CURRENCY */}
        <div className="mt-10 flex justify-center">
          <CountrySelect
            countries={countries}
            value={country.iso}
            onChange={setCountry}
            lang={lang}
            label={t.subscription.payFrom}
          />
        </div>

        {/* CARDS */}
        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={i} delay={i * 0.08} className="flex">
              <div className="flex w-full flex-col [&>div]:flex-1">
                <PricingCard
                  title={plan.title}
                  price={priceLabel(planKeys[i], lang)}
                  features={plan.features}
                  highlight={plan.highlight}
                  ctaText={plan.cta}
                  plan={planKeys[i]}
                  country={country.iso}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
