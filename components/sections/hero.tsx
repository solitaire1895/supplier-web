"use client"

import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

export default function Hero() {
  const { t } = useI18n()

  if (!t) return null

  return (
    <section className="relative h-screen flex items-center justify-center text-center px-6 bg-black overflow-hidden">
      
      {/* 🔥 HOLE BACKGROUND */}
      <HoleBackground className="absolute inset-0 z-0" />

      {/* DARK OVERLAY (for readability) */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* CONTENT */}
      <div className="relative z-20 max-w-4xl">

        <p className="text-sm text-gray-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {t.hero?.intro}
        </p>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          {t.hero?.title}
          <br />
          <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {t.hero?.subtitle}
          </span>
        </h1>

        <p className="mt-6 text-gray-400 text-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          {t.hero?.description}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">

          <Link href="#features" className="
            px-8 py-4 rounded-full text-white font-medium
            bg-white/5 backdrop-blur-xl
            border border-white/10
            hover:border-red-500/50
            hover:bg-white/10
            hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]
            transition-all duration-300
          ">
            {t.hero?.explore}
          </Link>

          <Link href="/auth/signup" className="
            px-8 py-4 rounded-full
            bg-red-500 text-white font-bold
            hover:bg-red-600
            shadow-[0_0_25px_rgba(239,68,68,0.6)]
            hover:shadow-[0_0_40px_rgba(239,68,68,0.8)]
            hover:scale-105
            transition-all duration-300
          ">
            {t.hero?.getStarted}
          </Link>

        </div>
      </div>

    </section>
  )
}