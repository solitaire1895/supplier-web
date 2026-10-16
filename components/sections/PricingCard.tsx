import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import type { PaidPlan } from "@/lib/plans"
import { usePlanCheckout } from "@/lib/use-plan-checkout"
import { useI18n } from "@/lib/i18n"

export default function PricingCard({
  title,
  price,
  features,
  highlight,
  ctaText = "Get Started",
  plan,
  country,
}: {
  title: string
  price: string
  features: string[]
  highlight?: boolean
  ctaText?: string
  plan?: PaidPlan
  country?: string
}) {
  const { t } = useI18n()
  const { startCheckout, pendingPlan, error } = usePlanCheckout()
  const loading = !!plan && pendingPlan === plan
  const p = t.landing.pricing

  const handleSubscribe = () => {
    if (plan && !loading) startCheckout(plan, country)
  }

  const buttonClass = `flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition ${
    highlight
      ? "bg-red-500 text-white hover:bg-red-600"
      : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/10"
  }`

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 transition-colors duration-500 ${
        highlight
          ? "border-red-500/50 bg-gradient-to-b from-red-500/[0.08] to-ink-2 shadow-[0_30px_80px_-40px_rgba(239,68,68,0.6)]"
          : "border-white/[0.08] bg-ink-2 hover:border-white/20"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-8 rounded-full bg-red-500 px-3 py-1 font-label text-[10px] uppercase tracking-[0.15em] text-white">
          {p.popular}
        </span>
      )}

      <p className="font-label text-[11px] uppercase tracking-[0.18em] text-stone">{title}</p>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-5xl font-light tracking-[-0.02em] text-white">{price}</span>
        <span className="whitespace-nowrap text-sm text-stone">{p.perMonth}</span>
      </p>

      <ul className="mt-8 flex-1 space-y-3.5 border-t border-white/[0.08] pt-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-snug text-white/75">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-red-500" : "text-white/50"}`} aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {plan ? (
          <button onClick={handleSubscribe} disabled={loading} className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-70`}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? (t.subscription?.redirecting ?? ctaText) : ctaText}
          </button>
        ) : (
          <Link href="/auth/signup" className={buttonClass}>
            {ctaText}
          </Link>
        )}

        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-400">
            {t.subscription?.checkoutError ?? "Could not start the payment. Please try again."}
          </p>
        )}
      </div>
    </div>
  )
}
