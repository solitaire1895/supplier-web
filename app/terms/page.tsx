"use client";

import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/sections/footer";

export default function TermsPage() {
  const { t } = useI18n();

  if (!t || !t.policies || !t.policies.terms) return null;

  const { terms } = t.policies;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="border-b border-white/10 pb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {terms.title}
              </h1>
              <p className="text-gray-500 text-sm">
                {terms.lastUpdated}
              </p>
            </div>

            {/* Intro */}
            <p className="text-xl text-gray-300 leading-relaxed">
              {terms.intro}
            </p>

            {/* Sections */}
            <div className="space-y-12 pt-8">
              {terms.sections.map((section: any, i: number) => (
                <div key={i} className="space-y-4">
                  <h2 className="text-2xl font-semibold text-white">
                    {section.title}
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer Note */}
            <div className="pt-12 border-t border-white/10">
              <p className="text-gray-500 text-sm">
                By using our platform, you acknowledge that you have read and understood these Terms of Service.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
