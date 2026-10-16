"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LandingFooter() {
  const { t } = useI18n();
  const f = t.landing.footer;

  // Section anchors point at the home page so the footer also works on /terms and /privacy.
  const columns = [
    {
      title: f.product,
      links: [
        { label: f.features, href: "/#product" },
        { label: f.solutions, href: "/#solutions" },
        { label: f.pricing, href: "/#pricing" },
        { label: f.faq, href: "/#faq" },
      ],
    },
    {
      title: f.company,
      links: [
        { label: f.dashboard, href: "/dashboard" },
        { label: f.support, href: "/dashboard/support" },
        { label: f.contact, href: "mailto:support@nexusply.com" },
      ],
    },
    {
      title: f.legal,
      links: [
        { label: f.terms, href: "/terms" },
        { label: f.privacy, href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-ink px-4 pt-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 pb-16 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <Link href="/" className="text-xl font-semibold tracking-tight">
            <span className="text-white">Nexus</span>
            <span className="text-red-500">ply</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone">{f.tagline}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-label text-[11px] uppercase tracking-[0.18em] text-stone-2">{col.title}</p>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/[0.06] py-6 text-xs text-stone-2 sm:flex-row sm:justify-between">
        <p>{f.rights}</p>
        <p className="font-label uppercase tracking-[0.18em]">Nexusply</p>
      </div>

      {/* Oversized wordmark, as on the reference */}
      <p
        className="pointer-events-none select-none text-center font-display text-[22vw] font-light leading-[0.8] tracking-[-0.04em] text-white/[0.035]"
        aria-hidden
      >
        Nexusply
      </p>
    </footer>
  );
}
