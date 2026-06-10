"use client";

import { useState, useEffect } from "react";
import { Star, ShoppingBag, Loader2, ArrowUpRight } from "lucide-react";
import { toggleFavorite } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

type Product = {
  id: string;
  name: string;
  image_url?: string;
  image?: string;
  category?: string;
  margin?: string;
  demand?: string;
  views?: string;
  ranking?: number;
  price?: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  // Initialize favorite state
  useEffect(() => {
    const checkFavorite = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .single();

      setFavorite(!!data);
    };

    checkFavorite();
  }, [product.id]);

  // Handle Favorite Toggle
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    try {
      setLoading(true);
      const res = await toggleFavorite("product", product.id);
      if (res.success) {
        setFavorite(!favorite);
      } else if (res.error === "Unauthorized") {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    router.push(`/dashboard/products/${product.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onClick={handleNavigate}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 overflow-hidden group cursor-pointer hover:border-red-500/50 transition-all duration-500 shadow-xl hover:shadow-neon"
    >
      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          disabled={loading}
          className={`p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 active:scale-90
            ${
              favorite
                ? "bg-red-500/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                : "bg-black/40 border-white/10 hover:bg-black/60 hover:border-white/30"
            }
          `}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Star
              className={`w-4 h-4 transition-all duration-300 ${
                favorite ? "text-red-500 fill-red-500" : "text-gray-400 group-hover:text-white"
              }`}
            />
          )}
        </button>

        {/* Price Tag */}
        {(product.price || product.margin) && (
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-lg group-hover:border-red-500/30 transition-colors">
            {product.price ? `${product.price}$` : (product.margin || "N/A")}
          </div>
        )}
      </div>

      {/* Image Area */}
      <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-red-500/5 to-transparent mb-5">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {product.image_url || product.image ? (
            <img
              src={product.image_url || product.image}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-2xl"
            />
          ) : (
            <ShoppingBag className="w-20 h-20 text-white/5" />
          )}
        </div>

        {/* Info Banner at bottom of image */}
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-full text-center shadow-neon transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          {product.ranking ? `#${product.ranking} Trending` : t?.common?.hot || "Hot Trend"}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 mr-3">
            <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors duration-300 line-clamp-1">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-red-500 font-bold group-hover:scale-110 transition-transform">
            <span className="text-[10px] uppercase tracking-wider">{t?.supplier?.viewDetails || "View"}</span>
            <ArrowUpRight size={16} />
          </div>
        </div>

        {/* Tags / Chips */}
        <div className="flex flex-wrap gap-2">
          {product.category && (
            <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:border-white/20 transition-colors">
              {product.category}
            </span>
          )}
          {product.margin && (
            <span className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-green-400 uppercase tracking-wider">
              {product.margin} {t?.supplier?.estMargin || "Margin"}
            </span>
          )}
          {(product.demand || product.views) && (
            <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {product.demand || product.views}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
