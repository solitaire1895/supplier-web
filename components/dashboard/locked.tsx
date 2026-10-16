"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import { DisplayHeading, PrimaryButton, SectionLabel } from "@/components/landing/primitives";

/**
 * Full-width locked state for a gated feature: photo backdrop, lock, serif title,
 * short explanation and one red call to action.
 */
export function LockedPanel({
  label,
  title,
  description,
  ctaLabel,
  href = "/dashboard/profile?tab=plan",
  image = "/landing/warehouse.webp",
  className = "",
}: {
  label?: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  image?: string;
  className?: string;
}) {
  return (
    <div className={`grain relative isolate overflow-hidden rounded-3xl border border-white/[0.08] px-6 py-16 text-center sm:px-12 sm:py-20 ${className}`}>
      <Image src={image} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="-z-20 object-cover grayscale-[40%]" />
      <div className="absolute inset-0 -z-10 bg-ink/80" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(239,68,68,0.22),transparent_70%)]" aria-hidden />

      <span className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-ink/40 backdrop-blur-md">
        <Lock className="text-red-500" size={18} aria-hidden />
      </span>
      {label && <SectionLabel className="text-white/60">{label}</SectionLabel>}
      <DisplayHeading className={`mx-auto max-w-2xl text-3xl leading-[1.1] sm:text-4xl lg:text-5xl ${label ? "mt-4" : ""}`}>
        {title}
      </DisplayHeading>
      <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">{description}</p>
      <PrimaryButton href={href} className="mt-9">{ctaLabel}</PrimaryButton>
    </div>
  );
}

/** Placeholder card standing in for a locked item inside a grid. */
export function LockedTile({ label, description, className = "" }: { label: string; description: string; className?: string }) {
  return (
    <div
      className={`flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-2/50 p-8 text-center ${className}`}
    >
      <span className="mb-5 grid h-11 w-11 place-items-center rounded-full border border-white/10">
        <Lock className="text-stone" size={17} aria-hidden />
      </span>
      <p className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">{label}</p>
      <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-stone-2">{description}</p>
    </div>
  );
}

/** One-line notice for a partially limited feature (e.g. delayed access). */
export function LockedNotice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm leading-relaxed text-white/80 ${className}`}>
      <Lock size={15} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
