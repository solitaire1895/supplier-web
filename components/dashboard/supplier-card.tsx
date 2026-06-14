"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, CheckCircle, ShieldCheck, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { toggleFavorite } from "@/lib/supabase/actions";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";

type Supplier = {
  id: string;
  name: string;
  platform: string;
  moq: number;
  category: string;
};

interface SupplierCardProps {
  supplier: Supplier;
  onContact?: (supplier: Supplier) => void;
}

export default function SupplierCard({ supplier, onContact }: SupplierCardProps) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

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
        .eq("supplier_id", supplier.id)
        .maybeSingle();

      setFavorite(!!data);
    };

    checkFavorite();
  }, [supplier.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    try {
      setLoading(true);
      const res = await toggleFavorite("supplier", supplier.id);
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
    if (!supplier.id) {
      console.error("SupplierCard: Missing supplier ID!", supplier);
      return;
    }
    router.push(`/dashboard/suppliers/${supplier.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleNavigate}
      className="relative group cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-red-500/50 shadow-xl hover:shadow-neon"
    >
      {/* HEADER BAR */}
      <div className="bg-red-500/10 backdrop-blur-md border-b border-white/5 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">
            {supplier.platform}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            #{supplier.id?.slice(0, 8).toUpperCase() || 'NEW'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase">
          <ShieldCheck size={12} />
          {t?.supplier?.verified || "Verified"}
        </div>
      </div>

      <div className="p-6">
        {/* ⭐ FAVORITE */}
        <button
          onClick={handleFavorite}
          disabled={loading}
          className="absolute top-[4.5rem] right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 border border-white/5 transition active:scale-90"
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

        {/* CONTENT */}
        <div className="mb-6 pr-10">
          <h3 className="text-white text-xl font-bold mb-1 line-clamp-1 group-hover:text-red-400 transition-colors">
            {supplier.name}
          </h3>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-tight">
            {supplier.category}
          </p>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">
              {t?.supplier?.moq || "MOQ"}
            </p>
            <p className="text-white text-lg font-bold">
              {supplier.moq} <span className="text-[10px] text-gray-500">{t?.supplier?.units || "Units"}</span>
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">
              {t?.supplier?.reliability || "Reliability"}
            </p>
            <p className="text-green-400 text-lg font-bold flex items-center gap-1">
               98% <CheckCircle size={14} />
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
            className="flex-1 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            {t?.supplier?.viewDetails || "Details"}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onContact) onContact(supplier);
              else handleNavigate();
            }}
            className="flex-1 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white shadow-neon hover:shadow-neon-strong hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <MessageSquare size={14} />
            {t?.supplier?.contact || "Contact"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
