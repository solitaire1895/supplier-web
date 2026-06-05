"use client";

import { useState, useEffect } from "react";
import { Star, TrendingUp, ShoppingBag, Loader2 } from "lucide-react";
import { toggleFavorite } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ProductCard({ product }: any) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Initialize favorite state
  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
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
      const res = await toggleFavorite('product', product.id);
      if (res.success) {
        setFavorite(!favorite);
      } else if (res.error === 'Unauthorized') {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Card Navigation
  const handleNavigate = () => {
    router.push(`/dashboard/products/${product.id}`);
  };

  return (
    <div 
      onClick={handleNavigate}
      className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden group cursor-pointer hover:border-white/20 transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
...
      <div className="relative h-56 w-full overflow-hidden bg-black/50">

        {/* Fallback gradient / Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black group-hover:scale-105 transition-transform duration-700 ease-out">
           {(product.image_url || product.image) && (
             <img src={product.image_url || product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
           )}
        </div>
...

        {/* Inner bottom shadow for text readability if image is bright */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-0 pointer-events-none"></div>

        {/* Dynamic Ranking Badge (Optional/Conditional) */}
        {product.ranking && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <TrendingUp size={12} /> #{product.ranking}
          </div>
        )}

        {/* UPGRADED FAVORITE BUTTON */}
        <button
          onClick={handleFavorite}
          disabled={loading}
          className={`absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 active:scale-90
            ${favorite 
              ? "bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
              : "bg-black/40 border-white/10 hover:bg-black/60 hover:border-white/30"
            }
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Star
              className={`w-4 h-4 transition-all duration-300 ${
                favorite
                  ? "text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-110"
                  : "text-gray-400 group-hover:text-white"
              }`}
            />
          )}
        </button>
      </div>

      {/* ================= CONTENT SECTION ================= */}
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>
        </div>
        
        <p className="text-sm text-gray-400 mb-5 flex items-center gap-1.5">
          <ShoppingBag size={14} className="text-gray-500" />
          {product.category || product.niche || "General"}
        </p>

        {/* STATS ROW */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Est. Margin</p>
            <p className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md inline-block">
              {product.margin || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Demand / Views</p>
            <p className="text-sm font-bold text-gray-200">
              {product.demand || product.views || "High"}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}