"use client"

import { useI18n } from "@/lib/i18n"
import Pricing from "@/components/sections/pricing"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SubscribePage() {
  const { t } = useI18n()

  // Ensure t.subscription exists to avoid crashes
  const s = t.subscription || {
    trialExpired: "Trial Expired",
    trialExpiredDesc: "Your trial has ended. Please subscribe to continue.",
    choosePlan: "Choose Your Plan",
    backToHome: "Back to Home"
  }

  return (
    <div className="min-h-screen bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* HEADER / ALERT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium mb-4">
            {s.trialExpired}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {s.choosePlan}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {s.trialExpiredDesc}
          </p>
        </motion.div>

        {/* PRICING PLANS */}
        <Pricing />

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col items-center gap-6 pt-10">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              {s.backToHome}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
