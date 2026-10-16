"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, PrimaryButton, Reveal, SectionLabel } from "./primitives";

export default function AiShowcase() {
  const { t } = useI18n();
  const a = t.landing.ai;

  return (
    <section id="ai" className="relative overflow-hidden border-t border-white/[0.06] px-4 py-28 sm:px-6 lg:py-36">
      <div
        className="pointer-events-none absolute right-[-10%] top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(239,68,68,0.16),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-24">
        <Reveal>
          <SectionLabel>{a.label}</SectionLabel>
          <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[56px]">{a.title}</DisplayHeading>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-stone sm:text-lg">{a.desc}</p>

          <ul className="mt-10 space-y-4">
            {(a.points as string[]).map((point) => (
              <li key={point} className="flex items-center gap-4 text-white/85">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-500/30 bg-red-500/10">
                  <Check size={15} className="text-red-500" aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <PrimaryButton href="/auth/signup" className="mt-12">{a.cta}</PrimaryButton>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-ink-2 shadow-[0_40px_120px_-30px_rgba(239,68,68,0.35)]">
            <Image
              src="/landing/nexus-ai.webp"
              alt="Nexus AI"
              width={853}
              height={1280}
              sizes="(min-width: 1024px) 448px, 90vw"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
