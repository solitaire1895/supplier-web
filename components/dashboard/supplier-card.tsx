"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { toggleFavorite } from "@/lib/supabase/actions";
import { supabase } from "@/lib/supabase/client";

type Supplier = {
  id: string;
  name: string;
  platform: string;
  moq: number;
  category: string;
};

export default function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('supplier_id', supplier.id)
        .single();
      
      setFavorite(!!data);
    };

    checkFavorite();
  }, [supplier.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    try {
      setLoading(true);
      const res = await toggleFavorite('supplier', supplier.id);
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

  const handleNavigate = () => {
    router.push(`/dashboard/suppliers/${supplier.id}`);
  };

  return (
    <div
      onClick={handleNavigate}
      className="
      relative group cursor-pointer
      bg-white/5 backdrop-blur-xl
      border border-white/10
      rounded-2xl p-5
      transition-all duration-300
      hover:border-red-500
      hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]
    "
    >
      {/* ⭐ FAVORITE */}
      <button
        onClick={handleFavorite}
        disabled={loading}
        className="
        absolute top-4 right-4 p-2 rounded-full
        hover:bg-white/10 transition
        disabled:opacity-50
      "
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <Star
            className={`w-5 h-5 transition ${
              favorite
                ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : "text-gray-400 group-hover:text-white"
            }`}
          />
        )}
      </button>

      {/* HEADER */}
      <div className="mb-4 pr-8">
        <h3 className="text-white text-lg font-semibold line-clamp-1">
          {supplier.name}
        </h3>

        <p className="text-gray-400 text-sm">
          {supplier.platform}
        </p>
      </div>

      {/* INFO */}
      <div className="flex justify-between text-sm text-gray-300 mb-6">
        <div>
          <p className="text-gray-500">{t?.supplier?.moq || 'MOQ'}</p>
          <p className="text-white font-medium">
            {supplier.moq}
          </p>
        </div>

        <div>
          <p className="text-gray-500">{t?.supplier?.category || 'Category'}</p>
          <p className="text-white font-medium">
            {supplier.category}
          </p>
        </div>
      </div>

      {/* ACTION */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="
        w-full py-2 rounded-full text-sm font-medium
        bg-red-500 text-white
        shadow-[0_0_20px_rgba(239,68,68,0.6)]
        hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]
        transition-all
        cursor-pointer
      "
      >
        {t?.supplier?.contact || 'Contact'}
      </button>
    </div>
  );
}
