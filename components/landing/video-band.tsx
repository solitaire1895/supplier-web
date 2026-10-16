"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "./primitives";

/** Full-bleed video band with a pull quote. The video only plays while on screen. */
export default function VideoBand() {
  const { t } = useI18n();
  const b = t.landing.band;
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section className="grain relative isolate flex min-h-[70svh] items-center overflow-hidden">
      <video
        ref={ref}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src="/landing/band-ship.mp4"
        poster="/landing/band-ship-poster.webp"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-ink/60" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-transparent to-ink" aria-hidden />

      <Reveal className="mx-auto max-w-4xl px-4 py-32 text-center sm:px-6">
        <blockquote className="font-display text-4xl font-light italic leading-[1.1] tracking-[-0.02em] text-white text-balance sm:text-5xl lg:text-6xl">
          “{b.quote}”
        </blockquote>
        <p className="mt-8 font-label text-[11px] uppercase tracking-[0.2em] text-white/50">{b.caption}</p>
      </Reveal>
    </section>
  );
}
