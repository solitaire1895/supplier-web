"use client";

import Navbar from "@/components/navbar/navbar";
import { GraduationCap, FileText, Video, Link2, Clock, ArrowUpRight } from "lucide-react";
import { DisplayHeading, Reveal, SectionLabel } from "@/components/landing/primitives";
import { LockedPanel } from "@/components/dashboard/locked";
import { getPlanFeatures } from "@/lib/plans";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface TrainingClientProps {
  trainings: any[];
  profile: any;
}

const TYPE_META: Record<string, { icon: typeof FileText }> = {
  document: { icon: FileText },
  video: { icon: Video },
  link: { icon: Link2 },
};

function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TrainingClient({ trainings, profile }: TrainingClientProps) {
  const { t } = useI18n();

  if (!t) return null;

  const features = getPlanFeatures(profile?.active_plan);

  // Training is exclusive to the highest plan (Partner). The server already
  // returned an empty list for every other plan — this gates the whole UI as
  // well, exactly like the Winning Products page does.
  const trainingLocked = !features.training;

  return (
    <div className="editorial min-h-screen selection:bg-red-500/30">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 md:px-8">

        {/* HEADER */}
        <Reveal className="mb-16 max-w-3xl">
          <SectionLabel>{t.featureUi.training.eyebrow}</SectionLabel>
          <DisplayHeading as="h1" className="mt-5 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {t.training.title}
          </DisplayHeading>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone">{t.training.subtitle}</p>

          {!trainingLocked && (
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.15em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
              {t.training.partnerOnly}
            </span>
          )}
        </Reveal>

        {/* FULLY LOCKED — any plan below Partner */}
        {trainingLocked && (
          <LockedPanel
            label={t.featureUi.lockedLabel}
            title={t.training.lockedTitle}
            description={t.training.lockedDesc}
            ctaLabel={t.featureUi.seePlans}
            image="/landing/team.webp"
          />
        )}

        {/* EMPTY — Partner with no published trainings yet */}
        {!trainingLocked && trainings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-full border border-white/10">
              <GraduationCap className="text-stone" size={18} aria-hidden />
            </span>
            <h2 className="font-display text-3xl font-light text-white">{t.training.emptyTitle}</h2>
            <p className="mt-3 max-w-md text-sm text-stone">{t.training.emptyDesc}</p>
          </div>
        )}

        {/* GRID */}
        {!trainingLocked && trainings.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trainings.map((training, index) => {
              const meta = TYPE_META[training.type] || TYPE_META.document;
              const TypeIcon = meta.icon;
              const typeLabel =
                training.type === "document" ? t.training.document
                : training.type === "video" ? t.training.video
                : t.training.link;
              const fileSize = formatFileSize(training.file_size);

              return (
                <Link
                  key={training.id}
                  href={`/dashboard/training/${training.id}`}
                  className="group flex min-h-[240px] flex-col rounded-2xl border border-white/[0.08] bg-ink-2 p-6 transition-colors duration-500 hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label text-xs text-red-500">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.15em] text-stone">
                      <TypeIcon size={13} aria-hidden /> {typeLabel}
                    </span>
                  </div>

                  <h3 className="mt-6 line-clamp-2 font-display text-2xl font-light leading-snug text-white">{training.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone">{training.description || ""}</p>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4 text-xs text-stone">
                    <span className="flex items-center gap-3">
                      {training.parts_count > 0 ? (
                        <span className="flex items-center gap-1.5 text-white/80">
                          <Clock size={12} aria-hidden /> {training.parts_count} {t.training.videosCount}
                        </span>
                      ) : training.duration_minutes ? (
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} aria-hidden /> {training.duration_minutes} {t.training.minutes}
                        </span>
                      ) : null}
                      {fileSize ? <span>{fileSize}</span> : null}
                    </span>
                    <ArrowUpRight size={15} className="text-stone transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-500" aria-hidden />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
