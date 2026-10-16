"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, Reveal, SectionLabel } from "./primitives";

const IMAGES = ["/landing/ui-network.webp", "/landing/ui-trending.webp", "/landing/ui-score.webp"];
const CYCLE_MS = 7000;

type Item = { tab: string; title: string; desc: string; metric: string; metricLabel: string };

export default function ProductTabs() {
  const { t } = useI18n();
  const p = t.landing.product;
  const items = p.items as Item[];
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance like the reference; pauses on hover/focus and with reduced motion.
  useEffect(() => {
    if (paused || reduce) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % items.length), CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, paused, reduce, items.length]);

  const item = items[active];

  return (
    <section id="product" className="relative px-4 py-28 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <SectionLabel>{p.label}</SectionLabel>
          <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[56px]">{p.title}</DisplayHeading>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">{p.desc}</p>
        </Reveal>

        <div
          className="mt-16 grid gap-6 lg:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {/* Tabs */}
          <div role="tablist" aria-label={p.label} className="flex flex-col">
            {items.map((it, i) => {
              const on = i === active;
              return (
                <button
                  key={it.tab}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`group relative border-t border-white/[0.08] py-6 text-left transition ${on ? "" : "opacity-50 hover:opacity-80"}`}
                >
                  {/* progress line */}
                  <span className="absolute left-0 top-[-1px] h-px w-full overflow-hidden" aria-hidden>
                    {on && (
                      <motion.span
                        key={`${active}-${paused}`}
                        className="block h-full bg-red-500"
                        initial={{ width: paused || reduce ? "100%" : "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: paused || reduce ? 0 : CYCLE_MS / 1000, ease: "linear" }}
                      />
                    )}
                  </span>
                  <span className="flex items-baseline gap-5">
                    <span className={`font-label text-xs ${on ? "text-red-500" : "text-stone"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-2xl font-light text-white sm:text-[28px]">{it.tab}</span>
                  </span>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden pl-10 text-sm leading-relaxed text-stone"
                      >
                        <span className="block pt-3">{it.desc}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
            <div className="border-t border-white/[0.08]" />
          </div>

          {/* Visual */}
          <div role="tabpanel" className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2 sm:min-h-[520px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={IMAGES[active]} alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" aria-hidden />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
              <div className="max-w-md">
                <h3 className="font-display text-2xl font-light text-white sm:text-3xl">{item.title}</h3>
                <Link
                  href="/auth/signup"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/80 transition hover:text-white"
                >
                  {p.learnMore} <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink/70 px-5 py-4 backdrop-blur-md sm:text-right">
                <p className="font-display text-4xl font-light text-white">{item.metric}</p>
                <p className="mt-1 max-w-[14rem] text-xs leading-snug text-stone">{item.metricLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
