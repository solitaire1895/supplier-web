"use client";

import { useI18n } from "@/lib/i18n";
import { DisplayHeading, Reveal, SectionLabel } from "./primitives";

export default function IntroStats() {
  const { t } = useI18n();
  const s = t.landing.intro;

  return (
    <section id="intro" className="relative px-4 py-28 sm:px-6 lg:py-40">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionLabel>{s.label}</SectionLabel>
          <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[62px]">{s.title}</DisplayHeading>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">{s.desc}</p>
        </Reveal>

        <div className="mt-20 grid border-y border-white/[0.08] sm:grid-cols-3 lg:mt-28">
          {s.stats.map((stat: { value: string; label: string }, i: number) => (
            <Reveal
              key={stat.label}
              delay={i * 0.1}
              className={`px-6 py-12 text-center sm:py-16 ${i > 0 ? "border-t border-white/[0.08] sm:border-l sm:border-t-0" : ""}`}
            >
              <p className="font-display text-6xl font-light tracking-[-0.03em] text-white lg:text-7xl">{stat.value}</p>
              <p className="mt-4 font-label text-[11px] uppercase tracking-[0.18em] text-stone">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
