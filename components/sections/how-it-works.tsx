"use client"

import { motion } from "framer-motion"
import { Database, Search, TrendingUp, Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export default function HowItWorks() {
  const { t } = useI18n()

  if (!t) return null

  const steps = [
    {
      icon: <Database className="w-8 h-8 text-red-500" />,
      title: t.howItWorks?.step1?.title,
      description: t.howItWorks?.step1?.desc
    },
    {
      icon: <Search className="w-8 h-8 text-red-500" />,
      title: t.howItWorks?.step2?.title,
      description: t.howItWorks?.step2?.desc
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-red-500" />,
      title: t.howItWorks?.step3?.title,
      description: t.howItWorks?.step3?.desc
    },
    {
      icon: <Zap className="w-8 h-8 text-red-500" />,
      title: t.howItWorks?.step4?.title,
      description: t.howItWorks?.step4?.desc
    }
  ]

  return (
    <section id="how-it-works" className="py-32 px-6 bg-black text-white relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-800 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t.howItWorks?.title} <span className="text-red-500">{t.howItWorks?.highlight}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.howItWorks?.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-all duration-500 group"
            >
              <div className="mb-6 p-4 rounded-2xl bg-black border border-white/5 inline-block group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
