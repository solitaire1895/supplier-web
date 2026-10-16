"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/supabase/provider";

export default function LandingNav() {
  const { t } = useI18n();
  const n = t.landing.nav;
  const { user } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll behind the mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { label: n.product, href: "#product" },
    { label: n.solutions, href: "#solutions" },
    { label: n.ai, href: "#ai" },
    { label: n.pricing, href: "#pricing" },
    { label: n.faq, href: "#faq" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled || open ? "border-b border-white/[0.06] bg-ink/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20">
        <Link href="/" className="text-lg font-semibold tracking-tight" aria-label="Nexusply">
          <span className="text-white">Nexus</span>
          <span className="text-red-500">ply</span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm text-white/70 transition hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {user ? (
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
            >
              {t.landing.footer.dashboard}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="px-3 py-2 text-sm text-white/80 transition hover:text-white">
                {n.login}
              </Link>
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
              >
                {n.start}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="h-[calc(100svh-4rem)] overflow-y-auto border-t border-white/[0.06] bg-ink px-4 pb-10 pt-6 sm:px-6 lg:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/[0.06] py-4 font-display text-3xl font-light text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3">
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-red-500 py-3 text-center text-sm font-medium text-white">
                {t.landing.footer.dashboard}
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className="rounded-full bg-red-500 py-3 text-center text-sm font-medium text-white">
                  {n.start}
                </Link>
                <Link href="/auth/login" className="rounded-full border border-white/15 py-3 text-center text-sm text-white">
                  {n.login}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
