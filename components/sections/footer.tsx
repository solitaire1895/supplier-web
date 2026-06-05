"use client"

import { Mail } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

export default function Footer() {
  const { t } = useI18n()

  if (!t) return null

  const footerSections = [
    {
      title: t.footer?.sections?.product,
      links: [
        { label: t.footer?.links?.dashboard, href: "/dashboard" },
        { label: t.footer?.links?.winningProducts, href: "/dashboard/winning-products" },
        { label: t.footer?.links?.aiInsights, href: "/dashboard" },
      ],
    },
    {
      title: t.footer?.sections?.resources,
      links: [
        { label: t.footer?.links?.features, href: "#features" },
        { label: t.footer?.links?.pricing, href: "#pricing" },
        { label: t.footer?.links?.howItWorks, href: "#how-it-works" },
      ],
    },
    {
      title: t.footer?.sections?.company,
      links: [
        { label: t.footer?.links?.about, href: "#about" },
        { label: t.footer?.links?.terms, href: "#" },
        { label: t.footer?.links?.privacy, href: "#" },
      ],
    },
    {
      title: t.footer?.sections?.support,
      links: [
        { label: t.footer?.links?.helpCenter, href: "#" },
        { label: t.footer?.links?.contactUs, href: "mailto:support@nexusply.com" },
      ],
    },
  ]

  return (
    <footer className="relative px-6 pb-20 bg-black text-white">

      {/* OUTER SPACING */}
      <div className="max-w-7xl mx-auto">

        {/* MAIN CONTAINER */}
        <div className="
          relative rounded-3xl p-10 md:p-16
          bg-white/5 backdrop-blur-2xl
          border border-white/10
          overflow-hidden
        ">

          {/* 🔥 BACKGROUND GLOW */}
          <div className="absolute inset-0 opacity-20 blur-3xl bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2),transparent_70%)]" />

          {/* CTA */}
          <div className="text-center mb-16 relative z-10">

            <h2 className="text-3xl md:text-4xl font-bold">
              {t.footer?.cta?.title}
              <span className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,1)]">
                {" "}{t.footer?.cta?.highlight}
              </span>
            </h2>

            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              {t.footer?.cta?.description}
            </p>

            {/* INPUT */}
            <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center">

              <div className="
                flex items-center gap-2 px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus-within:border-red-500
                transition
              ">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder={t.footer?.cta?.placeholder}
                  className="bg-transparent outline-none text-sm"
                />
              </div>

              <Link href="/auth/signup" className="
                px-6 py-3 rounded-xl
                bg-red-500 text-white font-medium
                hover:bg-red-600
                shadow-[0_0_20px_rgba(239,68,68,0.7)]
                text-center
                transition
              ">
                {t.footer?.cta?.button}
              </Link>

            </div>

            <p className="text-xs text-gray-500 mt-3">
              {t.footer?.cta?.note}
            </p>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-white/10 my-10" />

          {/* FOOTER GRID */}
          <div className="grid md:grid-cols-5 gap-10 text-sm relative z-10">

            {/* BRAND */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                <span className="text-white">Nexus</span>
                <span className="text-red-500">ply</span>
              </h3>

              <p className="text-gray-400 text-sm">
                {t.footer?.brand?.desc}
              </p>
            </div>

            {/* LINKS */}
            {footerSections.map((section, i) => (
              <div key={i}>
                <h4 className="mb-3 text-gray-300 font-bold">{section.title}</h4>
                <ul className="space-y-2 text-gray-400">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        className="
                          hover:text-red-500
                          hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]
                          transition cursor-pointer
                        "
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          {/* BOTTOM */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between text-xs text-gray-500 relative z-10">
            <p>{t.footer?.bottom?.rights}</p>

            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-red-500 cursor-pointer transition">{t.footer?.bottom?.privacy}</span>
              <span className="hover:text-red-500 cursor-pointer transition">{t.footer?.bottom?.terms}</span>
              <span className="hover:text-red-500 cursor-pointer transition">{t.footer?.bottom?.security}</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}