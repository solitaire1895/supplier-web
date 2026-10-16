"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, Reveal, SectionLabel } from "./primitives";

const IMAGES = ["/landing/delivery.webp", "/landing/warehouse.webp", "/landing/team.webp", "/landing/parcels.webp"];

type Item = { tab: string; desc: string; metric: string; metricLabel: string };

export default function Solutions() {
  const { t } = useI18n();
  const s = t.landing.solutions;
  const items = s.items as Item[];
  const [active, setActive] = useState(0);
  const item = items[active];

  return (
    <section id="solutions" className="relative border-t border-white/[0.06] px-4 py-28 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionLabel>{s.label}</SectionLabel>
          <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[56px]">{s.title}</DisplayHeading>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">{s.desc}</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 flex justify-center">
          <div role="tablist" aria-label={s.label} className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-1 sm:rounded-full">
            {items.map((it, i) => (
              <button
                key={it.tab}
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm transition sm:px-5 ${i === active ? "text-white" : "text-white/55 hover:text-white"}`}
              >
                {i === active && (
                  <motion.span layoutId="solutions-pill" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
                )}
                <span className="relative">{it.tab}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-10">
          <div role="tabpanel" className="grain relative isolate min-h-[520px] overflow-hidden rounded-3xl border border-white/[0.08] lg:min-h-[600px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0 -z-20"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={IMAGES[active]} alt="" fill sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover grayscale-[35%]" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-ink/40 lg:bg-gradient-to-r lg:from-ink lg:via-ink/75 lg:to-ink/10" aria-hidden />

            <div className="flex min-h-[520px] flex-col justify-between gap-10 p-6 sm:p-10 lg:min-h-[600px] lg:p-14">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45 }}
                  className="max-w-md"
                >
                  <p className="font-label text-[11px] uppercase tracking-[0.18em] text-red-500">{String(active + 1).padStart(2, "0")}</p>
                  <h3 className="mt-4 font-display text-4xl font-light text-white sm:text-5xl">{item.tab}</h3>
                  <p className="mt-5 text-base leading-relaxed text-white/70">{item.desc}</p>
                </motion.div>
              </AnimatePresence>

              <div className="max-w-xs border-t border-white/15 pt-6">
                <p className="font-display text-5xl font-light text-white sm:text-6xl">{item.metric}</p>
                <p className="mt-2 text-sm text-stone">{item.metricLabel}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
