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

  const handleSubscribe = () => {
    if (plan && !loading) startCheckout(plan, country)
  }

  return (
    <div
      className={`
        group relative p-8 rounded-3xl
        backdrop-blur-2xl
        border transition-all duration-500
        overflow-hidden

        ${highlight
          ? "bg-white/10 border-white/20 scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          : "bg-white/5 border-white/10 hover:border-red-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]"
        }
      `}
    >

      {/* TOP LIQUID GLOW */}
      <div className="
        absolute -top-16 left-1/2 -translate-x-1/2
        w-40 h-40 rounded-full
        bg-white/20 blur-3xl opacity-20
      " />

      {/* TITLE */}
      <p className="text-gray-400 mb-2">{title}</p>

      {/* PRICE */}
      <h3 className="text-4xl font-bold mb-6">
        {price}
        <span className="text-gray-500 text-lg"> /m</span>
      </h3>

      {/* FEATURES */}
      <div className="space-y-4 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
            <Check className="w-4 h-4 text-white" />
            {f}
          </div>
        ))}
      </div>

      {/* BUTTON */}
      {plan ? (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`
            block w-full py-3 rounded-full font-bold text-center transition-all duration-300 flex items-center justify-center gap-2

            ${highlight
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-black border border-white/20 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] text-white"
            }
            ${loading ? "opacity-70 cursor-not-allowed" : ""}
          `}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? (t.subscription?.redirecting ?? ctaText) : ctaText}
        </button>
      ) : (
        <Link
          href="/auth/signup"
          className={`
            block w-full py-3 rounded-full font-bold text-center transition-all duration-300

            ${highlight
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-black border border-white/20 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] text-white"
            }
          `}
        >
          {ctaText}
        </Link>
      )}

      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-400">
          {t.subscription?.checkoutError ?? "Could not start the payment. Please try again."}
        </p>
      )}

    </div>
  )
}
