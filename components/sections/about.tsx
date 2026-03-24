"use client"

import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks"

export default function About() {
  return (
    <section className="relative py-32 px-6 bg-black text-white overflow-hidden">

      {/* 🔥 FIREWORKS BACKGROUND */}
      <FireworksBackground className="absolute inset-0 z-0" />

      {/* DARK OVERLAY (keeps text readable) */}
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* CONTENT */}
      <div className="relative z-20 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>
          <p className="text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
            About Nexusply
          </p>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Redefining
            <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
              {" "}Supplier Intelligence
            </span>
          </h2>

          <p className="mt-6 text-gray-400 leading-relaxed">
            Nexusply is a next-generation supplier intelligence platform built
            to help entrepreneurs discover high-performing suppliers, identify
            winning products, and maximize profit margins using AI-driven insights.
          </p>

          <p className="mt-4 text-gray-400 leading-relaxed">
            Instead of guessing, you operate with data. Instead of testing blindly,
            you execute with precision.
          </p>
        </div>

        {/* RIGHT STATS */}
        <div className="grid grid-cols-2 gap-6">

          {[
            { value: "10K+", label: "Suppliers analyzed" },
            { value: "+45%", label: "Avg profit increase" },
            { value: "AI", label: "Smart sourcing engine" },
            { value: "Global", label: "Supplier network" },
          ].map((item, i) => (
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