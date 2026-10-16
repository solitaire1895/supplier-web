"use client";

import Navbar from "@/components/navbar/navbar";
import {
  ArrowLeft, FileText, Video, Link2, Download, ExternalLink,
  Clock, AlertCircle
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toEmbedUrl } from "@/lib/embed";
import { useState } from "react";
import { SectionLabel } from "@/components/landing/primitives";
import Link from "next/link";

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

/* Shared editorial surface: near-black panel with a hairline border */
const GLASS = "rounded-2xl border border-white/[0.08] bg-ink-2";

/* Primary red action (no glow) */
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-600";

export default function TrainingDetailClient({ training }: { training: any }) {
  const { t } = useI18n();
  const [activePart, setActivePart] = useState(0);

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

  // Playlist parts (video trainings) — many videos, one training.
  const parts: any[] = training.parts || [];
  const hasPlaylist = parts.length > 0;
  const currentPart = parts[Math.min(activePart, Math.max(parts.length - 1, 0))];
  const currentPartEmbed = currentPart?.external_url
    ? toEmbedUrl(currentPart.external_url)
    : null;
  const handleEnded = () => {
    if (activePart < parts.length - 1) setActivePart(activePart + 1);
  };

  return (
    <div className="editorial min-h-screen selection:bg-red-500/30">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 md:px-8">

        {/* BACK */}
        <Link
          href="/dashboard/training"
          className="group mb-10 inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 transition group-hover:border-white/30">
            <ArrowLeft size={14} aria-hidden />
          </span>
          {t.training.back}
        </Link>

        {/* HEADER */}
        <div className="mb-6">
          <SectionLabel>
            <TypeIcon size={12} aria-hidden /> {typeLabel} <span className="text-stone-2">·</span> {t.training.partnerOnly}
          </SectionLabel>
          <h1 className="mt-5 break-words font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] text-white text-balance sm:text-5xl">
            {training.title}
          </h1>
        </div>

        {/* DESCRIPTION + META */}
        {training.description && (
          <p className="mb-4 max-w-2xl text-base leading-relaxed text-stone">
            {training.description}
          </p>
        )}
        <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-white/[0.08] pb-8 font-label text-[11px] text-stone-2">
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

        {/* PLAYLIST — many videos, one training */}
        {hasPlaylist && (
          <div className="space-y-5">
            {/* CURRENT PART PLAYER */}
            {currentPart?.signed_url ? (
              <div className={`${GLASS} overflow-hidden`}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  controls
                  autoPlay
                  onEnded={handleEnded}
                  className="w-full aspect-video bg-black"
                  src={currentPart.signed_url}
                />
              </div>
            ) : currentPartEmbed ? (
              <div className={`${GLASS} overflow-hidden`}>
                <iframe
                  src={currentPartEmbed}
                  title={currentPart.title || training.title}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : currentPart?.external_url ? (
              <a
                href={currentPart.external_url}
                target="_blank"
                rel="noreferrer"
                className={PRIMARY_BTN}
              >
                <ExternalLink size={16} /> {t.training.openOriginal}
              </a>
            ) : null}

            {/* PLAYLIST LIST */}
            {parts.length > 1 && (
              <div className={`${GLASS} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">
                    {t.training.playlist}
                  </p>
                  <span className="font-label text-[11px] text-stone-2">
                    {activePart + 1} / {parts.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {parts.map((part: any, i: number) => (
                    <button
                      key={part.id || part.file_path || i}
                      onClick={() => setActivePart(i)}
                      className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition ${
                        i === activePart ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        className={`shrink-0 font-label text-xs ${
                          i === activePart ? "text-red-500" : "text-stone-2"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate font-display text-lg font-light ${
                            i === activePart ? "text-white" : "text-white/70"
                          }`}
                        >
                          {part.title || part.file_name || `Part ${i + 1}`}
                        </span>
                        <span className="block truncate text-xs text-stone-2">
                          {part.file_name}
                          {part.file_size ? ` · ${formatFileSize(part.file_size)}` : ""}
                        </span>
                      </span>
                      {i === activePart ? (
                        <span className="flex shrink-0 items-center gap-1.5 font-label text-[9px] uppercase tracking-[0.15em] text-red-500">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                          {t.training.nowPlaying}
                        </span>
                      ) : i === activePart + 1 ? (
                        <span className="shrink-0 font-label text-[9px] uppercase tracking-[0.15em] text-stone-2">
                          {t.training.upNext}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEGACY SINGLE CONTENT — trainings without playlist parts */}
        {!hasPlaylist && (
          <div className="space-y-5">

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
            className={PRIMARY_BTN}
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
              className={PRIMARY_BTN}
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
            <AlertCircle className="mx-auto mb-3 text-red-500" size={22} />
            <p className="text-sm text-stone">{t.common.unavailable}</p>
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
}
