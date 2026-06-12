"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { 
  Star, ChevronLeft, ShieldCheck, Box, Truck, 
  TrendingUp, Activity, MessageSquare, Award, Lock, Phone, MessageCircle, Mail, AlertCircle
} from "lucide-react";
import { getPlanFeatures } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { submitReview, trackActivityAction } from "@/lib/supabase/actions";
import { useUser } from "@/lib/supabase/provider";
import Link from "next/link";
import Navbar from "@/components/navbar/navbar";

export default function SupplierPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSupplierData = useCallback(async () => {
    if (!id) return;

    // UUID regex check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn(`SupplierPage: Invalid UUID format for ID: ${id}`);
      setError(`Invalid ID format: ${id}`);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Supplier
      const { data, error: dbError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (dbError) {
        console.error("Error fetching supplier:", dbError);
        setError(`Database error: ${dbError.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        console.warn(`Supplier not found for ID: ${id}`);
        setLoading(false);
        return;
      }

      // 2. Fetch Reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('*, profiles(email, full_name)')
        .eq('supplier_id', id)
        .order('created_at', { ascending: false });

      setSupplier({
        ...data,
        rating: 4.8,
        reviewsCount: revs?.length || 0,
        description: data.description || "High-performance analyzed supplier specializing in scalable production and consistent quality."
      });
      
      setReviews(revs || []);
    } catch (err: any) {
      console.error("Unexpected error fetching supplier data:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSupplierData();

    // Safety timeout to ensure loading spinner is removed
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [fetchSupplierData]);

  const handleAddReview = async () => {
    if (!newComment || submitting) return;
    setSubmitting(true);
    
    const result = await submitReview({
      type: 'supplier',
      id: id as string,
      rating: newRating,
      content: newComment
    });

    if (result.success) {
      // Refresh reviews locally
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

  const plan = profile?.active_plan || "Free";
  const features = getPlanFeatures(plan);
  const ratingStats = [92, 75, 55, 30, 12];

  if ((loading && !supplier) || userLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!supplier) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
       <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle size={32} className="text-red-500" />
       </div>
       <h1 className="text-2xl font-bold mb-2 text-center">Supplier Not Found</h1>
       <p className="text-gray-400 mb-8 max-w-md text-center">
         {error ? error : `We couldn't find a supplier with ID: ${id || 'unknown'}. It may have been removed.`}
       </p>
       <div className="flex gap-4">
         <button 
           onClick={() => router.push('/dashboard')} 
           className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
         >
           Return to Dashboard
         </button>
         <button 
           onClick={() => fetchSupplierData()} 
           className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
         >
           Try Again
         </button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 pb-24">
      <Navbar />

      <div className="pt-28 px-4 md:px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
        
        {/* NAVIGATION BAR */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all group mb-8"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ChevronLeft size={16} />
          </div>
          Back to Results
        </button>

        {/* HERO HEADER */}
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {supplier.name}
                </h1>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <TrendingUp size={14} /> Trending Supplier
                </span>
              </div>

              <p className="text-gray-400 font-medium flex items-center gap-2">
                <GlobeIcon /> {supplier.platform} <span className="text-gray-600">•</span> {supplier.category}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Badge icon={<Box size={14} />} text={`MOQ: ${supplier.moq} Units`} />
                <Badge icon={<ShieldCheck size={14} className="text-green-400" />} text="Verified Supplier" />
                <Badge icon={<Truck size={14} />} text="Fast Fulfillment" />
              </div>

              <p className="text-gray-300 mt-6 text-sm leading-relaxed max-w-3xl">
                {supplier.description}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* DIRECT CONTACT INFO (LOCKED) */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-red-500" size={20} />
                  <h2 className="text-lg font-semibold">Direct Factory Access</h2>
                </div>
                {!features.access.directContacts && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20 uppercase tracking-widest">Premium Only</span>
                )}
              </div>

              {features.access.directContacts ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <ContactItem icon={<Phone size={18} />} label="WhatsApp / Phone" value={supplier.contact_info?.phone || "+86 158 XXXX XXXX"} />
                   <ContactItem icon={<MessageCircle size={18} />} label="WeChat ID" value={supplier.contact_info?.wechat || "nexus_partner_01"} />
                   <ContactItem icon={<Mail size={18} />} label="Enterprise Email" value={supplier.contact_info?.email || "sales@factory-direct.com"} />
                </div>
              ) : (
                <div className="text-center py-10 relative">
                  <div className="absolute inset-0 backdrop-blur-md bg-black/20 z-0 rounded-2xl"></div>
                  <div className="relative z-10">
                    <Lock className="mx-auto text-gray-600 mb-4" size={32} />
                    <h3 className="text-xl font-bold mb-2">Unlock Direct Manufacturer Access</h3>
                    <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">Skip the platform fees. Get direct contact details including WhatsApp, WeChat, and private emails for better pricing.</p>
                    <Link href="/dashboard/profile?tab=plan" className="px-8 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      Upgrade to Importateur
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* AI INSIGHTS */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-red-500" size={20} />
                <h2 className="text-lg font-semibold">Nexus AI Insights</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InsightCard title="Profit Score" value="92" highlight={true} subtext="Excellent" />
                <InsightCard title="Est. Margin" value="38%" subtext="Above Average" />
                <InsightCard title="Reliability" value="High" subtext="99.8% Success" />
                <InsightCard title="Delivery" value="5–7 days" subtext="Global Avg" />
              </div>
            </div>

            {/* RATING & STATS */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-8">
                <Award className="text-gray-400" size={20} />
                <h2 className="text-lg font-semibold">Ratings & Reliability</h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                  <span className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                    {supplier.rating}
                  </span>
                  <div className="flex mt-2 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(supplier.rating) ? "text-red-500 fill-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-gray-700"}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Based on {reviews.length} reviews</p>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {ratingStats.map((value, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-8 text-xs font-medium text-gray-400">
                        {5 - i} <Star size={10} className="fill-gray-400" />
                      </div>
                      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* REVIEWS FEED */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-8">
                <MessageSquare className="text-gray-400" size={20} />
                <h2 className="text-lg font-semibold">Community Feed</h2>
              </div>

              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8 italic">No reviews yet. Be the first to share your experience!</p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={i} className="bg-black/30 p-5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-[10px] font-bold border border-red-500/20">
                              {(r.profiles?.full_name || r.profiles?.email)?.[0]?.toUpperCase()}
                           </div>
                           <p className="font-bold text-sm text-gray-200">
                             {r.profiles?.full_name || r.profiles?.email?.split('@')[0] || "Anonymous"}
                           </p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < r.rating ? "text-red-500 fill-red-500" : "text-gray-700"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed italic">&quot;{r.content}&quot;</p>
                      <p className="text-[10px] text-gray-600 mt-3">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (4 cols) - STICKY */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <MessageSquare size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-1">Ready to Source?</h3>
              <p className="text-sm text-gray-400 mb-6">Connect directly to negotiate pricing and request samples.</p>
              <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5 flex justify-between items-center">
                <span className="text-sm text-gray-400">Minimum Order</span>
                <span className="font-bold text-white">{supplier.moq} Units</span>
              </div>
              <button className="w-full py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.8)] hover:bg-red-600 transition-all duration-300">
                Contact Supplier
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <h3 className="text-md font-semibold mb-4">Rate your experience</h3>
              <div className="flex gap-1.5 mb-5 justify-center bg-black/30 py-3 rounded-xl border border-white/5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} onClick={() => setNewRating(i + 1)} className={`w-6 h-6 cursor-pointer transition-all hover:scale-110 ${i < newRating ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-gray-600 hover:text-gray-400"}`} />
                ))}
              </div>
              <textarea 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder="How was the product quality and shipping time?" 
                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all resize-none h-28 mb-4" 
              />
              <button 
                onClick={handleAddReview} 
                disabled={!newComment || submitting} 
                className="w-full py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2 group hover:border-red-500/30 transition-all">
       <div className="flex items-center gap-2 text-gray-500 group-hover:text-red-500 transition-colors">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
       </div>
       <p className="text-white font-mono text-sm break-all">{value}</p>
    </div>
  )
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
      {icon} {text}
    </span>
  );
}

function InsightCard({ title, value, subtext, highlight = false }: { title: string; value: string; subtext: string; highlight?: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between h-full">
      <p className="text-gray-400 text-xs font-medium mb-2">{title}</p>
      <div>
        <p className={`font-bold text-2xl tracking-tight mb-1 ${highlight ? 'text-red-500' : 'text-white'}`}>
          {value}
        </p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{subtext}</p>
      </div>
      {highlight && (
        <div className="h-1 mt-3 bg-black rounded-full overflow-hidden">
          <div className="h-full bg-red-500 w-[92%] shadow-[0_0_8px_rgba(239,68,68,1)]" />
        </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" cy="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
