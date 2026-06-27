"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Star, ChevronLeft, ShieldCheck, Box, Truck,
  TrendingUp, Activity, MessageSquare, Award, Lock, Phone, MessageCircle, Mail, Package
} from "lucide-react";
import { getPlanFeatures } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { submitReview, trackActivityAction, recordSourcingRequest } from "@/lib/supabase/actions";
import { useUser } from "@/lib/supabase/provider";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
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
      alert("No direct contact method found. Please use the platform contact link.");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 pb-24">
      <Navbar />

      <div className="pt-28 px-4 md:px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">

        {/* NAVIGATION BAR */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all group mb-8"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ChevronLeft size={16} />
          </div>
          {t.supplier.backToResults}
        </button>

        {/* HERO HEADER */}
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
              {/* Image */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-white/10 border border-white/10 shrink-0 relative">
                <img
                  src={
                    supplier.image_url ||
                    `https://ui-avatars.com/api/?name=${supplier.name}&background=random`
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={supplier.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${supplier.name}&background=random`;
                  }}
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {supplier.name}
                  </h1>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <TrendingUp size={14} /> {t.supplier.trending}
                  </span>
                </div>

                <p className="text-gray-400 font-medium flex items-center justify-center md:justify-start gap-2">
                  <GlobeIcon /> {supplier.platform}{" "}
                  <span className="text-gray-600">•</span> {supplier.category}
                </p>

                <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                  <Badge icon={<Box size={14} />} text={`${t.supplier.moq}: ${supplier.moq} ${t.supplier.units}`} />
                  <Badge icon={<ShieldCheck size={14} className="text-green-400" />} text={t.supplier.verified} />
                  <Badge icon={<Truck size={14} />} text={t.supplier.fastFulfillment} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-300 mt-8 text-sm leading-relaxed max-w-4xl relative z-10 text-center md:text-left">
            {supplier.description}
          </p>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN (8 cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* DIRECT CONTACT INFO (LOCKED) */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold">{t.supplier.factoryAccess}</h2>
                </div>
                {!features.access.directContacts && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20 uppercase tracking-widest">
                    {t.supplier.premiumOnly}
                  </span>
                )}
              </div>

              {features.access.directContacts ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <ContactItem icon={<Phone size={18} />} label={t.supplier.whatsappPhone} value={supplier.whatsapp || t.common.unavailable} />
                  <ContactItem icon={<MessageCircle size={18} />} label={t.supplier.wechatId} value={supplier.wechat || t.common.unavailable} />
                  <ContactItem icon={<Mail size={18} />} label={t.supplier.enterpriseEmail} value={supplier.private_email || t.common.unavailable} />
                </div>
              ) : (
                <div className="text-center py-10 relative">
                  <div className="absolute inset-0 backdrop-blur-md bg-black/20 z-0 rounded-2xl"></div>
                  <div className="relative z-10">
                    <Lock className="mx-auto text-gray-600 mb-4" size={32} />
                    <h3 className="text-xl font-bold mb-2">{t.supplier.unlockAccess}</h3>
                    <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">{t.supplier.unlockDesc}</p>
                    <Link
                      href="/dashboard/profile?tab=plan"
                      className="px-8 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      {t.supplier.upgradeToPartner}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* PRODUCT PORTFOLIO */}
            {supplier.supplied_products && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold">{t.supplier.indexedPortfolio}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {supplier.supplied_products.split(",").map((prod: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-gray-300 hover:border-red-500/30 transition-all cursor-default"
                    >
                      {prod.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI INSIGHTS */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-red-500" size={20} />
                <h2 className="text-lg font-semibold">{t.supplier.aiInsights}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InsightCard title={t.supplier.profitScore} value="92" highlight={true} subtext={t.supplier.excellent} />
                <InsightCard title={t.supplier.estMargin} value="38%" subtext={t.supplier.aboveAverage} />
                <InsightCard title={t.supplier.reliability} value={t.supplier.highReliability} subtext={`99.8% ${t.supplier.successRate}`} />
                <InsightCard title={t.supplier.delivery} value="5–7 days" subtext={t.supplier.globalAvg} />
              </div>
            </div>

            {/* RATING & STATS */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-8">
                <Award className="text-gray-400" size={20} />
                <h2 className="text-lg font-semibold">{t.supplier.ratings}</h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                  <span className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                    {supplier.rating}
                  </span>
                  <div className="flex mt-2 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(supplier.rating)
                            ? "text-red-500 fill-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            : "text-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm font-medium">
                    {t.supplier.basedOn} {reviews.length} {t.supplier.reviews}
                  </p>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {ratingStats.map((value, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-8 text-xs font-medium text-gray-400">
                        {5 - i} <Star size={10} className="fill-gray-400" />
                      </div>
                      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* REVIEWS FEED */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-8">
                <MessageSquare className="text-gray-400" size={20} />
                <h2 className="text-lg font-semibold">{t.supplier.communityFeed}</h2>
              </div>

              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8 italic">{t.supplier.noReviews}</p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={i} className="bg-black/30 p-5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-[10px] font-bold border border-red-500/20">
                            {(r.profiles?.full_name || r.profiles?.email)?.[0]?.toUpperCase()}
                          </div>
                          <p className="font-bold text-sm text-gray-200">
                            {r.profiles?.full_name ||
                              r.profiles?.email?.split("@")[0] ||
                              t.supplier.anonymous}
                          </p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={`w-3 h-3 ${
                                j < r.rating ? "text-red-500 fill-red-500" : "text-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed italic">&quot;{r.content}&quot;</p>
                      <p className="text-[10px] text-gray-600 mt-3">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (4 cols) - STICKY */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <MessageSquare size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-1">{t.supplier.readyToSource}</h3>
              <p className="text-sm text-gray-400 mb-6">{t.supplier.readyDesc}</p>
              <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5 flex justify-between items-center">
                <span className="text-sm text-gray-400">{t.supplier.minOrder}</span>
                <span className="font-bold text-white">
                  {supplier.moq} {t.supplier.units}
                </span>
              </div>
              <button
                onClick={handleContact}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.8)] hover:bg-red-600 transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? t.common.loading : t.supplier.contact}
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <h3 className="text-md font-semibold mb-4">{t.supplier.rateExperience}</h3>
              <div className="flex gap-1.5 mb-5 justify-center bg-black/30 py-3 rounded-xl border border-white/5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    onClick={() => setNewRating(i + 1)}
                    className={`w-6 h-6 cursor-pointer transition-all hover:scale-110 ${
                      i < newRating
                        ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                        : "text-gray-600 hover:text-gray-400"
                    }`}
                  />
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.supplier.ratePlaceholder}
                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all resize-none h-28 mb-4"
              />
              <button
                onClick={handleAddReview}
                disabled={!newComment || submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? t.common.loading : t.supplier.submitReview}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2 group hover:border-red-500/30 transition-all">
      <div className="flex items-center gap-2 text-gray-500 group-hover:text-red-500 transition-colors">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-white font-mono text-sm break-all">{value}</p>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
      {icon} {text}
    </span>
  );
}

function InsightCard({
  title,
  value,
  subtext,
  highlight = false,
}: {
  title: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between h-full">
      <p className="text-gray-400 text-xs font-medium mb-2">{title}</p>
      <div>
        <p className={`font-bold text-2xl tracking-tight mb-1 ${highlight ? "text-red-500" : "text-white"}`}>
          {value}
        </p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{subtext}</p>
      </div>
      {highlight && (
        <div className="h-1 mt-3 bg-black rounded-full overflow-hidden">
          <div className="h-full bg-red-500 w-[92%] shadow-[0_0_8px_rgba(239,68,68,1)]" />
        </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" x2="22" y1="12" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
