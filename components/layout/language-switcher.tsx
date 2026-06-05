"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useI18n, Lang } from "@/lib/i18n";

const languages = [
  { code: "EN" as Lang, label: "English", flag: "🇺🇸" },
  { code: "FR" as Lang, label: "Français", flag: "🇫🇷" },
  { code: "CN" as Lang, label: "中文", flag: "🇨🇳" },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLanguage } = useI18n();

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white/5 border border-white/10
          text-sm font-medium text-gray-300
          hover:text-white hover:bg-white/10 hover:border-white/20
          transition-all duration-300
        "
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute right-0 z-50">
            {/* Backdrop to close */}
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="
                relative mt-2 w-48
                bg-black/80 backdrop-blur-2xl
                border border-white/10 rounded-2xl
                p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)]
                overflow-hidden
              "
            >
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    setLanguage(language.code);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
                    text-sm transition-all duration-200
                    ${
                      lang === language.code
                        ? "bg-red-500/10 text-red-500"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{language.flag}</span>
                    <span>{language.label}</span>
                  </div>
                  {lang === language.code && <Check size={14} />}
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}