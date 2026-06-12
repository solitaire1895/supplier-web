"use client";

import { useEffect, useState } from "react";
import { getRecommendedProductsAction, getRecommendedSuppliersAction } from "@/lib/supabase/actions";
import ProductCard from "./product-card";
import SupplierCard from "./supplier-card";
import { Zap, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Recommendations({ type = "both" }: { type?: "product" | "supplier" | "both" }) {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const promises = [];
        if (type === "product" || type === "both") promises.push(getRecommendedProductsAction(4));
        if (type === "supplier" || type === "both") promises.push(getRecommendedSuppliersAction(4));

        const results = await Promise.all(promises);
        
        if (type === "both") {
          setProducts(results[0] || []);
          setSuppliers(results[1] || []);
        } else if (type === "product") {
          setProducts(results[0] || []);
        } else {
          setSuppliers(results[0] || []);
        }
      } catch (err) {
        console.error("Error loading recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  if (loading) return (
    <div className="py-12 animate-pulse space-y-8">
      <div className="h-8 w-48 bg-white/5 rounded-lg"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-white/5 rounded-[2rem]"></div>
        ))}
      </div>
    </div>
  );

  if (products.length === 0 && suppliers.length === 0) return null;

  return (
    <div className="space-y-16 py-12">
      {/* Recommended Products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <Sparkles size={20} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Recommended for You</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-red-500/20 to-transparent ml-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Suppliers */}
      {suppliers.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <Zap size={20} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Suggested Suppliers</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-red-500/20 to-transparent ml-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {suppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
