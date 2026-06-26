"use client";

import Navbar from "@/components/navbar/navbar";
import { Flame, Lock, Search, Loader2, X } from "lucide-react";
import ProductCard from "@/components/dashboard/product-card";
import Recommendations from "@/components/dashboard/recommendations";
import { getPlanFeatures } from "@/lib/plans";
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      <Navbar />

      <div className="pt-28 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">

        {/* HERO HEADER */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
            {t.navbar.winning}
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <Flame size={28} className="text-red-500" />
            </div>
          </h1>
          <p className="text-gray-400 mt-4 text-base md:text-lg max-w-2xl">
            {t.dashboard.subtitle}
          </p>
          
          {/* Search Bar — disabled/hidden when entirely locked */}
          {!winningLocked && (
            <form onSubmit={handleSearch} className="relative group max-w-3xl mt-10">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                {searching ? (
                  <Loader2 className="text-red-500 animate-spin" size={20} />
                ) : (
                  <Search className="text-gray-400 group-focus-within:text-red-500 transition-colors duration-300" size={20} />
                )}
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search winning products by niche, name, or category..."
                className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl py-4 pl-14 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all text-sm md:text-base"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={clearSearch}
                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          )}

          {features.winningProducts.delay > 0 && !winningLocked && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl inline-flex items-center gap-3">
              <Lock size={18} className="text-red-500" />
              <p className="text-sm font-medium text-red-400">
                Your plan has a {features.winningProducts.delay}h delay on new winners. <Link href="/dashboard/profile?tab=plan" className="underline font-bold hover:text-red-300 transition-colors ml-1">{t.common.upgrade} to Importateur</Link> for instant access.
              </p>
            </div>
          )}
        </div>

        {/* FULLY LOCKED STATE — shown when plan has 0 winning products */}
        {winningLocked && (
          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 inline-flex mb-6">
                <Lock className="text-red-500" size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-4">Winning Products Are Locked</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
                Your current <span className="text-white font-semibold">{features.name.EN}</span> plan does not include access to winning product intelligence. Upgrade to start discovering high-margin products updated in real-time.
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

        {/* RECOMMENDATIONS (Show if not searching and not fully locked) */}
        {!searchResults && !winningLocked && (
          <div className="mb-20">
            <Recommendations type="product" />
          </div>
        )}

        {/* TOP 5 SECTION */}
        {!winningLocked && (
          <div className="mb-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-red-500/5 rounded-[100%] blur-[120px] pointer-events-none z-0"></div>

            <div className="relative z-10 flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">{searchResults ? "Top Results" : "The Top 5"}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent"></div>
            </div>

            {top5.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
                {top5.map((product: any, index: number) => (
                  <ProductCard
                    key={product.id || index}
                    product={{ ...product, rank: !searchResults ? index + 1 : undefined }}
                  />
                ))}
                
                {/* Locked placeholders if limit is low */}
                {!searchResults && top5.length < 5 && Array.from({ length: 5 - top5.length }).map((_, i) => (
                  <LockedCard key={`locked-top-${i}`} t={t} />
                ))}
              </div>
            ) : (
              <div className="relative z-10 bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-20 text-center">
                <p className="text-gray-400">No products found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* REST OF OPPORTUNITIES */}
        {!winningLocked && rest.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Emerging Opportunities</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {rest.map((product: any, index: number) => (
                <ProductCard key={product.id || index} product={product} />
              ))}
              
              {/* Show locked cards for the rest of the available products */}
              {!searchResults && lockedProducts.length > 0 && lockedProducts.map((_, i) => (
                <LockedCard key={`locked-rest-${i}`} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* UPGRADE CTA SECTION FOR PARTIALLY LOCKED PRODUCTS */}
        {!winningLocked && !searchResults && lockedProducts.length > 0 && (
          <div className="mt-20 bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Unlock {lockedProducts.length}+ More Winning Products</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                You are currently viewing limited products on the {features.name.EN} plan. Upgrade to access our full intelligence database updated in real-time.
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

      </div>
    </div>
  );
}

function LockedCard({ t }: { t: any }) {
  return (
    <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 border-dashed rounded-[2rem] h-[340px] flex flex-col items-center justify-center p-6 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40"></div>
      <div className="p-4 bg-white/5 rounded-2xl mb-4 border border-white/5 group-hover:bg-white/10 transition-all duration-500">
        <Lock className="text-gray-600" size={24} />
      </div>
      <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px] mb-2">{t.dashboard.lockedSupplier}</p>
      <p className="text-gray-400 text-sm text-center font-medium px-4">
        {t.dashboard.lockedSupplierDesc}
      </p>
    </div>
  )
}
