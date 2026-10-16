"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Star, ChevronLeft, TrendingUp, AlertCircle, Truck, Package, MessageSquare, Loader2, ArrowDown,
} from "lucide-react";
import { SectionLabel } from "@/components/landing/primitives";
import Navbar from "@/components/navbar/navbar";
import SupplierCard from "@/components/dashboard/supplier-card";
import ProfitCalculator from "@/components/dashboard/profit-calculator";
import { supabase } from "@/lib/supabase/client";
import { submitReview, trackActivityAction, recordSourcingRequest } from "@/lib/supabase/actions";
import { useUser } from "@/lib/supabase/provider";
import { useI18n } from "@/lib/i18n";
import { getPlanFeatures } from "@/lib/plans";

export default function ProductDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  
  const router = useRouter();
  const { t } = useI18n();
  const supplierRef = useRef<HTMLDivElement | null>(null);
  const { profile, loading: userLoading } = useUser();
  
  const [product, setProduct] = useState<any>(null);
  const [matchedSuppliers, setMatchedSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const fetchProductData = useCallback(async () => {
    if (!id) return;
    
    // UUID regex check (any version)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn(`ProductDetailPage: Invalid UUID format for ID: ${id}`);
      setError(`Invalid ID format: ${id}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Product
      const { data: prod, error: dbError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (dbError) {
        console.error("Supabase error fetching product:", dbError);
        setError(`Database error: ${dbError.message}`);
        setLoading(false);
        return;
      }

      if (!prod) {
        console.warn(`Product not found for ID: ${id}`);
        setLoading(false);
        return;
      }

      setProduct({
        ...prod,
        profitScore: prod.ai_score || 0,
        trend: 15,
        competition: "Low",
        buyPrice: prod.buy_price || 0,
        sellPrice: prod.sell_price || 0,
        delivery: "5–7 days",
        description: prod.description || "High-demand analyzed product with strong market traction and solid profit potential."
      });

      // Track Activity
      trackActivityAction('view_product', id);

      // 2. Fetch Matched Suppliers
      let sups = [];
      try {
        // Try searching for the product name in suppliers first (Dynamic Indexing)
        const { data: searchSups } = await supabase
          .from('suppliers')
          .select('*')
          .textSearch('search_vector', prod.name, {
            type: 'websearch',
            config: 'english'
          })
          .limit(4);
        
        if (searchSups && searchSups.length > 0) {
          sups = searchSups;
        } else if (prod.category) {
          // Fallback to category if name search fails
          const { data: catSups } = await supabase
            .from('suppliers')
            .select('*')
            .eq('category', prod.category)
            .limit(4);
          sups = catSups || [];
        }
      } catch (err) {
        console.error("Error in live indexing suppliers:", err);
      }
      
      setMatchedSuppliers(sups);

      // 3. Fetch Reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('*, profiles(email, full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      
      setReviews(revs || []);
    } catch (err: any) {
      console.error("Unexpected error fetching product data:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();

    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [fetchProductData]);

  const handleAddReview = async () => {
    if (!newComment || submitting) return;
    setSubmitting(true);
    
    const result = await submitReview({
      type: 'product',
      id: id as string,
      rating: newRating,
      content: newComment
    });

    if (result.success) {
      // Refresh reviews locally for immediate feedback
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase.from('profiles').select('email, full_name').eq('id', user?.id).single();
      
      const newReview = {
        rating: newRating,
        content: newComment,
        created_at: new Date().toISOString(),
        profiles: profileData
      };
      
      setReviews([newReview, ...reviews]);
      setNewComment("");
      setNewRating(5);
    } else {
      alert(result.error || "Failed to submit review");
    }
    
    setSubmitting(false);
  };

  const handleStartSourcing = async () => {
    // 1. Track activity
    trackActivityAction('view_product', id, { intent: 'start_sourcing' });
    
    // 2. Scroll to suppliers
    supplierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContactSupplier = async (supplier: any) => {
    if (submitting) return;
    setSubmitting(true);

    // Open synchronously to avoid popup blocking
    const newTab = window.open('', '_blank');

    const plan = profile?.active_plan || "Free";
    const features = getPlanFeatures(plan);

    await recordSourcingRequest({
      supplier_id: supplier.id,
      product_id: product.id,
      notes: `Contacted via Product Page: ${product.name}`
    });

    let contactUrl = supplier.contact_url;

    if (features.access.directContacts) {
       if (supplier.whatsapp) {
          const cleanPhone = supplier.whatsapp.replace(/\D/g, '');
          contactUrl = `https://wa.me/${cleanPhone}?text=Hello, I found you on Nexusply and I'm interested in sourcing "${product.name}".`;
       } else if (supplier.private_email) {
          contactUrl = `mailto:${supplier.private_email}?subject=Nexusply Sourcing Inquiry: ${product.name}&body=Hello, I am interested in sourcing "${product.name}"...`;
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

  if ((loading && !product) || userLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <Loader2 className="h-8 w-8 animate-spin text-red-500" />
    </div>
  );

  if (!product) return (
    <div className="editorial flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <span className="mb-6 grid h-12 w-12 place-items-center rounded-full border border-white/10">
        <AlertCircle size={20} className="text-red-500" />
      </span>
      <h1 className="mb-3 font-display text-4xl font-light">{t.product.productNotFound}</h1>
      <p className="mb-8 max-w-md text-stone">
        {error ? error : t.product.productNotFoundDesc.replace("{id}", id || "unknown")}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => router.push("/dashboard/winning-products")}
          className="rounded-full bg-red-500 px-7 py-3 text-sm font-medium text-white transition hover:bg-red-600"
        >
          {t.product.browseAllProducts}
        </button>
        <button
          onClick={() => fetchProductData()}
          className="rounded-full border border-white/15 px-7 py-3 text-sm text-white transition hover:border-white/30"
        >
          {t.product.tryAgain}
        </button>
      </div>
    </div>
  );

  const fp = t.featureUi.product;
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
          {t.product.backToProducts}
        </button>

        {/* HERO */}
        <header className="grid items-center gap-10 border-b border-white/[0.08] pb-12 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(70%_70%_at_50%_45%,rgba(255,255,255,0.06),transparent)]">
            {product.image_url && !imageFailed ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-8"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-16 w-16 text-white/10" aria-hidden />
              </div>
            )}
          </div>

          <div>
            <SectionLabel>
              {fp.eyebrow}
              {product.category ? <> <span className="text-stone-2">·</span> {product.category}</> : null}
            </SectionLabel>
            <h1 className="mt-5 font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] text-white text-balance sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone">{product.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {product.demand && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-white">
                  <TrendingUp size={13} className="text-red-500" /> {product.demand} {t.product.demandLevel}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70">
                <Truck size={13} /> {product.delivery}
              </span>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleStartSourcing}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-7 py-3 text-sm font-medium text-white transition hover:bg-red-600"
              >
                {t.product.beginSourcing} <ArrowDown size={15} aria-hidden />
              </button>
            </div>
          </div>
        </header>

        {/* KEY FIGURES */}
        <dl className="grid grid-cols-2 border-b border-white/[0.08] md:grid-cols-4">
          {[
            { label: t.product.profitScore, value: `${product.profitScore}`, accent: true },
            { label: t.product.marketTrend, value: `+${product.trend}%` },
            { label: t.product.competition, value: product.competition === "Low" ? t.product.low : product.competition },
            { label: t.product.avgDelivery, value: product.delivery },
          ].map((fig, i) => (
            <div
              key={fig.label}
              className={`px-5 py-8 ${i % 2 === 1 ? "border-l border-white/[0.08]" : ""} ${i >= 2 ? "border-t border-white/[0.08] md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <dt className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">{fig.label}</dt>
              <dd className={`mt-3 font-display text-3xl font-light sm:text-4xl ${fig.accent ? "text-red-500" : "text-white"}`}>{fig.value}</dd>
              {fig.accent && (
                <div className="mt-4 h-px bg-white/10">
                  <div className="h-px bg-red-500" style={{ width: `${Math.min(100, Number(product.profitScore) || 0)}%` }} />
                </div>
              )}
            </div>
          ))}
        </dl>

        {/* MAIN GRID */}
        <div className="mt-16 grid items-start gap-12 lg:grid-cols-12 lg:gap-16">

          {/* LEFT */}
          <div className="space-y-20 lg:col-span-8">

            {/* CALCULATOR */}
            <section>
              <div className="mb-8">
                <SectionLabel>{fp.insightsLabel}</SectionLabel>
                <h2 className="mt-3 font-display text-3xl font-light text-white sm:text-4xl">{t.product.intelligenceCore}</h2>
              </div>
              <ProfitCalculator buyPrice={product.buyPrice} sellPrice={product.sellPrice} />
            </section>

            {/* MATCHED SUPPLIERS */}
            <section ref={supplierRef} className="scroll-mt-28">
              <div className="mb-8 flex items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <SectionLabel>{fp.suppliersLabel}</SectionLabel>
                  <h2 className="mt-3 font-display text-3xl font-light text-white sm:text-4xl">{t.product.verifiedSuppliers}</h2>
                </div>
                <span className="font-label text-xs text-stone">{matchedSuppliers.length} {t.common.results}</span>
              </div>

              {matchedSuppliers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
                  <p className="text-stone">{t.product.noSuppliers}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {matchedSuppliers.map((supplier, i) => (
                    <SupplierCard key={supplier.id ?? i} supplier={supplier} onContact={handleContactSupplier} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT (sticky) */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
            <div className="rounded-2xl border border-red-500/25 bg-gradient-to-b from-red-500/[0.08] to-ink-2 p-7">
              <SectionLabel>{fp.sourcingLabel}</SectionLabel>
              <h3 className="mt-4 font-display text-3xl font-light text-white">{t.product.sourceThisProduct}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone">{t.product.sourceThisProductDesc}</p>
              <button
                onClick={handleStartSourcing}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-500 py-3.5 text-sm font-medium text-white transition hover:bg-red-600"
              >
                {t.product.viewMatchingSuppliers} <ArrowDown size={15} aria-hidden />
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-ink-2 p-7">
              <SectionLabel>{fp.reviewsLabel}</SectionLabel>
              <h3 className="mt-4 flex items-center gap-2 font-display text-2xl font-light text-white">
                <MessageSquare size={16} className="text-stone" aria-hidden /> {t.product.communityInsights}
              </h3>

              <div className="mt-5 border-b border-white/[0.08]">
                {reviews.length === 0 ? (
                  <p className="border-t border-white/[0.08] py-6 text-center text-sm text-stone">{t.supplier.noReviews}</p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={i} className="border-t border-white/[0.08] py-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-white">{reviewerName(r)}</p>
                        <div className="flex gap-0.5" aria-label={`${r.rating} / 5`}>
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`h-3 w-3 ${j < r.rating ? "fill-red-500 text-red-500" : "text-white/15"}`} aria-hidden />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 font-display text-base font-light italic leading-relaxed text-white/80">“{r.content}”</p>
                    </div>
                  ))
                )}
              </div>

              {/* Review input */}
              <div className="pt-6">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-stone-2">{t.product.addInsight}</p>
                <div className="mt-3 flex gap-1" role="radiogroup" aria-label={t.product.addInsight}>
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
                      <Star className={`h-5 w-5 ${i < newRating ? "fill-red-500 text-red-500" : "text-white/20 hover:text-white/40"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.product.insightPlaceholder}
                  className="mt-4 h-24 w-full resize-none rounded-xl border border-white/10 bg-ink p-4 text-sm text-white placeholder:text-stone-2 transition focus:border-red-500/50 focus:outline-none"
                />
                <button
                  onClick={handleAddReview}
                  disabled={!newComment || submitting}
                  className="mt-4 w-full rounded-full border border-white/15 py-3 text-sm text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? t.common.loading : t.product.submitInsight}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
