"use client";

import Navbar from "@/components/navbar/navbar";
import { Search, Loader2, X, ArrowRight } from "lucide-react";
import ProductCard from "@/components/dashboard/product-card";
import Recommendations from "@/components/dashboard/recommendations";
import { getPlanFeatures } from "@/lib/plans";
import { DisplayHeading, Reveal, SectionLabel } from "@/components/landing/primitives";
import { LockedNotice, LockedPanel, LockedTile } from "@/components/dashboard/locked";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { searchProductsAction } from "@/lib/supabase/actions";

interface WinningProductsClientProps {
  products: any[];
  profile: any;
}

export default function WinningProductsClient({ products, profile }: WinningProductsClientProps) {
  const { t, lang } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  if (!t) return null;

  const features = getPlanFeatures(profile?.active_plan);

  // If the plan has a winning-products limit of 0, the server already returned
  // an empty array. We gate the entire UI here as well so the user sees a
  // clear upgrade prompt instead of an empty list.
  const winningLocked = features.winningProducts.limit === 0;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const results = await searchProductsAction(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };
  
  // Apply limit based on plan (server already enforced for getProducts;
  // this acts as the UX layer for search results and display slicing).
  const baseProducts = searchResults || products;
  const visibleLimit = features.winningProducts.limit === 'unlimited' ? baseProducts.length : features.winningProducts.limit;
  const visibleProducts = winningLocked ? [] : baseProducts.slice(0, visibleLimit as number);
  const lockedProducts = winningLocked ? [] : baseProducts.slice(visibleLimit as number);

  const top5 = visibleProducts.slice(0, 5);
  const rest = visibleProducts.slice(5);

  const w = t.featureUi.winning;
  const planName = features.name[lang] || features.name.EN;

  return (
    <div className="editorial min-h-screen selection:bg-red-500/30">
      <Navbar />

      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 md:px-8">

        {/* HEADER */}
        <Reveal className="mb-16 max-w-3xl">
          <SectionLabel>{w.eyebrow}</SectionLabel>
          <DisplayHeading as="h1" className="mt-5 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {t.navbar.winning}
          </DisplayHeading>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone">{t.dashboard.subtitle}</p>

          {/* Search — hidden when entirely locked */}
          {!winningLocked && (
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
                placeholder={w.searchPlaceholder}
                aria-label={t.common.search}
                className="w-full rounded-full border border-white/10 bg-ink-2 py-4 pl-14 pr-28 text-base text-white placeholder:text-stone-2 transition focus:border-red-500/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label={t.dashboardUi.clearSearch}
                    className="grid h-9 w-9 place-items-center rounded-full text-stone transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
                <button type="submit" aria-label={t.common.search} className="grid h-10 w-10 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600">
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {features.winningProducts.delay > 0 && !winningLocked && (
            <LockedNotice className="mt-6">
              {w.delayNote.replace("{h}", String(features.winningProducts.delay))}{" "}
              <Link href="/dashboard/profile?tab=plan" className="font-medium text-red-500 underline-offset-4 hover:underline">
                {t.featureUi.seePlans}
              </Link>
            </LockedNotice>
          )}
        </Reveal>

        {/* FULLY LOCKED */}
        {winningLocked && (
          <LockedPanel
            label={t.featureUi.lockedLabel}
            title={w.lockedTitle}
            description={w.lockedDesc.replace("{plan}", planName)}
            ctaLabel={t.featureUi.seePlans}
            image="/landing/parcels.webp"
          />
        )}

        {/* RECOMMENDATIONS (not searching, not locked) */}
        {!searchResults && !winningLocked && (
          <div className="mb-16">
            <Recommendations type="product" />
          </div>
        )}

        {/* TOP 5 */}
        {!winningLocked && (
          <section className="mb-20">
            <div className="mb-8 border-b border-white/[0.08] pb-5">
              <SectionLabel>{searchResults ? t.common.search : w.eyebrow}</SectionLabel>
              <h2 className="mt-3 font-display text-3xl font-light text-white">{searchResults ? w.topResults : w.topFive}</h2>
            </div>

            {top5.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {top5.map((product: any, index: number) => (
                  <ProductCard key={product.id || index} product={{ ...product, rank: !searchResults ? index + 1 : undefined }} />
                ))}
                {!searchResults && top5.length < 5 && Array.from({ length: 5 - top5.length }).map((_, i) => (
                  <LockedTile key={`locked-top-${i}`} label={w.lockedProduct} description={w.lockedProductDesc} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
                <p className="text-stone">{w.noProducts}</p>
              </div>
            )}
          </section>
        )}

        {/* EMERGING */}
        {!winningLocked && rest.length > 0 && (
          <section>
            <div className="mb-8 border-b border-white/[0.08] pb-5">
              <SectionLabel>{t.common.recommended}</SectionLabel>
              <h2 className="mt-3 font-display text-3xl font-light text-white">{w.emerging}</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {rest.map((product: any, index: number) => (
                <ProductCard key={product.id || index} product={product} />
              ))}
              {!searchResults && lockedProducts.length > 0 && lockedProducts.map((_, i) => (
                <LockedTile key={`locked-rest-${i}`} label={w.lockedProduct} description={w.lockedProductDesc} />
              ))}
            </div>
          </section>
        )}

        {/* PARTIAL LOCK CTA */}
        {!winningLocked && !searchResults && lockedProducts.length > 0 && (
          <LockedPanel
            className="mt-20"
            title={w.unlockMoreTitle.replace("{n}", String(lockedProducts.length))}
            description={w.unlockMoreDesc.replace("{plan}", planName)}
            ctaLabel={t.featureUi.seePlans}
            image="/landing/parcels.webp"
          />
        )}
      </div>
    </div>
  );
}
