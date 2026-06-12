"use client"

import SignupForm from "@/components/auth/signup-form"
import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { useI18n } from "@/lib/i18n"

export default function SignupPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* BACKGROUND */}

      {/* Container */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_60px_rgba(239,68,68,0.15)]">
      {/* <HexagonBackground /> */}
        
       {/* LEFT PANEL */}
        <div className="
          hidden md:flex 
          flex-col justify-between 
          p-10
          bg-gradient-to-br from-red-500/20 via-black to-black
          ">
          {/* Logo */}
          <div className="text-lg font-semibold">
            <span className="text-white">Nexus</span>
            <span className="text-red-500">ply</span>
          </div>

          {/* Content */}
          <div>
            <p className="text-gray-400 mb-3 text-sm">
              {t.dashboard.title}
            </p>

            <h2 className="text-3xl font-semibold text-white leading-snug">
              {t.auth.panelTitle}
            </h2>

            <p className="text-gray-400 mt-4 text-sm">
              {t.auth.panelDesc}
            </p>
          </div>

          <div />
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 sm:p-10 flex items-center justify-center">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
