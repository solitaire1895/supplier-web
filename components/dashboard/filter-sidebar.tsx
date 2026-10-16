"use client"

import { useState } from "react"
import { Check, ShieldCheck, RefreshCcw } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const categories = {
  Electronics: ["Phones", "Computers", "Accessories", "Gaming"],
  Clothing: ["Men", "Women", "Kids", "Sportswear"],
  Home: ["Furniture", "Kitchen", "Decor", "Lighting"],
  Beauty: ["Skincare", "Makeup", "Hair", "Fragrance"],
}

type Category = keyof typeof categories

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 font-label text-[10px] uppercase tracking-[0.18em] text-stone-2">{children}</p>
}

export default function FilterSidebar() {
  const { t } = useI18n()
  const d = t.dashboardUi
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const handleReset = () => {
    setSelectedCategory(null)
    setSelectedSub(null)
    setVerifiedOnly(false)
  }

  return (
    <aside className="flex h-fit w-full flex-col gap-8 rounded-2xl border border-white/[0.08] bg-ink-2 p-6 lg:w-[280px]">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
        <h2 className="font-display text-2xl font-light text-white">{d.filters}</h2>
        {(selectedCategory || verifiedOnly) && (
          <button onClick={handleReset} className="flex items-center gap-1 text-xs text-stone transition-colors hover:text-white">
            <RefreshCcw size={11} aria-hidden /> {d.reset}
          </button>
        )}
      </div>

      {/* QUICK TOGGLES */}
      <div>
        <Label>{d.quickFilters}</Label>
        <button
          type="button"
          role="switch"
          aria-checked={verifiedOnly}
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] px-3 py-3 transition hover:border-white/20"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className={verifiedOnly ? "text-red-500" : "text-stone"} aria-hidden />
            <span className={`text-sm ${verifiedOnly ? "text-white" : "text-white/60"}`}>{d.verifiedOnly}</span>
          </span>
          <span className={`flex h-5 w-9 items-center rounded-full px-0.5 transition ${verifiedOnly ? "bg-red-500" : "bg-white/15"}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition-transform ${verifiedOnly ? "translate-x-4" : ""}`} />
          </span>
        </button>
      </div>

      {/* CATEGORY */}
      <div>
        <Label>{d.primaryCategory}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(categories) as Category[]).map((cat) => {
            const active = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedSub(null)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm transition ${
                  active ? "border-red-500/50 bg-red-500/10 text-white" : "border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {active && <Check size={12} className="text-red-500" aria-hidden />}
                {d.categories[cat] ?? cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* SUB CATEGORY */}
      <div className={`transition-opacity duration-500 ${selectedCategory ? "opacity-100" : "pointer-events-none opacity-50"}`}>
        <Label>{d.subCategory}</Label>
        <div className="grid grid-cols-2 gap-2">
          {selectedCategory ? (
            categories[selectedCategory].map((sub) => {
              const active = selectedSub === sub
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSub(sub)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    active ? "border-white/30 bg-white/10 text-white" : "border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {sub}
                </button>
              )
            })
          ) : (
            <p className="col-span-2 rounded-xl border border-dashed border-white/10 py-4 text-center text-xs text-stone">{d.selectCategoryFirst}</p>
          )}
        </div>
      </div>

      {/* APPLY */}
      <div className="border-t border-white/[0.08] pt-6">
        <button className="w-full rounded-full bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-600 active:scale-[0.98]">
          {d.applyFilters}
        </button>
      </div>
    </aside>
  )
}
