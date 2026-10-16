"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, ShieldCheck, MessageSquare, ArrowUpRight, Building2 } from "lucide-react";
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
  image_url?: string;
};

interface SupplierCardProps {
  supplier: Supplier;
  onContact?: (supplier: Supplier) => void;
}

export default function SupplierCard({ supplier, onContact }: SupplierCardProps) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
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

  const showImage = supplier.image_url && !imageFailed;

  return (
    <article
      onClick={handleNavigate}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2 transition-colors duration-500 hover:border-white/20"
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-3">
        {showImage ? (
          <img
            src={supplier.image_url}
            alt={supplier.name}
            loading="lazy"
            className="h-full w-full object-cover grayscale-[15%] transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(60%_60%_at_50%_40%,rgba(239,68,68,0.12),transparent)]">
            <span className="font-display text-6xl font-light text-white/25">{supplier.name?.[0]?.toUpperCase() ?? <Building2 />}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-ink/30" aria-hidden />

        {/* platform + verified */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-ink/60 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.15em] text-white backdrop-blur-md">
            {supplier.platform}
          </span>
        </div>

        {/* favorite */}
        <button
          onClick={handleFavorite}
          disabled={loading}
          aria-label="Favorite"
          aria-pressed={favorite}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/60 backdrop-blur-md transition hover:border-white/30 active:scale-90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Star className={`h-4 w-4 transition ${favorite ? "fill-red-500 text-red-500" : "text-white/70 group-hover:text-white"}`} />
          )}
        </button>
      </div>

      {/* BODY */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-label text-[10px] uppercase tracking-[0.18em] text-stone">{supplier.category}</p>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-white/60">
            <ShieldCheck size={12} className="text-red-500" aria-hidden />
            {t?.supplier?.verified || "Verified"}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-1 font-display text-2xl font-light text-white">{supplier.name}</h3>

        <dl className="mt-6 grid grid-cols-2 border-t border-white/[0.08] pt-5">
          <div>
            <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone-2">{t?.supplier?.moq || "MOQ"}</dt>
            <dd className="mt-1.5 font-display text-2xl font-light text-white">
              {supplier.moq} <span className="font-text text-xs text-stone">{t?.supplier?.units || "Units"}</span>
            </dd>
          </div>
          <div className="border-l border-white/[0.08] pl-5">
            <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone-2">{t?.supplier?.reliability || "Reliability"}</dt>
            <dd className="mt-1.5 font-display text-2xl font-light text-white">98%</dd>
          </div>
        </dl>

        {/* ACTIONS */}
        <div className="mt-auto flex gap-2 pt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] py-2.5 text-sm text-white transition hover:border-white/30 hover:bg-white/10"
          >
            {t?.supplier?.viewDetails || "Details"}
            <ArrowUpRight size={14} aria-hidden />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onContact) onContact(supplier);
              else handleNavigate();
            }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 active:scale-[0.98]"
          >
            <MessageSquare size={14} aria-hidden />
            {t?.supplier?.contact || "Contact"}
          </button>
        </div>
      </div>
    </article>
  );
}
