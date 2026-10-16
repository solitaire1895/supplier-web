"use client";

import { useEffect, useState } from "react";
import { getRecommendedProductsAction, getRecommendedSuppliersAction } from "@/lib/supabase/actions";
import ProductCard from "./product-card";
import SupplierCard from "./supplier-card";
import { SectionLabel } from "@/components/landing/primitives";
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
    <div className="animate-pulse space-y-8 py-12">
      <div className="h-8 w-56 rounded-lg bg-white/5"></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-80 rounded-2xl border border-white/[0.06] bg-ink-2"></div>
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
          <Heading label={t.dashboardUi.suggestedLabel} title={t.dashboardUi.recommendedForYou} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Suppliers */}
      {suppliers.length > 0 && (
        <section>
          <Heading label={t.dashboardUi.suggestedLabel} title={t.dashboardUi.suggestedSuppliers} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {suppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Heading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-8 border-b border-white/[0.08] pb-5">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-3 font-display text-3xl font-light text-white">{title}</h2>
    </div>
  );
}
