"use client";

import Navbar from "@/components/navbar/navbar";
import {
  GraduationCap, Lock, FileText, Video, Link2, Clock, ChevronRight
} from "lucide-react";
import { getPlanFeatures } from "@/lib/plans";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface TrainingClientProps {
  trainings: any[];
  profile: any;
}

const TYPE_META: Record<string, { icon: any; classes: string }> = {
  document: { icon: FileText, classes: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  video: { icon: Video, classes: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  link: { icon: Link2, classes: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      <Navbar />

      <div className="pt-28 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">

        {/* HERO HEADER */}
        <div className="mb-16 relative">
          <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-72 h-72 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="relative text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
            {t.training.title}
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <GraduationCap size={28} className="text-red-500" />
            </div>
          </h1>
          <p className="relative text-gray-400 mt-4 text-base md:text-lg max-w-2xl">
            {t.training.subtitle}
          </p>

          {!trainingLocked && (
            <div className="relative mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                {t.training.partnerOnly}
              </span>
            </div>
          )}
        </div>

        {/* FULLY LOCKED STATE — shown for any plan below Partner */}
        {trainingLocked && (
          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 inline-flex mb-6">
                <Lock className="text-red-500" size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-4">{t.training.lockedTitle}</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
                {t.training.lockedDesc}
              </p>
              <Link
                href="/dashboard/profile?tab=plan"
                className="px-10 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all inline-block"
              >
                {t.common.upgrade} Plan Now
              </Link>
            </div>
          </div>
        )}

        {/* EMPTY STATE — Partner with no published trainings yet */}
        {!trainingLocked && trainings.length === 0 && (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-16 text-center">
            <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 inline-flex mb-6">
              <GraduationCap className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t.training.emptyTitle}</h2>
            <p className="text-gray-500 max-w-md mx-auto">{t.training.emptyDesc}</p>
          </div>
        )}

        {/* TRAINING GRID — compact Apple-glass cards; click through to the detail page */}
        {!trainingLocked && trainings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trainings.map((training) => {
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
                  className="group rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] p-4 flex flex-col hover:border-white/[0.14] hover:bg-white/[0.06] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${meta.classes}`}>
                      <TypeIcon size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-gray-400 transition-colors flex items-center gap-0.5">
                      {typeLabel}
                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1.5 truncate group-hover:text-red-400 transition-colors">
                    {training.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                    {training.description || ""}
                  </p>

                  <div className="mt-auto flex items-center gap-3 text-[10px] text-gray-600">
                    {training.duration_minutes ? (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {training.duration_minutes} {t.training.minutes}
                      </span>
                    ) : null}
                    {fileSize ? <span>{fileSize}</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* (in-page playback now lives on each training's own detail page) */}
      </div>
    </div>
  );
}
