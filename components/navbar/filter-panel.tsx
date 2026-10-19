"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, RefreshCcw, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { SectionLabel } from "@/components/landing/primitives"

const categories = {
  Electronics: ["Phones", "Computers", "Accessories", "Gaming"],
  Clothing: ["Men", "Women", "Kids", "Sportswear"],
  Home: ["Furniture", "Kitchen", "Decor", "Lighting"],
  Beauty: ["Skincare", "Makeup", "Hair", "Fragrance"],
}

type Category = keyof typeof categories

const TOGGLES = {
  FR: { verified: "Vérifiés", margin: "Forte marge", rated: "Mieux notés", country: "Pays", moq: "MOQ max", min: "Prix min", max: "Prix max", cancel: "Annuler", other: "Autres critères" },
  EN: { verified: "Verified", margin: "High margin", rated: "Top rated", country: "Country", moq: "Max MOQ", min: "Min price", max: "Max price", cancel: "Cancel", other: "Other criteria" },
  CN: { verified: "已认证", margin: "高利润", rated: "高评分", country: "国家", moq: "最大起订量", min: "最低价", max: "最高价", cancel: "取消", other: "其他条件" },
} as const

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 font-label text-[10px] uppercase tracking-[0.18em] text-stone-2">{children}</p>
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm transition ${
        active ? "border-red-500/50 bg-red-500/10 text-white" : "border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white"
      }`}
    >
      {active && <Check size={12} className="text-red-500" aria-hidden />}
      {children}
    </button>
  )
}

export default function FilterPanel({ close }: { close: () => void }) {
  const { t, lang } = useI18n()
  const d = t.dashboardUi
  const x = TOGGLES[lang as keyof typeof TOGGLES] ?? TOGGLES.EN

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [flags, setFlags] = useState({ verified: false, margin: false, rated: false })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [close])

  const reset = () => {
    setSelectedCategory(null)
    setSelectedSub(null)
    setFlags({ verified: false, margin: false, rated: false })
  }
  const dirty = selectedCategory || Object.values(flags).some(Boolean)

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder:text-stone-2 transition focus:border-red-500/50 focus:outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center font-text md:items-center" role="dialog" aria-modal="true" aria-label={d.filters}>
      <div onClick={close} className="absolute inset-0 bg-ink/80 backdrop-blur-md" />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border border-white/[0.08] bg-ink-2 md:rounded-3xl"
      >
        {/* HEADER */}
        <div className="flex items-end justify-between gap-4 border-b border-white/[0.08] px-6 pb-5 pt-4">
          <div>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 md:hidden" aria-hidden />
            <SectionLabel>{t.common.filter}</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-light text-white">{d.filters}</h2>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button onClick={reset} className="flex items-center gap-1 text-xs text-stone transition hover:text-white">
                <RefreshCcw size={11} aria-hidden /> {d.reset}
              </button>
            )}
            <button
              onClick={close}
              aria-label={x.cancel}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-stone transition hover:border-white/25 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div>
            <Label>{d.primaryCategory}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(categories) as Category[]).map((cat) => (
                <Pill
                  key={cat}
                  active={selectedCategory === cat}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setSelectedSub(null)
                  }}
                >
                  {d.categories[cat] ?? cat}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <Label>{d.subCategory}</Label>
            {selectedCategory ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories[selectedCategory].map((sub) => (
                  <Pill key={sub} active={selectedSub === sub} onClick={() => setSelectedSub(sub)}>
                    {sub}
                  </Pill>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/10 py-4 text-center text-xs text-stone">{d.selectCategoryFirst}</p>
            )}
          </div>

          <div>
            <Label>{d.quickFilters}</Label>
            <div className="flex flex-wrap gap-2">
              {(["verified", "margin", "rated"] as const).map((k) => (
                <Pill key={k} active={flags[k]} onClick={() => setFlags((f) => ({ ...f, [k]: !f[k] }))}>
                  {x[k]}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <Label>{x.other}</Label>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={x.country} aria-label={x.country} className={inputClass} />
              <input placeholder={x.moq} aria-label={x.moq} inputMode="numeric" className={inputClass} />
              <input placeholder={x.min} aria-label={x.min} inputMode="numeric" className={inputClass} />
              <input placeholder={x.max} aria-label={x.max} inputMode="numeric" className={inputClass} />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 border-t border-white/[0.08] px-6 py-5">
          <button onClick={close} className="flex-1 rounded-full border border-white/15 py-3 text-sm text-white transition hover:border-white/30">
            {x.cancel}
          </button>
          <button onClick={close} className="flex-[2] rounded-full bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-600">
            {d.applyFilters}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
