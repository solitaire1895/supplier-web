"use client";

import Navbar from "@/components/navbar/navbar";
import SupplierCard from "@/components/dashboard/supplier-card";
import FilterSidebar from "@/components/dashboard/filter-sidebar";
import Recommendations from "@/components/dashboard/recommendations";
import { Search, Zap, ChevronDown, Lock, Loader2, X, ArrowRight } from "lucide-react";
import { DisplayHeading, Reveal, SectionLabel } from "@/components/landing/primitives";
import { LockedPanel, LockedTile } from "@/components/dashboard/locked";
import { getPlanFeatures } from "@/lib/plans";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useCallback } from "react";
import { searchSuppliersAction, recordSourcingRequest } from "@/lib/supabase/actions";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentStatusBanner from "@/components/dashboard/payment-status-banner";

interface DashboardClientProps {
  suppliers: any[];
  stats: any;
  profile: any;
}

export default function DashboardClient({ suppliers, stats, profile }: DashboardClientProps) {
  const { t, lang } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const results = await searchSuppliersAction(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, [searchParams, performSearch]);

  if (!t) return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <Zap className="text-red-500 animate-pulse" size={48} />
    </div>
  );

  const features = getPlanFeatures(profile?.active_plan);

  const supplierLimit = features.access.supplierLimit;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
    
    performSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleContactSupplier = async (supplier: any) => {
    if (submitting) return;
    setSubmitting(true);

    const plan = profile?.active_plan || "free";
    const planFeatures = getPlanFeatures(plan);

    // Resolve the contact URL synchronously before any async work
    let contactUrl: string | null = supplier.contact_url || null;

    if (planFeatures.access.directContacts) {
      if (supplier.whatsapp) {
        const cleanPhone = supplier.whatsapp.replace(/\D/g, '');
        contactUrl = `https://wa.me/${cleanPhone}?text=Hello, I found you on Nexusply and I'm interested in your services.`;
      } else if (supplier.private_email) {
        contactUrl = `mailto:${supplier.private_email}?subject=Nexusply Sourcing Inquiry&body=Hello, I am interested in your services...`;
      }
    }

    if (contactUrl) {
      // Open and immediately navigate — must happen synchronously in the user gesture
      // to avoid popup blockers. Fire the async tracking after.
      const newTab = window.open(contactUrl, '_blank');

      // Fire-and-forget: record after navigation so it never blocks the UX
      recordSourcingRequest({
        supplier_id: supplier.id,
        notes: `Contacted via Dashboard Discovery Grid: ${supplier.name}`
      }).catch((err) => console.error("recordSourcingRequest error:", err));

      // If the browser blocked the popup, fall back to same-tab navigation
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        router.push(`/dashboard/suppliers/${supplier.id}`);
      }
    } else {
      // No contact URL available — go to the supplier detail page instead
      recordSourcingRequest({
        supplier_id: supplier.id,
        notes: `Viewed via Dashboard Discovery Grid: ${supplier.name}`
      }).catch((err) => console.error("recordSourcingRequest error:", err));

      router.push(`/dashboard/suppliers/${supplier.id}`);
    }

    setSubmitting(false);
  };

  const baseSuppliers = searchResults || suppliers;
  const filteredSuppliers = baseSuppliers.filter(s => {
    if (features.access.suppliers === 'platforms' && s.platform === 'Direct') return false;
    if (!features.access.tablets && s.category === 'Tablets') return false;
    if (features.access.computers === 'none' && s.category === 'Computers') return false;
    return true;
  });

  const displaySuppliers = filteredSuppliers.slice(0, 12);

  const isLimited = supplierLimit !== 'unlimited';
  const lockedCount = isLimited && !searchResults ? 3 : 0;

  const d = t.dashboardUi;
  const planName = features.name[lang] || features.name.EN;

  const statItems = [
    { label: t.dashboard.stats.suppliers, value: stats.suppliers.toString() },
    { label: t.dashboard.stats.favorites, value: stats.favorites.toString() },
    { label: t.dashboard.stats.avgMoq, value: "75" },
    { label: t.dashboard.stats.topCategory, value: d.categories.Electronics },
  ];

  return (
    <div className="editorial min-h-screen selection:bg-red-500/30">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 md:px-8">

        <PaymentStatusBanner />

        {/* HEADER & SEARCH */}
        <Reveal className="mb-14 max-w-3xl">
          <SectionLabel>{d.eyebrow}</SectionLabel>
          <DisplayHeading as="h1" className="mt-5 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {t.dashboard.title}
          </DisplayHeading>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone">{t.dashboard.subtitle}</p>

          <form onSubmit={handleSearch} role="search" className="group relative mt-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
              {searching ? (
                <Loader2 className="animate-spin text-red-500" size={18} />
              ) : (
                <Search className="text-stone transition-colors group-focus-within:text-red-500" size={18} />
              )}
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.dashboard.searchPlaceholder}
              aria-label={t.common.search}
              className="w-full rounded-full border border-white/10 bg-ink-2 py-4 pl-14 pr-28 text-base text-white placeholder:text-stone-2 transition focus:border-red-500/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={d.clearSearch}
                  className="grid h-9 w-9 place-items-center rounded-full text-stone transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                aria-label={t.common.search}
                className="grid h-10 w-10 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </Reveal>

        {/* STATS (hairline grid) */}
        <div className="mb-16 grid min-w-0 grid-cols-2 border-y border-white/[0.08] md:grid-cols-4">
          {statItems.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-5 py-8 md:py-10 ${i % 2 === 1 ? "border-l border-white/[0.08]" : ""} ${i >= 2 ? "border-t border-white/[0.08] md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <p className="break-words font-display text-2xl font-light tracking-[-0.02em] text-white min-[400px]:text-3xl sm:text-4xl lg:text-5xl">{stat.value}</p>
              <p className="mt-3 font-label text-[10px] uppercase tracking-[0.18em] text-stone">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* RECOMMENDATIONS (hidden while searching) */}
        {!searchResults && (
          <div className="mb-10">
            <Recommendations type="supplier" />
          </div>
        )}

        {/* SIDEBAR + GRID */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr]">

          <aside className="no-scrollbar sticky top-28 z-10 hidden h-[calc(100vh-140px)] overflow-y-auto lg:block">
            <FilterSidebar />

            {/* PLAN UPSELL */}
            {(features.access.suppliers === "platforms" || isLimited) && (
              <div className="mt-6 rounded-2xl border border-red-500/25 bg-gradient-to-b from-red-500/[0.08] to-ink-2 p-6">
                <Lock className="mb-4 text-red-500" size={18} aria-hidden />
                <h3 className="font-display text-xl font-light text-white">{t.dashboard.lockedTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{t.dashboard.lockedDesc}</p>
                <Link
                  href="/dashboard/profile?tab=plan"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-red-500 transition hover:text-red-400"
                >
                  {d.upgradeNow} <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            )}
          </aside>

          <main className="flex min-w-0 flex-col">

            <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end">
              <div>
                <SectionLabel>{searchResults ? t.common.search : t.common.recommended}</SectionLabel>
                <h2 className="mt-3 flex flex-wrap items-baseline gap-x-3 font-display text-3xl font-light text-white">
                  {searchResults ? d.searchResults : t.dashboard.discoveryGrid}
                  <span className="font-label text-xs text-stone">
                    {filteredSuppliers.length} {t.common.results}
                  </span>
                </h2>
              </div>

              <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/20 hover:text-white">
                {t.common.sortBy}: {t.common.recommended} <ChevronDown size={14} className="text-stone" aria-hidden />
              </button>
            </div>

            {/* SUPPLIERS GRID */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {displaySuppliers.length > 0 ? (
                displaySuppliers.map((supplier, i) => (
                  <div
                    key={supplier.id ?? i}
                    className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                  >
                    <SupplierCard supplier={supplier} onContact={handleContactSupplier} />
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-20 text-center">
                  <p className="text-stone">{d.noSuppliers}</p>
                </div>
              )}

              {/* Locked placeholders */}
              {!searchResults && lockedCount > 0 && Array.from({ length: lockedCount }).map((_, i) => (
                <LockedTile key={`locked-supplier-${i}`} label={t.dashboard.lockedSupplier} description={t.dashboard.lockedSupplierDesc} className="min-h-[360px]" />
              ))}
            </div>

            {/* Load more */}
            {!searchResults && displaySuppliers.length < filteredSuppliers.length && (
              <div className="mt-12 flex justify-center">
                <button className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/80 transition hover:border-white/30 hover:text-white">
                  {t.common.loadMore}
                </button>
              </div>
            )}

            {/* Upgrade CTA when the supplier limit applies */}
            {!searchResults && isLimited && (
              <LockedPanel
                className="mt-14"
                title={d.unlockTitle}
                description={d.unlockDesc.replace("{plan}", planName)}
                ctaLabel={d.upgradeNow}
              />
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
