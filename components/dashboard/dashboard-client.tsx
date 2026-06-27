"use client";

import Navbar from "@/components/navbar/navbar";
import SupplierCard from "@/components/dashboard/supplier-card";
import FilterSidebar from "@/components/dashboard/filter-sidebar";
import Recommendations from "@/components/dashboard/recommendations";
import { Search, Users, Star, Package, Zap, SlidersHorizontal, ChevronDown, Lock, Loader2, X } from "lucide-react";
import { getPlanFeatures } from "@/lib/plans";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect, useCallback } from "react";
import { searchSuppliersAction, recordSourcingRequest } from "@/lib/supabase/actions";
import { useSearchParams, useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-black flex items-center justify-center">
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

    const plan = profile?.active_plan || "Free";
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30">
      <Navbar />

      <div className="pt-28 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">

        {/* HERO SEARCH & HEADER */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t.dashboard.title}
          </h1>
          <p className="text-gray-400 text-sm md:text-base mb-8 max-w-2xl">
            {t.dashboard.subtitle}
          </p>

          {/* Premium Omnibar Search */}
          <form onSubmit={handleSearch} className="relative group max-w-3xl">
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
              placeholder={t.dashboard.searchPlaceholder}
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
              <kbd className="hidden sm:inline-flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-lg text-[10px] font-medium text-gray-400 border border-white/5">
                <span className="text-xs">ENTER</span>
              </kbd>
            </div>
          </form>
        </div>

        {/* RECOMMENDATIONS (Show if not searching) */}
        {!searchResults && (
          <div className="mb-16">
            <Recommendations type="supplier" />
          </div>
        )}

        {/* TOP STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {[
            { label: t.dashboard.stats.suppliers, value: stats.suppliers.toString(), icon: Users },
            { label: t.dashboard.stats.favorites, value: stats.favorites.toString(), icon: Star },
            { label: t.dashboard.stats.avgMoq, value: "75", icon: Package },
            { label: t.dashboard.stats.topCategory, value: "Electronics", icon: Zap, highlight: true },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden group hover:border-white/20 transition-all duration-500"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-[30px] group-hover:bg-red-500/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2 rounded-xl ${stat.highlight ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                  <stat.icon size={18} />
                </div>
              </div>
              
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold tracking-tight ${stat.highlight ? 'text-white' : 'text-gray-200'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN LAYOUT GRID (SIDEBAR + SUPPLIERS) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

          <aside className="hidden lg:block sticky top-28 z-10 h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
            <FilterSidebar />
            
            {/* PLAN UPSELL IN SIDEBAR */}
            {(features.access.suppliers === 'platforms' || isLimited) && (
              <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                  <Lock className="text-red-500 mb-4" size={20} />
                  <h3 className="text-sm font-bold mb-2">{t.dashboard.lockedTitle}</h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">{t.dashboard.lockedDesc}</p>
                  <Link href="/dashboard/profile?tab=plan" className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">
                    {t.common.upgrade} Now →
                  </Link>
                </div>
              </div>
            )}
          </aside>

          <main className="min-w-0 flex flex-col h-full">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {searchResults ? "Search Results" : t.dashboard.discoveryGrid}
                <span className="bg-white/10 text-xs px-2 py-0.5 rounded-md text-gray-400 font-normal">{filteredSuppliers.length} {t.common.results}</span>
              </h2>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  {t.common.sortBy}: {t.common.recommended} <ChevronDown size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* SUPPLIERS GRID */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {displaySuppliers.length > 0 ? (
                displaySuppliers.map((supplier, i) => (
                  <div key={i} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                    <SupplierCard supplier={supplier} onContact={handleContactSupplier} />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                  <p className="text-gray-400">No suppliers found matching your criteria.</p>
                </div>
              )}
              
              {/* Locked Suppliers Placeholders */}
              {!searchResults && lockedCount > 0 && Array.from({ length: lockedCount }).map((_, i) => (
                <div key={`locked-supplier-${i}`} className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] h-[280px] flex flex-col items-center justify-center p-8 text-center opacity-60">
                   <Lock className="text-gray-600 mb-4" size={24} />
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t.dashboard.lockedSupplier}</p>
                   <p className="text-xs text-gray-500 leading-relaxed">{t.dashboard.lockedSupplierDesc}</p>
                </div>
              ))}
            </div>

            {/* Load More */}
            {!searchResults && displaySuppliers.length < filteredSuppliers.length && (
              <div className="mt-12 flex justify-center">
                <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  {t.common.loadMore}
                </button>
              </div>
            )}

            {/* Upgrade CTA when supplier limit is in effect */}
            {!searchResults && isLimited && (
              <div className="mt-12 bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <Lock className="text-red-500 mx-auto mb-4" size={28} />
                  <h2 className="text-2xl font-bold mb-3">Unlock More Suppliers</h2>
                  <p className="text-gray-400 mb-8 max-w-xl mx-auto text-sm">
                    You are viewing a limited set of suppliers on the <span className="text-white font-semibold">{features.name.EN}</span> plan. Upgrade to access our full supplier network.
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

          </main>
        </div>
      </div>
    </div>
  );
}
