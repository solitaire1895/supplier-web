"use client"

import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks"
import { useI18n } from "@/lib/i18n"

export default function About() {
  const { t } = useI18n()

  if (!t) return null

  const stats = [
    { value: t.about?.stats?.suppliers?.value, label: t.about?.stats?.suppliers?.label },
    { value: t.about?.stats?.profit?.value, label: t.about?.stats?.profit?.label },
    { value: t.about?.stats?.ai?.value, label: t.about?.stats?.ai?.label },
    { value: t.about?.stats?.global?.value, label: t.about?.stats?.global?.label },
  ]

  return (
    <section id="about" className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* 🔥 FIREWORKS BACKGROUND */}
      <FireworksBackground className="absolute inset-0 z-0" />

      {/* DARK OVERLAY (keeps text readable) */}
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* CONTENT */}
      <div className="relative z-20 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>
          <p className="text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
            {t.about?.badge}
          </p>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            {t.about?.title}
            <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
              {" "}{t.about?.highlight}
            </span>
          </h2>

          <p className="mt-6 text-gray-400 leading-relaxed">
            {t.about?.description1}
          </p>

          <p className="mt-4 text-gray-400 leading-relaxed">
            {t.about?.description2}
          </p>
        </div>

        {/* RIGHT STATS */}
        <div className="grid grid-cols-2 gap-6">

          {stats.map((item, i) => (
            <div
              key={i}
              className="
                group p-6 rounded-2xl
                bg-white/5 backdrop-blur-xl
                border border-white/10
                transition-all duration-500
                hover:border-red-500
                hover:shadow-[0_0_35px_rgba(239,68,68,0.5)]
              "
            >
              <h3 className="
                text-2xl font-bold text-red-500
                drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]
                group-hover:drop-shadow-[0_0_20px_rgba(239,68,68,1)]
              ">
                {item.value}
              </h3>

              <p className="text-gray-400 text-sm mt-2">
                {item.label}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}