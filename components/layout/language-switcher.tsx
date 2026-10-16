"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useI18n, Lang } from "@/lib/i18n";

const languages = [
  { code: "FR" as Lang, label: "Français" },
  { code: "EN" as Lang, label: "English" },
  { code: "CN" as Lang, label: "中文" },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLanguage } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  // Close on outside click and Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative font-text">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-3.5 text-sm text-white/80 transition hover:border-white/25 hover:text-white"
      >
        <span className="font-label text-[11px] tracking-[0.12em] text-white">{currentLang.code}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <ChevronDown size={14} className={`text-stone transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label="Language"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            {languages.map((language) => {
              const active = lang === language.code;
              return (
                <li key={language.code}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLanguage(language.code);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active ? "bg-white/[0.06] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-6 font-label text-[11px] tracking-[0.12em] ${active ? "text-red-500" : "text-stone"}`}>
                        {language.code}
                      </span>
                      {language.label}
                    </span>
                    {active && <Check size={14} className="text-red-500" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
