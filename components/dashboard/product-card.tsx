"use client";

import { useState, useEffect } from "react";
import { Star, ShoppingBag, Loader2, ArrowUpRight } from "lucide-react";
import { toggleFavorite } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
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
  /** Position in the Top 5 (passed by the winning products page). */
  rank?: number;
  price?: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
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
    if (!product.id) {
      console.error("ProductCard: Missing product ID!", product);
      return;
    }
    router.push(`/dashboard/products/${product.id}`);
  };

  const rank = product.rank ?? product.ranking;
  const image = product.image_url || product.image;

  return (
    <article
      onClick={handleNavigate}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2 transition-colors duration-500 hover:border-white/20"
    >
      {/* IMAGE */}
      <div className="relative aspect-square w-full overflow-hidden bg-[radial-gradient(70%_70%_at_50%_45%,rgba(255,255,255,0.05),transparent)]">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {image && !imageFailed ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <ShoppingBag className="h-12 w-12 text-white/10" aria-hidden />
          )}
        </div>

        {/* rank / trending */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {rank ? (
            <span className="grid h-9 min-w-9 place-items-center rounded-full bg-red-500 px-2 font-display text-lg text-white">
              {rank}
            </span>
          ) : (
            <span className="rounded-full border border-white/15 bg-ink/60 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.15em] text-white backdrop-blur-md">
              {t?.featureUi?.winning?.trending ?? "Trending"}
            </span>
          )}
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
      <div className="flex flex-1 flex-col border-t border-white/[0.06] p-5">
        {product.category && (
          <p className="truncate font-label text-[10px] uppercase tracking-[0.18em] text-stone">{product.category}</p>
        )}
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-display text-xl font-light leading-snug text-white">{product.name}</h3>
          <ArrowUpRight size={16} className="mt-1 shrink-0 text-stone transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-500" aria-hidden />
        </div>

        {(product.price || product.margin) && (
          <dl className="mt-auto grid grid-cols-2 border-t border-white/[0.08] pt-4 [&:not(:first-child)]:mt-5">
            {product.price ? (
              <div>
                <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone-2">{t?.featureUi?.calculator?.sellPrice ?? "Price"}</dt>
                <dd className="mt-1 font-display text-xl font-light text-white">{product.price}$</dd>
              </div>
            ) : null}
            {product.margin ? (
              <div className={product.price ? "border-l border-white/[0.08] pl-4" : ""}>
                <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone-2">{t?.supplier?.estMargin || "Margin"}</dt>
                <dd className="mt-1 font-display text-xl font-light text-red-500">{product.margin}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </div>
    </article>
  );
}
