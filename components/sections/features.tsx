"use client"

import { useEffect, useState } from "react"
import FeatureCard from "./feature-card"
import { useI18n } from "@/lib/i18n"
import {
  Search,
  BarChart3,
  TrendingUp,
  Star,
  DollarSign,
  Users,
  Brain,
  Zap,
  ShieldCheck,
} from "lucide-react"

export default function Features() {
  const { t } = useI18n()
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!t) return null

  return (
    <section id="features" className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* PARALLAX GLOW */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl"
        style={{
          transform: `translateY(${offset * 0.2}px)`,
          background:
            "radial-gradient(circle at center, rgba(239,68,68,0.25), transparent 70%)",
        }}
      />

      {/* TITLE */}
      <div className="max-w-4xl mx-auto text-center mb-20 relative z-10">
        <p className="text-sm mb-3 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
          {t.features?.badge}
        </p>

        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          {t.features?.title}
          <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
            {" "}{t.features?.highlight}
          </span>
        </h2>

        <p className="text-gray-400 mt-6 text-lg">
          {t.features?.description}
        </p>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10 relative z-10">

        <FeatureCard
          icon={<Search />}
          title={t.features?.items?.discovery?.title}
          description={t.features?.items?.discovery?.desc}
        />

        <FeatureCard
          icon={<Star />}
          title={t.features?.items?.profiles?.title}
          description={t.features?.items?.profiles?.desc}
        />

        <FeatureCard
          icon={<TrendingUp />}
          title={t.features?.items?.winning?.title}
          description={t.features?.items?.winning?.desc}
        />

        <FeatureCard
          icon={<BarChart3 />}
          title={t.features?.items?.comparison?.title}
          description={t.features?.items?.comparison?.desc}
        />

        <FeatureCard
          icon={<DollarSign />}
          title={t.features?.items?.simulator?.title}
          description={t.features?.items?.simulator?.desc}
        />

        <FeatureCard
          icon={<Users />}
          title={t.features?.items?.affiliate?.title}
          description={t.features?.items?.affiliate?.desc}
        />

        <FeatureCard
          icon={<Brain />}
          title={t.features?.items?.advisor?.title}
          description={t.features?.items?.advisor?.desc}
        />

        <FeatureCard
          icon={<Zap />}
          title={t.features?.items?.autosourcing?.title}
          description={t.features?.items?.autosourcing?.desc}
        />

        <FeatureCard
          icon={<ShieldCheck />}
          title={t.features?.items?.trust?.title}
          description={t.features?.items?.trust?.desc}
        />

      </div>
    </section>
  )
}