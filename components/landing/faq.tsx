"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DisplayHeading, Reveal, SectionLabel } from "./primitives";

export default function Faq() {
  const { t } = useI18n();
  const f = t.landing.faq;
  const items = f.items as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative border-t border-white/[0.06] px-4 py-28 sm:px-6 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal>
          <SectionLabel>{f.label}</SectionLabel>
          <DisplayHeading className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-[56px]">{f.title}</DisplayHeading>
          <a
            href="mailto:support@nexusply.com"
            className="mt-8 inline-block text-sm text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-red-500"
          >
            {t.landing.footer.contact}
          </a>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border-b border-white/[0.08]">
            {items.map((item, i) => {
              const isOpen = open === i;
              const id = `faq-${i}`;
              return (
                <div key={item.q} className="border-t border-white/[0.08]">
                  <h3>
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={id}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span className="text-base text-white sm:text-lg">{item.q}</span>
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
                          isOpen ? "rotate-45 border-red-500/50 text-red-500" : "border-white/15 text-white/60"
                        }`}
                        aria-hidden
                      >
                        <Plus size={15} />
                      </span>
                    </button>
                  </h3>
                  {/* grid-rows trick: animates to the content's natural height */}
                  <div
                    id={id}
                    className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-6 pr-12 text-sm leading-relaxed text-stone sm:text-base">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
