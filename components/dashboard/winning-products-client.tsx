"use client";

import Navbar from "@/components/navbar/navbar";
import { Flame, Lock } from "lucide-react";
import ProductCard from "@/components/dashboard/product-card";
import { getPlanFeatures } from "@/lib/plans";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface WinningProductsClientProps {
  products: any[];
  profile: any;
}

export default function WinningProductsClient({ products, profile }: WinningProductsClientProps) {
  const { t, lang } = useI18n();

  if (!t) return null;

  const features = getPlanFeatures(profile?.active_plan);
  
  // Apply limit based on plan
  const visibleLimit = features.winningProducts.limit === 'unlimited' ? products.length : features.winningProducts.limit;
  const visibleProducts = products.slice(0, visibleLimit as number);
  const lockedProducts = products.slice(visibleLimit as number);

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
          
          {features.winningProducts.delay > 0 && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl inline-flex items-center gap-3">
              <Lock size={18} className="text-red-500" />
              <p className="text-sm font-medium text-red-400">
                Your plan has a {features.winningProducts.delay}h delay on new winners. <Link href="/dashboard/profile?tab=plan" className="underline font-bold hover:text-red-300 transition-colors ml-1">{t.common.upgrade} to Importateur</Link> for instant access.
              </p>
            </div>
          )}
        </div>

        {/* TOP 5 SECTION */}
        <div className="mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-red-500/5 rounded-[100%] blur-[120px] pointer-events-none z-0"></div>

          <div className="relative z-10 flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">The Top 5</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent"></div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
            {top5.map((product: any, index: number) => (
              <ProductCard
                key={product.id || index}
                product={{ ...product, rank: index + 1 }}
              />
            ))}
            
            {/* Locked placeholders if limit is low */}
            {top5.length < 5 && Array.from({ length: 5 - top5.length }).map((_, i) => (
              <LockedCard key={`locked-top-${i}`} t={t} />
            ))}
          </div>
        </div>

        {/* REST OF OPPORTUNITIES */}
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
            {lockedProducts.length > 0 && lockedProducts.map((_, i) => (
              <LockedCard key={`locked-rest-${i}`} t={t} />
            ))}
          </div>
        </div>

        {/* UPGRADE CTA SECTION FOR LOCKED PRODUCTS */}
        {lockedProducts.length > 0 && (
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
