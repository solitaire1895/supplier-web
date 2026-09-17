"use client";

import Navbar from "@/components/navbar/navbar";
import {
  ArrowLeft, FileText, Video, Link2, Download, ExternalLink,
  Clock, AlertCircle
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toEmbedUrl } from "@/lib/embed";
import Link from "next/link";

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

/* Shared Apple-glass surface: frosted card, hairline border, soft shadow */
const GLASS =
  "rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.25)]";

export default function TrainingDetailClient({ training }: { training: any }) {
  const { t } = useI18n();

  if (!t) return null;

  const meta = TYPE_META[training.type] || TYPE_META.document;
  const TypeIcon = meta.icon;
  const typeLabel =
    training.type === "document" ? t.training.document
    : training.type === "video" ? t.training.video
    : t.training.link;
  const fileSize = formatFileSize(training.file_size);

  // External link → embedded player URL (plays INSIDE Nexusply).
  const embedUrl = training.external_url ? toEmbedUrl(training.external_url) : null;

  // Uploaded video file → native in-page player via signed URL.
  const isUploadedVideo = training.type === "video" && !!training.signed_url;

  // Nothing playable / downloadable at all (e.g. signed URL failed).
  const nothingAvailable =
    !training.signed_url && !embedUrl && !training.external_url;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      <Navbar />

      <div className="pt-28 pb-24 px-4 md:px-8 max-w-4xl mx-auto animate-in fade-in duration-700">

        {/* BACK */}
        <Link
          href="/dashboard/training"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-400 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> {t.training.back}
        </Link>

        {/* HEADER */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`p-3 rounded-2xl border ${meta.classes} shrink-0`}>
            <TypeIcon size={22} />
          </div>
          <div className="min-w-0 pt-1">
            <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
              {typeLabel}
              <span className="text-red-500">{t.training.partnerOnly}</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight break-words">
              {training.title}
            </h1>
          </div>
        </div>

        {/* DESCRIPTION + META */}
        {training.description && (
          <p className="text-sm text-gray-400 leading-relaxed mb-3 max-w-2xl">
            {training.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 mb-10">
          {training.duration_minutes ? (
            <span className="flex items-center gap-1.5">
              <Clock size={11} /> {training.duration_minutes} {t.training.minutes}
            </span>
          ) : null}
          {fileSize ? <span>{fileSize}</span> : null}
          {training.file_name ? (
            <span className="truncate max-w-[220px]" title={training.file_name}>
              {training.file_name}
            </span>
          ) : null}
        </div>

        {/* UPLOADED VIDEO — native in-page player (signed URL) */}
        {isUploadedVideo && (
          <div className={`${GLASS} overflow-hidden`}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              controls
              autoPlay
              className="w-full aspect-video bg-black"
              src={training.signed_url}
            />
          </div>
        )}

        {/* EXTERNAL VIDEO / LINK — plays INSIDE Nexusply (YouTube / Vimeo embed) */}
        {training.external_url && embedUrl && (
          <div className={`${GLASS} overflow-hidden`}>
            <iframe
              src={embedUrl}
              title={training.title}
              className="w-full aspect-video"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
            />
          </div>
        )}

        {/* Link that can't be embedded — graceful fallback to the original */}
        {training.external_url && !embedUrl && (
          <a
            href={training.external_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all"
          >
            <ExternalLink size={16} /> {t.training.openOriginal}
          </a>
        )}

        {/* DOCUMENT — download + inline PDF preview */}
        {training.type === "document" && training.signed_url && (
          <div className="space-y-4">
            <a
              href={training.signed_url}
              target="_blank"
              rel="noreferrer"
              download={training.file_name || undefined}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all"
            >
              <Download size={16} /> {t.training.download}
            </a>
            <div className={`${GLASS} overflow-hidden`}>
              <iframe
                src={training.signed_url}
                title={training.title}
                className="w-full h-[70vh]"
              />
            </div>
          </div>
        )}

        {/* Nothing playable or downloadable */}
        {nothingAvailable && (
          <div className={`${GLASS} p-12 text-center`}>
            <AlertCircle className="text-red-500 mb-3 mx-auto" size={28} />
            <p className="text-sm text-gray-500">{t.common.unavailable}</p>
          </div>
        )}
      </div>
    </div>
  );
}
