"use client"

import { Globe } from "lucide-react"
import type { BillingCountry } from "@/lib/currencies"

/** Country (and so currency) picker shown above the pricing cards. */
export default function CountrySelect({
  countries,
  value,
  onChange,
  lang,
  label,
}: {
  countries: BillingCountry[]
  value: string
  onChange: (iso: string) => void
  lang: string
  label: string
}) {
  const nameOf = (c: BillingCountry) => (lang === "FR" ? c.name.FR : c.name.EN)
  const sorted = [...countries].sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang === "FR" ? "fr" : "en"))

  return (
    <label className="inline-flex max-w-full items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur-xl">
      <Globe size={16} className="shrink-0 text-gray-400" aria-hidden />
      <span className="shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 cursor-pointer bg-transparent font-semibold text-white outline-none"
      >
        {sorted.map((c) => (
          <option key={c.iso} value={c.iso} className="bg-neutral-900 text-white">
            {nameOf(c)} · {c.currency}
          </option>
        ))}
      </select>
    </label>
  )
}
