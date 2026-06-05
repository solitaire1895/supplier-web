import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PricingCard({
  title,
  price,
  features,
  highlight,
  ctaText = "Get Started",
  priceId,
}: {
  title: string
  price: string
  features: string[]
  highlight?: boolean
  ctaText?: string
  priceId?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    if (!priceId) return

    try {
      setLoading(true)
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === "Unauthorized") {
        router.push("/auth/signup")
      } else {
        alert(data.error || "Something went wrong")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Failed to initiate checkout")
    } finally {
      setLoading(false)
    }
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
      {priceId ? (
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
          {ctaText}
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

    </div>
  )
}
