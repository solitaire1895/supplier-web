"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, GhostButton, PrimaryButton } from "./primitives";

export default function Hero() {
  const { t } = useI18n();
  const h = t.landing.hero;
  const a = t.landing.announce;
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden">
      {/* Background video: aerial container ship. The poster shows instantly. */}
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src="/landing/hero-ship.mp4"
        poster="/landing/hero-ship-poster.webp"
        autoPlay={!reduce}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-ink/55" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-transparent to-ink" aria-hidden />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(60%_80%_at_50%_100%,rgba(239,68,68,0.18),transparent_70%)]"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-32 text-center sm:px-6">
        <motion.a
          href="#pricing"
          {...rise(0.1)}
          className="group mx-auto mb-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-4 text-sm text-white/80 backdrop-blur-md transition hover:border-white/20"
        >
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">{a.tag}</span>
          {a.text}
          <ArrowRight size={14} className="text-white/50 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </motion.a>

        <motion.div {...rise(0.2)}>
          <DisplayHeading as="h1" className="mx-auto max-w-4xl text-[44px] leading-[1.02] sm:text-6xl lg:text-[88px]">
            {h.title}
          </DisplayHeading>
        </motion.div>

        <motion.p {...rise(0.35)} className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
          {h.subtitle}
        </motion.p>

        <motion.div {...rise(0.5)} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href="/auth/signup">{h.primary}</PrimaryButton>
          <GhostButton href="#pricing">{h.secondary}</GhostButton>
        </motion.div>
      </div>

      <a
        href="#intro"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-label text-[10px] uppercase tracking-[0.25em] text-white/40 transition hover:text-white/70 sm:flex"
      >
        {h.scroll}
        <span className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" aria-hidden />
      </a>
    </section>
  );
}
