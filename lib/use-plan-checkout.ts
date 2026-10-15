"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import type { PaidPlan } from "@/lib/plans"

/**
 * Starts a SasPay checkout for a plan and sends the browser to the hosted
 * payment page. Not signed in -> signup page.
 */
export function usePlanCheckout() {
  const router = useRouter()
  const [pendingPlan, setPendingPlan] = useState<PaidPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(
    async (plan: PaidPlan, country?: string) => {
      setError(null)
      setPendingPlan(plan)

      try {
        const res = await fetch("/api/saspay/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ plan, country }),
        })

        if (res.status === 401) {
          router.push("/auth/signup")
          return
        }

        let data: { url?: string; error?: string } = {}
        try {
          data = await res.json()
        } catch {
          data = {}
        }

        if (res.ok && data.url) {
          // Keep the loading state: the page is navigating away.
          window.location.assign(data.url)
          return
        }

        setError(data.error || "checkout_failed")
      } catch (err) {
        console.error("Checkout error:", err)
        setError("checkout_failed")
      }
      setPendingPlan(null)
    },
    [router]
  )

  return { startCheckout, pendingPlan, error }
}
