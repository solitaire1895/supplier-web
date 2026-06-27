"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Star, ChevronLeft, Activity, TrendingUp, AlertCircle, Truck, Package, MessageSquare
} from "lucide-react";
import Navbar from "@/components/navbar/navbar";
import SupplierCard from "@/components/dashboard/supplier-card";
import ProfitCalculator from "@/components/dashboard/profit-calculator";
import { supabase } from "@/lib/supabase/client";
import { submitReview, trackActivityAction, recordSourcingRequest } from "@/lib/supabase/actions";
import { useUser } from "@/lib/supabase/provider";
import { useI18n } from "@/lib/i18n";
import { getPlanFeatures } from "@/lib/plans";

export default function ProductDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  
  const router = useRouter();
  const { t } = useI18n();
  const supplierRef = useRef<HTMLDivElement | null>(null);
  const { profile, loading: userLoading } = useUser();
  
  const [product, setProduct] = useState<any>(null);
  const [matchedSuppliers, setMatchedSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProductData = useCallback(async () => {
    if (!id) return;
    
    // UUID regex check (any version)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn(`ProductDetailPage: Invalid UUID format for ID: ${id}`);
      setError(`Invalid ID format: ${id}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Product
      const { data: prod, error: dbError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (dbError) {
        console.error("Supabase error fetching product:", dbError);
        setError(`Database error: ${dbError.message}`);
        setLoading(false);
        return;
      }

      if (!prod) {
        console.warn(`Product not found for ID: ${id}`);
        setLoading(false);
        return;
      }

      setProduct({
        ...prod,
        profitScore: prod.ai_score || 0,
        trend: 15,
        competition: "Low",
        buyPrice: prod.buy_price || 0,
        sellPrice: prod.sell_price || 0,
        delivery: "5–7 days",
        description: prod.description || "High-demand analyzed product with strong market traction and solid profit potential."
      });

      // Track Activity
      trackActivityAction('view_product', id);

      // 2. Fetch Matched Suppliers
      let sups = [];
      try {
        // Try searching for the product name in suppliers first (Dynamic Indexing)
        const { data: searchSups } = await supabase
          .from('suppliers')
          .select('*')
          .textSearch('search_vector', prod.name, {
            type: 'websearch',
            config: 'english'
          })
          .limit(4);
        
        if (searchSups && searchSups.length > 0) {
          sups = searchSups;
        } else if (prod.category) {
          // Fallback to category if name search fails
          const { data: catSups } = await supabase
            .from('suppliers')
            .select('*')
            .eq('category', prod.category)
            .limit(4);
          sups = catSups || [];
        }
      } catch (err) {
        console.error("Error in live indexing suppliers:", err);
      }
      
      setMatchedSuppliers(sups);

      // 3. Fetch Reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('*, profiles(email, full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      
      setReviews(revs || []);
    } catch (err: any) {
      console.error("Unexpected error fetching product data:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();

    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [fetchProductData]);

  const handleAddReview = async () => {
    if (!newComment || submitting) return;
    setSubmitting(true);
    
    const result = await submitReview({
      type: 'product',
      id: id as string,
      rating: newRating,
      content: newComment
    });

    if (result.success) {
      // Refresh reviews locally for immediate feedback
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase.from('profiles').select('email, full_name').eq('id', user?.id).single();
      
      const newReview = {
        rating: newRating,
        content: newComment,
        created_at: new Date().toISOString(),
        profiles: profileData
      };
      
      setReviews([newReview, ...reviews]);
      setNewComment("");
      setNewRating(5);
    } else {
      alert(result.error || "Failed to submit review");
    }
    
    setSubmitting(false);
  };

  const handleStartSourcing = async () => {
    // 1. Track activity
    trackActivityAction('view_product', id, { intent: 'start_sourcing' });
    
    // 2. Scroll to suppliers
    supplierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContactSupplier = async (supplier: any) => {
    if (submitting) return;
    setSubmitting(true);

    // Open synchronously to avoid popup blocking
    const newTab = window.open('', '_blank');

    const plan = profile?.active_plan || "Free";
    const features = getPlanFeatures(plan);

    await recordSourcingRequest({
      supplier_id: supplier.id,
      product_id: product.id,
      notes: `Contacted via Product Page: ${product.name}`
    });

    let contactUrl = supplier.contact_url;

    if (features.access.directContacts) {
       if (supplier.whatsapp) {
          const cleanPhone = supplier.whatsapp.replace(/\D/g, '');
          contactUrl = `https://wa.me/${cleanPhone}?text=Hello, I found you on Nexusply and I'm interested in sourcing "${product.name}".`;
       } else if (supplier.private_email) {
          contactUrl = `mailto:${supplier.private_email}?subject=Nexusply Sourcing Inquiry: ${product.name}&body=Hello, I am interested in sourcing "${product.name}"...`;
       }
    }

    if (contactUrl && newTab) {
      newTab.location.href = contactUrl;
    } else {
      if (newTab) newTab.close();
      alert("No direct contact method found. Please use the platform contact link.");
    }

    setSubmitting(false);
  };

  if ((loading && !product) || userLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
       <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle size={32} className="text-red-500" />
       </div>
       <h1 className="text-2xl font-bold mb-2 text-center">{t.product.productNotFound}</h1>
       <p className="text-gray-400 mb-8 max-w-md text-center">
         {error ? error : t.product.productNotFoundDesc.replace("{id}", id || 'unknown')}
       </p>
       <div className="flex gap-4">
         <button 
           onClick={() => router.push('/dashboard/winning-products')} 
           className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
         >
           {t.product.browseAllProducts}
         </button>
         <button 
           onClick={() => fetchProductData()} 
           className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
         >
           {t.product.tryAgain}
         </button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 pb-24">
      <Navbar />

      <div className="pt-28 px-4 md:px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
        
        {/* BACK NAVIGATION */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all group mb-8"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ChevronLeft size={16} />
          </div>
          {t.product.backToProducts}
        </button>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ================= LEFT COLUMN (8 cols) ================= */}
          <div className="lg:col-span-8 space-y-8">

            {/* HERO SECTION */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 overflow-hidden group relative">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-8">
                {/* Image */}
                <div className="w-full md:w-72 h-72 rounded-[1.5rem] overflow-hidden bg-black/50 border border-white/5 shrink-0 relative">
                  <img 
                    src={product.image_url || "https://via.placeholder.com/600x600?text=No+Image"} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x600?text=Image+Not+Found";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/10 rounded-md text-xs font-medium text-gray-300 border border-white/5 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-bold border border-red-500/20 uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <TrendingUp size={12} /> {product.demand} {t.product.demandLevel}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
                    {product.name}
                  </h1>

                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
                    {product.description}
                  </p>

                  <button
                    onClick={handleStartSourcing}
                    className="self-start px-8 py-3 rounded-xl text-sm font-bold bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                  >
                    {t.product.viewMatchingSuppliers} <ArrowDownRightIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* AI INSIGHTS & PROFIT */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Intelligence Core */}
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8">
                <div className="flex items-center gap-2 mb-8">
                  <Activity className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold">{t.product.intelligenceCore}</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">{t.product.profitScore}</p>
                    <p className="text-3xl font-bold text-red-500 tracking-tight">{product.profitScore}</p>
                    <div className="w-full h-1 bg-black rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{width: `${product.profitScore}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">{t.product.marketTrend}</p>
                    <p className="text-3xl font-bold text-white tracking-tight flex items-end gap-1">
                      {product.trend}% <TrendingUp size={16} className="text-green-400 mb-2"/>
                    </p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">{t.product.competition}</p>
                    <p className="text-lg font-bold text-green-400 flex items-center gap-2 mt-1">
                      <AlertCircle size={16} /> {product.competition === "Low" ? t.product.low : product.competition}
                    </p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">{t.product.avgDelivery}</p>
                    <p className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                      <Truck size={16} className="text-gray-400" /> {product.delivery}
                    </p>
                  </div>
                </div>
              </div>

              {/* Unit Economics */}
              <ProfitCalculator buyPrice={product.buyPrice} sellPrice={product.sellPrice} />

            </div>

            {/* MATCHED SUPPLIERS GRID */}
            <div ref={supplierRef} className="pt-8">
              <div className="flex items-center gap-3 mb-8">
                <Package className="text-gray-400" size={24} />
                <h2 className="text-2xl font-bold text-white tracking-tight">{t.product.verifiedSuppliers}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
              </div>

              {matchedSuppliers.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/20 rounded-[2rem] p-16 text-center">
                  <p className="text-gray-400">{t.product.noSuppliers}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {matchedSuppliers.map((supplier, i) => (
                    <SupplierCard key={i} supplier={supplier} onContact={handleContactSupplier} />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN (4 cols - STICKY) ================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">

            {/* CTA CARD */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
              <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <BoxIcon size={28} className="text-red-500" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2 tracking-tight">{t.product.sourceThisProduct}</h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">{t.product.sourceThisProductDesc}</p>

              <button 
                onClick={handleStartSourcing}
                className="w-full py-4 rounded-xl text-sm font-bold tracking-wide bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:bg-red-600 transition-all duration-300"
              >
                {t.product.beginSourcing}
              </button>
            </div>

            {/* REVIEWS & COMMUNITY */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <MessageSquare size={18} className="text-gray-400"/> {t.product.communityInsights}
              </h2>

              <div className="space-y-5 mb-8">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4 italic">{t.supplier.noReviews}</p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={i} className="bg-black/30 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-sm text-gray-200">
                          {r.profiles?.full_name || r.profiles?.email?.split('@')[0] || t.supplier.anonymous}
                        </p>
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < r.rating ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">&quot;{r.content}&quot;</p>
                    </div>
                  ))
                )}
              </div>

              {/* Review Input */}
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm font-medium mb-3">{t.product.addInsight}</p>
                <div className="flex gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      onClick={() => setNewRating(i + 1)}
                      className={`w-5 h-5 cursor-pointer transition-all ${i < newRating ? "text-red-500 fill-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "text-gray-600 hover:text-gray-400"}`}
                    />
                  ))}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.product.insightPlaceholder}
                  className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all resize-none h-24 mb-4"
                />
                <button
                  onClick={handleAddReview}
                  disabled={!newComment || submitting}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                >
                  {submitting ? t.common.loading : t.product.submitInsight}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowDownRightIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="7" x2="17" y2="17"></line>
      <polyline points="17 7 17 17 7 17"></polyline>
    </svg>
  );
}

function BoxIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );
}
