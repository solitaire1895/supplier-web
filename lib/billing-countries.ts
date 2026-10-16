// lib/billing-countries.ts
//
// Server only. Which of our billing countries can actually pay right now:
// the country must be active on SasPay and, when the network list can be read,
// have at least one active payment network. Cached for an hour per server process.

import { BILLING_COUNTRIES, DEFAULT_COUNTRY, findBillingCountry, type BillingCountry } from '@/lib/currencies'
import { isSaspayConfigured, listCountries, listNetworks } from '@/lib/saspay'

const CACHE_TTL_MS = 60 * 60 * 1000
/** On failure, retry sooner instead of keeping a degraded list for an hour. */
const ERROR_TTL_MS = 5 * 60 * 1000

let cache: { countries: BillingCountry[]; expires: number } | null = null
let inflight: Promise<BillingCountry[]> | null = null

async function load(): Promise<BillingCountry[]> {
  try {
    const remote = await listCountries()
    const byIso = new Map(remote.map((c) => [c.iso_code.toUpperCase(), c]))

    // Country refs of active networks. The docs show a country UUID, but accept
    // an ISO code or an expanded object too.
    let withNetwork: Set<string> | null = null
    if (isSaspayConfigured()) {
      try {
        const networks = await listNetworks()
        const refs = new Set<string>()
        for (const n of networks) {
          if (n.is_active === false) continue
          const ref = n.country as unknown
          if (typeof ref === 'string') refs.add(ref.length === 2 ? ref.toUpperCase() : ref)
          else if (ref && typeof ref === 'object') {
            const o = ref as { id?: string; iso_code?: string }
            if (o.id) refs.add(o.id)
            if (o.iso_code) refs.add(o.iso_code.toUpperCase())
          }
        }
        console.log(`BILLING SasPay networks: ${networks.length} listed, ${refs.size} country refs`)
        // An empty list says nothing about coverage (e.g. a test account): don't filter on it.
        withNetwork = refs.size > 0 ? refs : null
      } catch (error) {
        // Without the network list, the country "active" flag alone decides.
        console.warn('BILLING could not list SasPay networks:', error instanceof Error ? error.message : error)
      }
    }

    const active = BILLING_COUNTRIES.filter((c) => byIso.get(c.iso)?.is_active)
    let payable = withNetwork
      ? active.filter((c) => withNetwork.has(byIso.get(c.iso)!.id) || withNetwork.has(c.iso))
      : active

    if (payable.length === 0 && active.length > 0) {
      console.warn('BILLING no network matched a billing country, using the SasPay active flag only')
      payable = active
    }
    if (payable.length === 0) throw new Error('no payable country returned by SasPay')
    cache = { countries: payable, expires: Date.now() + CACHE_TTL_MS }
    return payable
  } catch (error) {
    console.warn('BILLING using the full country list:', error instanceof Error ? error.message : error)
    cache = { countries: BILLING_COUNTRIES, expires: Date.now() + ERROR_TTL_MS }
    return BILLING_COUNTRIES
  }
}

export async function getPayableCountries(): Promise<BillingCountry[]> {
  if (cache && cache.expires > Date.now()) return cache.countries
  inflight ??= load().finally(() => {
    inflight = null
  })
  return inflight
}

/** Best guess of the visitor's country: CDN geo headers, then SASPAY_COUNTRY, then Cameroon. */
export function guessCountry(headers: Headers, payable: BillingCountry[]): BillingCountry {
  const candidates = [
    headers.get('cf-ipcountry'),
    headers.get('x-vercel-ip-country'),
    headers.get('x-country-code'),
    process.env.SASPAY_COUNTRY,
    DEFAULT_COUNTRY,
  ]
  for (const iso of candidates) {
    const match = findBillingCountry(iso)
    if (match && payable.some((c) => c.iso === match.iso)) return match
  }
  return payable[0]
}
