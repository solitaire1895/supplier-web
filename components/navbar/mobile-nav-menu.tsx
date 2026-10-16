"use client"

import { motion } from "framer-motion"
import { Home, Package, X, LifeBuoy, GraduationCap } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n"

export default function MobileNavMenu({ close }: { close: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useI18n()

  const items = [
    { label: t.navbar.home, icon: Home, path: "/dashboard" },
    { label: t.navbar.winning, icon: Package, path: "/dashboard/winning-products" },
    { label: t.navbar.training, icon: GraduationCap, path: "/dashboard/training" },
    { label: t.navbar.support, icon: LifeBuoy, path: "/dashboard/support" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center font-text">
      {/* BACKDROP */}
      <div onClick={close} className="absolute inset-0 bg-ink/80 backdrop-blur-md" />

      {/* DROP-UP PANEL */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mb-24 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/[0.08] bg-ink-2 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">Navigation</p>
          <button onClick={close} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-stone transition hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="border-t border-white/[0.06] pt-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path)
                  close()
                }}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition ${
                  active ? "bg-white/[0.06] text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon size={16} className={active ? "text-red-500" : "text-stone"} />
                <span className="font-display text-xl font-light">{item.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
