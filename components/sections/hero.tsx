"use client"

import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole"

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center px-6 bg-black overflow-hidden">
      
      {/* 🔥 HOLE BACKGROUND */}
      <HoleBackground className="absolute inset-0 z-0" />

      {/* DARK OVERLAY (for readability) */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* CONTENT */}
      <div className="relative z-20 max-w-4xl">

        <p className="text-sm text-gray-400 mb-4">
          Introducing Nexusply Intelligence
        </p>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          The Future of Supplier Intelligence:
          <br />
          <span className="text-white">
            Data & Profit Combined
          </span>
        </h1>

        <p className="mt-6 text-gray-400 text-lg">
          Discover winning suppliers, optimize margins, and scale your business with AI-powered insights.
        </p>

        <div className="mt-8 flex justify-center gap-4">

          <button className="
            px-6 py-3 rounded-full text-white
            bg-white/10 backdrop-blur-xl
            border border-white/20
            hover:border-red-500
            hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]
            transition
          ">
            Learn More
          </button>

          <button className="
            px-6 py-3 rounded-full
            bg-red-500 text-white
            hover:bg-red-600
            shadow-[0_0_20px_rgba(239,68,68,0.7)]
            transition
          ">
            Get Started
          </button>

        </div>
      </div>

    </section>
  )
}