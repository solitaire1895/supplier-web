"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Star, ChevronLeft, ShieldCheck, Truck,
  TrendingUp, MessageSquare, Phone, MessageCircle, Mail,
} from "lucide-react";
import { Reveal, SectionLabel } from "@/components/landing/primitives";
import { LockedPanel } from "@/components/dashboard/locked";
import { getPlanFeatures } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { submitReview, trackActivityAction, recordSourcingRequest } from "@/lib/supabase/actions";
import { useUser } from "@/lib/supabase/provider";
import { useI18n } from "@/lib/i18n";
import Navbar from "@/components/navbar/navbar";
import { useEffect } from "react";

interface SupplierDetailClientProps {
  supplier: any;
  initialReviews: any[];
  supplierId: string;
}

export default function SupplierDetailClient({ supplier, initialReviews, supplierId }: SupplierDetailClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { profile } = useUser();
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const plan = profile?.active_plan || "Free";
  const features = getPlanFeatures(plan);
  const ratingStats = [92, 75, 55, 30, 12];

  useEffect(() => {
    // Track page view (fire-and-forget)
    trackActivityAction("view_supplier", supplierId);
  }, [supplierId]);

  const handleAddReview = async () => {
    if (!newComment || submitting) return;
    setSubmitting(true);

    const result = await submitReview({
      type: "supplier",
      id: supplierId,
      rating: newRating,
      content: newComment,
    });

    if (result.success) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user?.id)
        .single();

      const newReview = {
        rating: newRating,
        content: newComment,
        created_at: new Date().toISOString(),
        profiles: profileData,
      };

      setReviews([newReview, ...reviews]);
      setNewComment("");
      setNewRating(5);
    } else {
      alert(result.error || "Failed to submit review");
    }

    setSubmitting(false);
  };

  const handleContact = async () => {
    if (!supplier || submitting) return;
    setSubmitting(true);

    // Open synchronously to avoid popup blocking
    const newTab = window.open("", "_blank");

    await recordSourcingRequest({
      supplier_id: supplier.id,
      notes: `Contacted via Supplier Page: ${supplier.name}`,
    });

    let contactUrl = supplier.contact_url || null;

    if (features.access.directContacts) {
      if (supplier.whatsapp) {
        const cleanPhone = supplier.whatsapp.replace(/\D/g, "");
        contactUrl = `https://wa.me/${cleanPhone}?text=Hello, I found you on Nexusply and I'm interested in your products.`;
      } else if (supplier.private_email) {
        contactUrl = `mailto:${supplier.private_email}?subject=Nexusply Sourcing Inquiry&body=Hello, I am interested in your products...`;
      }
    }

    if (contactUrl && newTab) {
      newTab.location.href = contactUrl;
    } else {
      if (newTab) newTab.close();
      alert(t.dashboardUi.supplier.noDirectContact);
    }

    setSubmitting(false);
  };

  const ds = t.dashboardUi.supplier;
  const reviewerName = (r: { profiles?: { full_name?: string | null; email?: string | null } | null }) =>
    r.profiles?.full_name || r.profiles?.email?.split("@")[0] || t.supplier.anonymous;

  return (
    <div className="editorial min-h-screen pb-24 selection:bg-red-500/30">
      <Navbar />

      <div className="mx-auto max-w-[1400px] px-4 pt-28 md:px-8">

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="group mb-10 inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.18em] text-stone transition hover:text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 transition group-hover:border-white/30">
            <ChevronLeft size={14} aria-hidden />
          </span>
          {t.supplier.backToResults}
        </button>

        {/* HERO */}
        <header className="grid items-end gap-10 border-b border-white/[0.08] pb-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <Reveal>
            <SectionLabel>
              {supplier.platform} <span className="text-stone-2">·</span> {supplier.category}
            </SectionLabel>
            <h1 className="mt-5 font-display text-5xl font-light leading-[1.02] tracking-[-0.02em] text-white text-balance sm:text-6xl lg:text-7xl">
              {supplier.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone">{supplier.description}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Chip icon={<TrendingUp size={13} className="text-red-500" />} text={t.supplier.trending} accent />
              <Chip icon={<ShieldCheck size={13} />} text={t.supplier.verified} />
              <Chip icon={<Truck size={13} />} text={t.supplier.fastFulfillment} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2">
              {supplier.image_url && !imageFailed ? (
                <img
                  src={supplier.image_url}
                  alt={supplier.name}
                  className="h-full w-full object-cover grayscale-[15%]"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(60%_60%_at_50%_40%,rgba(239,68,68,0.14),transparent)]">
                  <span className="font-display text-9xl font-light text-white/20">{supplier.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden />
            </div>
          </Reveal>
        </header>

        {/* KEY FIGURES */}
        <dl className="grid grid-cols-2 border-b border-white/[0.08] md:grid-cols-4">
          {[
            { label: t.supplier.minOrder, value: `${supplier.moq}`, unit: t.supplier.units },
            { label: ds.rating, value: `${supplier.rating}`, unit: "/ 5" },
            { label: ds.reviewCount, value: `${reviews.length}`, unit: "" },
            { label: t.supplier.delivery, value: "5–7", unit: ds.days },
          ].map((fig, i) => (
            <div
              key={fig.label}
              className={`px-5 py-8 ${i % 2 === 1 ? "border-l border-white/[0.08]" : ""} ${i >= 2 ? "border-t border-white/[0.08] md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <dt className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">{fig.label}</dt>
              <dd className="mt-3 font-display text-4xl font-light text-white">
                {fig.value} {fig.unit && <span className="font-text text-sm text-stone">{fig.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>

        {/* MAIN GRID */}
        <div className="mt-16 grid items-start gap-12 lg:grid-cols-12 lg:gap-16">

          {/* LEFT */}
          <div className="space-y-20 lg:col-span-8">

            {/* DIRECT CONTACT */}
            <section>
              <SectionHeader label={ds.contactLabel} title={t.supplier.factoryAccess}>
                {!features.access.directContacts && (
                  <span className="shrink-0 whitespace-nowrap rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.15em] text-red-500">
                    {t.supplier.premiumOnly}
                  </span>
                )}
              </SectionHeader>

              {features.access.directContacts ? (
                <div className="grid border-y border-white/[0.08] sm:grid-cols-3">
                  <ContactItem icon={<Phone size={15} />} label={t.supplier.whatsappPhone} value={supplier.whatsapp || t.common.unavailable} />
                  <ContactItem icon={<MessageCircle size={15} />} label={t.supplier.wechatId} value={supplier.wechat || t.common.unavailable} bordered />
                  <ContactItem icon={<Mail size={15} />} label={t.supplier.enterpriseEmail} value={supplier.private_email || t.common.unavailable} bordered />
                </div>
              ) : (
                <LockedPanel
                  title={t.supplier.unlockAccess}
                  description={t.supplier.unlockDesc}
                  ctaLabel={t.supplier.upgradeToPartner}
                  image="/landing/team.webp"
                />
              )}
            </section>

            {/* PORTFOLIO */}
            {supplier.supplied_products && (
              <section>
                <SectionHeader label={ds.portfolioLabel} title={ds.portfolioTitle} />
                <div className="flex flex-wrap gap-2">
                  {supplier.supplied_products.split(",").map((prod: string, i: number) => (
                    <span key={i} className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm leading-relaxed text-white/75">
                      {prod.trim()}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* INSIGHTS */}
            <section>
              <SectionHeader label={ds.insightsLabel} title={t.supplier.aiInsights} />
              <dl className="grid grid-cols-2 border-y border-white/[0.08] md:grid-cols-4">
                <Insight title={t.supplier.profitScore} value="92" subtext={t.supplier.excellent} progress={92} />
                <Insight title={t.supplier.estMargin} value="38%" subtext={t.supplier.aboveAverage} bordered />
                <Insight title={t.supplier.reliability} value={t.supplier.highReliability} subtext={`99.8% ${t.supplier.successRate}`} bordered />
                <Insight title={t.supplier.delivery} value="5–7" subtext={`${ds.days} · ${t.supplier.globalAvg}`} bordered />
              </dl>
            </section>

            {/* RATINGS + REVIEWS */}
            <section>
              <SectionHeader label={ds.reviewsLabel} title={t.supplier.ratings} />

              <div className="flex flex-col gap-10 md:flex-row md:items-center">
                <div className="md:w-48">
                  <p className="font-display text-7xl font-light tracking-[-0.03em] text-white">{supplier.rating}</p>
                  <Stars value={Math.round(supplier.rating)} className="mt-3" />
                  <p className="mt-2 text-sm text-stone">
                    {t.supplier.basedOn} {reviews.length} {t.supplier.reviews}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  {ratingStats.map((value, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-6 font-label text-xs text-stone">{5 - i}</span>
                      <div className="h-px flex-1 bg-white/10">
                        <div className="h-px bg-red-500" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-14">
                <p className="mb-4 font-label text-[10px] uppercase tracking-[0.18em] text-stone-2">{t.supplier.communityFeed}</p>
                {reviews.length === 0 ? (
                  <p className="border-y border-white/[0.08] py-10 text-center text-sm text-stone">{t.supplier.noReviews}</p>
                ) : (
                  <ul className="border-b border-white/[0.08]">
                    {reviews.map((r, i) => (
                      <li key={i} className="border-t border-white/[0.08] py-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 font-display text-base text-white">
                              {reviewerName(r)[0]?.toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm text-white">{reviewerName(r)}</p>
                              <p className="font-label text-[10px] text-stone-2">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Stars value={r.rating} small />
                        </div>
                        <p className="mt-4 font-display text-lg font-light italic leading-relaxed text-white/80">“{r.content}”</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT (sticky) */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
            <div className="rounded-2xl border border-red-500/25 bg-gradient-to-b from-red-500/[0.08] to-ink-2 p-7">
              <SectionLabel>{ds.contactLabel}</SectionLabel>
              <h3 className="mt-4 font-display text-3xl font-light text-white">{t.supplier.readyToSource}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone">{t.supplier.readyDesc}</p>
              <div className="mt-6 flex items-baseline justify-between border-y border-white/[0.08] py-4">
                <span className="text-sm text-stone">{t.supplier.minOrder}</span>
                <span className="font-display text-2xl font-light text-white">
                  {supplier.moq} <span className="font-text text-xs text-stone">{t.supplier.units}</span>
                </span>
              </div>
              <button
                onClick={handleContact}
                disabled={submitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500 py-3.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                <MessageSquare size={15} aria-hidden />
                {submitting ? t.common.loading : t.supplier.contact}
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-ink-2 p-7">
              <h3 className="font-display text-2xl font-light text-white">{t.supplier.rateExperience}</h3>
              <div className="mt-5 flex justify-center gap-1.5 border-y border-white/[0.08] py-4" role="radiogroup" aria-label={t.supplier.rateExperience}>
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={newRating === i + 1}
                    aria-label={`${i + 1}`}
                    onClick={() => setNewRating(i + 1)}
                    className="p-0.5 transition hover:scale-110"
                  >
                    <Star className={`h-6 w-6 ${i < newRating ? "fill-red-500 text-red-500" : "text-white/20 hover:text-white/40"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.supplier.ratePlaceholder}
                className="mt-5 h-28 w-full resize-none rounded-xl border border-white/10 bg-ink p-4 text-sm text-white placeholder:text-stone-2 transition focus:border-red-500/50 focus:outline-none"
              />
              <button
                onClick={handleAddReview}
                disabled={!newComment || submitting}
                className="mt-4 w-full rounded-full border border-white/15 py-3 text-sm text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t.common.loading : t.supplier.submitReview}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2 className="mt-3 font-display text-3xl font-light text-white sm:text-4xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ContactItem({ icon, label, value, bordered }: { icon: React.ReactNode; label: string; value: string; bordered?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 py-6 sm:px-6 ${bordered ? "border-t border-white/[0.08] sm:border-l sm:border-t-0" : "sm:pl-0"}`}>
      <span className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.15em] text-stone">
        <span className="text-red-500">{icon}</span>
        {label}
      </span>
      <span className="break-all font-label text-sm text-white">{value}</span>
    </div>
  );
}

function Chip({ icon, text, accent }: { icon: React.ReactNode; text: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
        accent ? "border-red-500/30 bg-red-500/10 text-white" : "border-white/10 text-white/70"
      }`}
    >
      {icon} {text}
    </span>
  );
}

function Insight({
  title,
  value,
  subtext,
  progress,
  bordered,
}: {
  title: string;
  value: string;
  subtext: string;
  progress?: number;
  bordered?: boolean;
}) {
  return (
    <div className={`px-5 py-7 ${bordered ? "border-l border-white/[0.08] [&:nth-child(3)]:border-l-0 [&:nth-child(3)]:border-t md:[&:nth-child(3)]:border-l md:[&:nth-child(3)]:border-t-0 [&:nth-child(4)]:border-t md:[&:nth-child(4)]:border-t-0" : ""}`}>
      <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone">{title}</dt>
      <dd className={`mt-3 font-display text-4xl font-light ${progress ? "text-red-500" : "text-white"}`}>{value}</dd>
      <dd className="mt-1 text-xs text-stone-2">{subtext}</dd>
      {progress !== undefined && (
        <div className="mt-4 h-px bg-white/10">
          <div className="h-px bg-red-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function Stars({ value, small, className = "" }: { value: number; small?: boolean; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`} aria-label={`${value} / 5`}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${small ? "h-3 w-3" : "h-4 w-4"} ${i < value ? "fill-red-500 text-red-500" : "text-white/15"}`} aria-hidden />
      ))}
    </div>
  );
}
