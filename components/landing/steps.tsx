"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, Reveal, SectionLabel } from "./primitives";

export default function Steps() {
  const { t } = useI18n();
  const s = t.landing.steps;

  return (
    <section id="how" className="relative border-t border-white/[0.06] px-4 py-28 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionLabel>{s.label}</SectionLabel>
            <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[56px]">{s.title}</DisplayHeading>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-2 sm:aspect-[21/9]">
            <Image
              src="/landing/ui-dashboard.webp"
              alt=""
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover object-[50%_40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" aria-hidden />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {(s.items as { title: string; desc: string }[]).map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <div className="border-t border-white/10 pt-6">
                <span className="font-label text-xs text-red-500">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-2xl font-light text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
