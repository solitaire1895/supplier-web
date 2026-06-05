"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { 
  Star, ChevronLeft, Activity, TrendingUp, AlertCircle, Truck, DollarSign, Package, MessageSquare
} from "lucide-react";
import Navbar from "@/components/navbar/navbar";
import SupplierCard from "@/components/dashboard/supplier-card";
import ProfitCalculator from "@/components/dashboard/profit-calculator";
import { supabase } from "@/lib/supabase/client";
import { getCurrentPlan } from "@/lib/settings";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supplierRef = useRef<HTMLDivElement | null>(null);
  
  const [product, setProduct] = useState<any>(null);
  const [matchedSuppliers, setMatchedSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("Free");

  useEffect(() => {
    setPlan(getCurrentPlan());

    async function fetchProductData() {
      // 1. Fetch Product
      const { data: prod, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !prod) {
        console.error("Error fetching product:", error);
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

      // 2. Fetch Matched Suppliers
      const { data: sups } = await supabase
        .from('suppliers')
        .select('*')
        .eq('category', prod.category)
        .limit(4);
      
      setMatchedSuppliers(sups || []);
      setLoading(false);
    }

    if (id) fetchProductData();
  }, [id]);

  /* ================= REVIEWS ================= */
  const [reviews, setReviews] = useState([
    { name: "John D.", rating: 5, date: "2 days ago", comment: "Very profitable product. Found a great supplier through Nexusply, margins are insane 🔥" },
    { name: "Sarah M.", rating: 4, date: "1 week ago", comment: "Good margins but you need a strong creative angle to beat the moderate competition." },
  ]);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const addReview = () => {
    if (!newComment) return;
    setReviews([{ name: "You", rating: newRating, date: "Just now", comment: newComment }, ...reviews]);
    setNewComment("");
  };

  const scrollToSuppliers = () => {
    supplierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
       <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
       <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-red-500 rounded-xl">Go Back</button>
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
          Back to Products
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
                  <img src={product.image_url || "/placeholder-product.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/10 rounded-md text-xs font-medium text-gray-300 border border-white/5 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-bold border border-red-500/20 uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <TrendingUp size={12} /> {product.demand} Demand
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
                    {product.name}
                  </h1>

                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
                    {product.description}
                  </p>

                  <button
                    onClick={scrollToSuppliers}
                    className="self-start px-8 py-3 rounded-xl text-sm font-bold bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                  >
                    View Matching Suppliers <ArrowDownRightIcon size={16} />
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
                  <h2 className="text-lg font-semibold">Intelligence Core</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Profit Score</p>
                    <p className="text-3xl font-bold text-red-500 tracking-tight">{product.profitScore}</p>
                    <div className="w-full h-1 bg-black rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{width: `${product.profitScore}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Market Trend</p>
                    <p className="text-3xl font-bold text-white tracking-tight flex items-end gap-1">
                      {product.trend}% <TrendingUp size={16} className="text-green-400 mb-2"/>
                    </p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Competition</p>
                    <p className="text-lg font-bold text-green-400 flex items-center gap-2 mt-1">
                      <AlertCircle size={16} /> {product.competition}
                    </p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Avg Delivery</p>
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
                <h2 className="text-2xl font-bold text-white tracking-tight">Verified Suppliers</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
              </div>

              {matchedSuppliers.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/20 rounded-[2rem] p-16 text-center">
                  <p className="text-gray-400">No verified suppliers indexed for this product category yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {matchedSuppliers.map((supplier, i) => (
                    <SupplierCard key={i} supplier={supplier} />
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
              
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Source This Product</h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">Connect with verified suppliers instantly to request samples and negotiate bulk pricing.</p>

              <button className="w-full py-4 rounded-xl text-sm font-bold tracking-wide bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.8)] hover:bg-red-600 transition-all duration-300">
                Begin Sourcing Process
              </button>
            </div>

            {/* REVIEWS & COMMUNITY */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <MessageSquare size={18} className="text-gray-400"/> Community Insights
              </h2>

              <div className="space-y-5 mb-8">
                {reviews.map((r, i) => (
                  <div key={i} className="bg-black/30 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-sm text-gray-200">{r.name}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={`w-3 h-3 ${j < r.rating ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">&quot;{r.comment}&quot;</p>
                  </div>
                ))}
              </div>

              {/* Review Input */}
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm font-medium mb-3">Add your insight</p>
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
                  placeholder="Share your sourcing experience..."
                  className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all resize-none h-24 mb-4"
                />
                <button
                  onClick={addReview}
                  disabled={!newComment}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                >
                  Submit Insight
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
