"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BILLING_COUNTRIES,
  DEFAULT_COUNTRY,
  findBillingCountry,
  formatPrice,
  planPrice,
  type BillingCountry,
} from "@/lib/currencies"
import type { PaidPlan } from "@/lib/plans"

const STORAGE_KEY = "nexusply_billing_country"
const CHANGE_EVENT = "billingCountryChanged"

type CountriesResponse = { countries: BillingCountry[]; suggested: string }

// One request per page load, shared by every component that needs it.
let countriesPromise: Promise<CountriesResponse> | null = null
function fetchCountries(): Promise<CountriesResponse> {
  countriesPromise ??= fetch("/api/saspay/countries", { credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .catch(() => {
      countriesPromise = null // allow a retry on the next mount
      return { countries: BILLING_COUNTRIES, suggested: DEFAULT_COUNTRY }
    })
  return countriesPromise
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * The customer's billing country (and so currency), remembered per browser.
 * Starts from their last choice, else the server's guess for this visitor.
 */
export function useBillingCountry() {
  const [countries, setCountries] = useState<BillingCountry[]>(BILLING_COUNTRIES)
  const [iso, setIso] = useState<string>(DEFAULT_COUNTRY)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    fetchCountries().then(({ countries: list, suggested }) => {
      if (!active) return
      const usable = list.length ? list : BILLING_COUNTRIES
      const stored = readStored()
      const pick = [stored, suggested, DEFAULT_COUNTRY].find((c) => c && usable.some((u) => u.iso === c))
      setCountries(usable)
      setIso(pick ?? usable[0].iso)
      setReady(true)
    })

    // Keep every picker on the page in sync.
    const sync = (e: Event) => setIso((e as CustomEvent<string>).detail)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      active = false
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [])

  const setCountry = useCallback((next: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode: the choice just isn't remembered.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }))
  }, [])

  const country = findBillingCountry(iso) ?? countries[0]
  const currency = country.currency

  const priceLabel = useCallback(
    (plan: PaidPlan, lang: string) => formatPrice(planPrice(plan, currency), currency, lang),
    [currency]
  )

  return { countries, country, currency, setCountry, priceLabel, ready }
}
