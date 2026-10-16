"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, GhostButton, PrimaryButton, Reveal, SectionLabel } from "./primitives";

export default function FinalCta() {
  const { t } = useI18n();
  const c = t.landing.cta;

  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal className="mx-auto max-w-7xl">
        <div className="grain relative isolate overflow-hidden rounded-3xl border border-white/[0.08] px-6 py-24 text-center sm:px-12 lg:py-32">
          <Image src="/landing/containers.webp" alt="" fill sizes="(min-width: 1280px) 1280px, 100vw" className="-z-20 object-cover grayscale-[40%]" />
          <div className="absolute inset-0 -z-10 bg-ink/80" aria-hidden />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(239,68,68,0.25),transparent_70%)]" aria-hidden />

          <SectionLabel className="text-white/60">{c.label}</SectionLabel>
          <DisplayHeading className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.06] sm:text-5xl lg:text-[64px]">{c.title}</DisplayHeading>
          <p className="mx-auto mt-6 max-w-md text-base text-white/70">{c.desc}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton href="/auth/signup">{c.primary}</PrimaryButton>
            <GhostButton href="/auth/login">{c.secondary}</GhostButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
