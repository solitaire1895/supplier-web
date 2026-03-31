"use client"

import { motion } from "framer-motion"
import { Home, Package, BarChart3, Users, X } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function MobileNavMenu({ close }: { close: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const items = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "Suppliers", icon: Users, path: "/suppliers" },
    { label: "Products", icon: Package, path: "/products" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">

      {/* BACKDROP */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
      />

      {/* DROP-UP PANEL */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="
          relative z-10 w-full max-w-md
          mb-24
          bg-white/5 backdrop-blur-2xl
          border border-white/10
          rounded-2xl p-3
          shadow-[0_0_60px_rgba(239,68,68,0.15)]
        "
      >

        {/* HEADER */}
        <div className="flex items-center justify-between mb-2 px-2">
          <p className="text-gray-400 text-sm">Navigation</p>
          <button onClick={close}>
            <X size={16} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.path

            return (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.path)
                  close()
                }}
                className={`
                  w-full flex items-center gap-3
                  px-4 py-3 rounded-xl
                  text-sm transition-all

                  ${
                    active
                      ? "bg-white text-black"
                      : "text-gray-300 bg-transparent"
                  }

                  hover:border-red-500
                  hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]
                  border border-transparent
                `}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}