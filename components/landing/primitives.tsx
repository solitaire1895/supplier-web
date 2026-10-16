"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** Fades content up as it enters the viewport (once). */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Small mono eyebrow above a section title, with the brand-red dot. */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.18em] text-stone ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
      {children}
    </p>
  );
}

/** Editorial serif heading. The last word is set in red italic when the text has spaces. */
export function DisplayHeading({
  as: Tag = "h2",
  children,
  className = "",
  accent = true,
}: {
  as?: "h1" | "h2" | "h3";
  children: string;
  className?: string;
  accent?: boolean;
}) {
  const words = children.trim().split(" ");
  const canAccent = accent && words.length > 1;
  return (
    <Tag className={`font-display font-light tracking-[-0.02em] text-balance ${className}`}>
      {canAccent ? (
        <>
          {words.slice(0, -1).join(" ")} <em className="font-normal italic text-red-500">{words.at(-1)}</em>
        </>
      ) : (
        children
      )}
    </Tag>
  );
}

export function PrimaryButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${className}`}
    >
      {children}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export function GhostButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 ${className}`}
    >
      {children}
    </Link>
  );
}
