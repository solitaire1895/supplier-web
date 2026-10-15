// lib/currencies.ts
//
// Billing countries and plan prices for West and Central Africa.
// Client-safe (no secrets): used by the pricing UI to display prices and by
// the checkout route as the single source of truth for what is charged.
//
// Prices are fixed per currency on purpose (no live conversion), so a customer
// always pays the round number they saw. XOF and XAF are both pegged to the
// euro at the same rate, so they share the base prices from lib/plans.ts.
// Review the other rows when exchange rates move significantly.

import { PLANS, type PaidPlan } from '@/lib/plans'

export type BillingCurrency =
  | 'XOF' | 'XAF' | 'NGN' | 'GHS' | 'GNF' | 'CDF'
  | 'GMD' | 'SLE' | 'LRD' | 'CVE' | 'MRU' | 'STN'

export interface BillingCountry {
  iso: string
  currency: BillingCurrency
  name: { EN: string; FR: string }
}

/** Currency used for the "base" prices in lib/plans.ts. */
export const BASE_CURRENCY: BillingCurrency = 'XAF'

/** Default when nothing else is known (overridable with SASPAY_COUNTRY). */
export const DEFAULT_COUNTRY = 'CM'

export const BILLING_COUNTRIES: BillingCountry[] = [
  // ── Central Africa, CEMAC (XAF) ──
  { iso: 'CM', currency: 'XAF', name: { EN: 'Cameroon', FR: 'Cameroun' } },
  { iso: 'GA', currency: 'XAF', name: { EN: 'Gabon', FR: 'Gabon' } },
  { iso: 'CG', currency: 'XAF', name: { EN: 'Congo', FR: 'Congo' } },
  { iso: 'CF', currency: 'XAF', name: { EN: 'Central African Republic', FR: 'Centrafrique' } },
  { iso: 'TD', currency: 'XAF', name: { EN: 'Chad', FR: 'Tchad' } },
  { iso: 'GQ', currency: 'XAF', name: { EN: 'Equatorial Guinea', FR: 'Guinée équatoriale' } },
  // ── Central Africa, others ──
  { iso: 'CD', currency: 'CDF', name: { EN: 'DR Congo', FR: 'RD Congo' } },
  { iso: 'ST', currency: 'STN', name: { EN: 'São Tomé and Príncipe', FR: 'Sao Tomé-et-Principe' } },
  // ── West Africa, UEMOA (XOF) ──
  { iso: 'CI', currency: 'XOF', name: { EN: "Côte d'Ivoire", FR: "Côte d'Ivoire" } },
  { iso: 'SN', currency: 'XOF', name: { EN: 'Senegal', FR: 'Sénégal' } },
  { iso: 'BJ', currency: 'XOF', name: { EN: 'Benin', FR: 'Bénin' } },
  { iso: 'TG', currency: 'XOF', name: { EN: 'Togo', FR: 'Togo' } },
  { iso: 'BF', currency: 'XOF', name: { EN: 'Burkina Faso', FR: 'Burkina Faso' } },
  { iso: 'ML', currency: 'XOF', name: { EN: 'Mali', FR: 'Mali' } },
  { iso: 'NE', currency: 'XOF', name: { EN: 'Niger', FR: 'Niger' } },
  { iso: 'GW', currency: 'XOF', name: { EN: 'Guinea-Bissau', FR: 'Guinée-Bissau' } },
  // ── West Africa, others ──
  { iso: 'NG', currency: 'NGN', name: { EN: 'Nigeria', FR: 'Nigeria' } },
  { iso: 'GH', currency: 'GHS', name: { EN: 'Ghana', FR: 'Ghana' } },
  { iso: 'GN', currency: 'GNF', name: { EN: 'Guinea', FR: 'Guinée' } },
  { iso: 'GM', currency: 'GMD', name: { EN: 'Gambia', FR: 'Gambie' } },
  { iso: 'SL', currency: 'SLE', name: { EN: 'Sierra Leone', FR: 'Sierra Leone' } },
  { iso: 'LR', currency: 'LRD', name: { EN: 'Liberia', FR: 'Libéria' } },
  { iso: 'CV', currency: 'CVE', name: { EN: 'Cabo Verde', FR: 'Cap-Vert' } },
  { iso: 'MR', currency: 'MRU', name: { EN: 'Mauritania', FR: 'Mauritanie' } },
]

const base = (plan: PaidPlan) => PLANS[plan].price

/** What one 30-day period costs, per currency. */
export const PLAN_PRICES: Record<BillingCurrency, Record<PaidPlan, number>> = {
  XAF: { explorateur: base('explorateur'), importateur: base('importateur'), partenaire: base('partenaire') },
  XOF: { explorateur: base('explorateur'), importateur: base('importateur'), partenaire: base('partenaire') },
  NGN: { explorateur: 4500, importateur: 7500, partenaire: 10500 },
  GHS: { explorateur: 35, importateur: 60, partenaire: 80 },
  GNF: { explorateur: 25000, importateur: 45000, partenaire: 60000 },
  CDF: { explorateur: 8500, importateur: 14500, partenaire: 20000 },
  GMD: { explorateur: 200, importateur: 350, partenaire: 500 },
  SLE: { explorateur: 70, importateur: 115, partenaire: 160 },
  LRD: { explorateur: 550, importateur: 900, partenaire: 1300 },
  CVE: { explorateur: 300, importateur: 500, partenaire: 700 },
  MRU: { explorateur: 120, importateur: 200, partenaire: 280 },
  STN: { explorateur: 65, importateur: 110, partenaire: 150 },
}

export function findBillingCountry(iso: string | null | undefined): BillingCountry | undefined {
  if (!iso) return undefined
  const code = iso.trim().toUpperCase()
  return BILLING_COUNTRIES.find((c) => c.iso === code)
}

export function planPrice(plan: PaidPlan, currency: BillingCurrency): number {
  return PLAN_PRICES[currency][plan]
}

/** "1 700 FCFA", "₦4,500", "GH₵35"... in the viewer's language. */
export function formatPrice(amount: number, currency: string, lang: string = 'EN'): string {
  const locale = lang === 'FR' ? 'fr-FR' : lang === 'CN' ? 'zh-CN' : 'en-US'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`
  }
}
