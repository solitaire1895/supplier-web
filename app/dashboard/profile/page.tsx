"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import ProfileSidebar from "@/components/dashboard/profile-sidebar";
import SupplierCard from "@/components/dashboard/supplier-card";
import ProductCard from "@/components/dashboard/product-card";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Zap, CreditCard, Star, User, Globe, Loader2, Package, Shield, Phone, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/provider";
import { PLANS, PlanType } from "@/lib/plans";

/* ================= SETTINGS ================= */
const SETTINGS_KEY = "nexusply_settings";

/* Helper to log Supabase errors with useful detail instead of "{}" */
function logSupabaseError(context: string, error: any) {
  const info: Record<string, any> = {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  };

  const hasStandard = Object.values(info).some((v) => v !== undefined && v !== null);

  if (!hasStandard) {
    try {
      info.raw = typeof error === "string" ? error : JSON.stringify(error);
    } catch {
      info.raw = String(error);
    }
    info.toString = error?.toString?.();
    if (error && typeof error === "object") {
      info.keys = Object.keys(error);
    }
  }

  console.error(context, info);
}

function ProfileContent() {
  const { t, lang, setLanguage } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Pull both `user` (auth session) and `profile` (DB row) from the provider.
  const { user, profile: userProfile, loading: userLoading } = useUser();

  // Keep activeTab in state but always sync it from the URL so query-only
  // navigations (e.g. ?tab=plan from the navbar) reliably update the view.
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "contacts");

  useEffect(() => {
    const urlTab = searchParams.get("tab") || "contacts";
    setActiveTab(urlTab);
  }, [searchParams]);

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [favoriteSuppliers, setFavoriteSuppliers] = useState<any[]>([]);
  const [contactedSuppliers, setContactedSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const loadFavorites = useCallback(async (userId: string) => {
    try {
      const { data: favorites, error } = await supabase
        .from('user_favorites')
        .select(`
          products (*),
          suppliers (*)
        `)
        .eq('user_id', userId);

      if (error) {
        logSupabaseError("Error loading favorites:", error);
        return;
      }

      if (favorites) {
        const products = favorites
          .map((f: any) => (Array.isArray(f.products) ? f.products[0] : f.products))
          .filter(Boolean);
        const suppliers = favorites
          .map((f: any) => (Array.isArray(f.suppliers) ? f.suppliers[0] : f.suppliers))
          .filter(Boolean);

        setFavoriteProducts(products);
        setFavoriteSuppliers(suppliers);
      }
    } catch (err) {
      logSupabaseError("Error loading favorites:", err);
    }
  }, []);

  const loadContactedSuppliers = useCallback(async (userId: string) => {
    try {
      const { data: requests, error: reqError } = await supabase
        .from('sourcing_requests')
        .select('supplier_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (reqError) {
        logSupabaseError("Error loading contacted suppliers (requests):", reqError);
        return;
      }

      const supplierIds: string[] = [];
      const seenIds = new Set<string>();
      (requests || []).forEach((r: any) => {
        if (r?.supplier_id && !seenIds.has(r.supplier_id)) {
          supplierIds.push(r.supplier_id);
          seenIds.add(r.supplier_id);
        }
      });

      if (supplierIds.length === 0) {
        setContactedSuppliers([]);
        return;
      }

      const { data: suppliers, error: supError } = await supabase
        .from('suppliers')
        .select('*')
        .in('id', supplierIds);

      if (supError) {
        logSupabaseError("Error loading contacted suppliers (suppliers):", supError);
        return;
      }

      const supplierMap = new Map<string, any>();
      (suppliers || []).forEach((s: any) => supplierMap.set(s.id, s));

      const ordered = supplierIds
        .map((id) => supplierMap.get(id))
        .filter(Boolean);

      setContactedSuppliers(ordered);
    } catch (err) {
      logSupabaseError("Error loading contacted suppliers:", err);
    }
  }, []);

  /* INITIALIZATION — gate on `user` (auth session), not `userProfile` (DB row).
     This prevents the false "Please log in" screen when the profile row is
     transiently null while the session is perfectly valid. */
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const initPage = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadFavorites(user.id),
          loadContactedSuppliers(user.id)
        ]);
      } catch (err) {
        logSupabaseError("Error initializing profile page:", err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [user, userLoading, loadFavorites, loadContactedSuppliers]);

  const updateSetting = async (key: string, value: any) => {
    if (!user) return;

    if (key === "language") {
      setLanguage(value as any);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: value }));
    }
  };

  const pricingPlans = [
    {
      name: PLANS.explorateur.name[lang] || PLANS.explorateur.name.EN,
      type: 'explorateur' as PlanType,
      price: { monthly: PLANS.explorateur.price, yearly: Math.round(PLANS.explorateur.price * 0.8) },
      description: PLANS.explorateur.description[lang] || PLANS.explorateur.description.EN,
      features: t.pricing.plans.basic.features,
    },
    {
      name: PLANS.importateur.name[lang] || PLANS.importateur.name.EN,
      type: 'importateur' as PlanType,
      price: { monthly: PLANS.importateur.price, yearly: Math.round(PLANS.importateur.price * 0.8) },
      description: PLANS.importateur.description[lang] || PLANS.importateur.description.EN,
      features: t.pricing.plans.standard.features,
      popular: true,
    },
    {
      name: PLANS.partenaire.name[lang] || PLANS.partenaire.name.EN,
      type: 'partenaire' as PlanType,
      price: { monthly: PLANS.partenaire.price, yearly: Math.round(PLANS.partenaire.price * 0.8) },
      description: PLANS.partenaire.description[lang] || PLANS.partenaire.description.EN,
      features: t.pricing.plans.premium.features,
    }
  ];

  // Show spinner while auth is resolving or data is loading for a confirmed user.
  if (userLoading || (loading && !user)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  // Only show the login wall when we are certain there is no authenticated user.
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h1 className="text-xl font-bold mb-4">{t.profile.notLoggedIn}</h1>
        <button onClick={() => router.push("/auth/login")} className="px-8 py-3 bg-red-500 rounded-xl font-bold">{t.profile.login}</button>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/profile?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-black text-white flex selection:bg-red-500/30">
      {/* SIDEBAR */}
      <ProfileSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* CONTENT */}
      <div className={`${sidebarExpanded ? "ml-64" : "ml-20"} w-full p-8 lg:p-12 transition-all duration-300`}>
        
        {/* HEADER */}
        <div className="mb-12 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            {activeTab === "contacts" && t.profile.contacts}
            {activeTab === "fav-suppliers" && t.profile.favoritesSuppliers}
            {activeTab === "fav-products" && t.profile.favoritesProducts}
            {activeTab === "settings" && t.profile.settings}
            {activeTab === "plan" && t.profile.plan}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {t.profile.subtitle}
          </p>
        </div>

        <div className="animate-in fade-in duration-500">
          {/* The plan and settings tabs don't depend on favorites/contacts data,
              so we never block them behind the loading spinner. */}
          {loading && activeTab !== "plan" && activeTab !== "settings" ? (
             <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
             </div>
          ) : (
            <>
              {/* ================= CONTACTED SUPPLIERS ================= */}
              {activeTab === "contacts" && (
                <>
                  {contactedSuppliers.length === 0 ? (
                    <Empty text={t.profile.emptyContacts} icon={<Globe size={40} className="mb-4 text-gray-600" />} />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {contactedSuppliers.map((supplier, i) => (
                        <SupplierCard key={i} supplier={supplier} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ================= FAVORITE PRODUCTS ================= */}
              {activeTab === "fav-products" && (
                <>
                  {favoriteProducts.length === 0 ? (
                    <Empty text={t.profile.emptyFavProducts} icon={<Star size={40} className="mb-4 text-gray-600" />} />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {favoriteProducts.map((p, i) => (
                        <ProductCard key={i} product={p} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ================= FAVORITE SUPPLIERS ================= */}
              {activeTab === "fav-suppliers" && (
                <>
                  {favoriteSuppliers.length === 0 ? (
                    <Empty text={t.profile.emptyFavSuppliers} icon={<Shield size={40} className="mb-4 text-gray-600" />} />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{favoriteSuppliers.map((s, i) => (
                        <SupplierCard key={i} supplier={s} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ================= SETTINGS ================= */}
              {activeTab === "settings" && (
                <div className="max-w-3xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Box title={t.settings.account} icon={<User size={18} className="text-gray-400"/>}>
                      <div className="space-y-4 mt-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">{t.settings.email}</label>
                          <input
                            type="email"
                            disabled
                            value={userProfile?.email || ""}
                            className="w-full p-3 rounded-xl bg-black/50 border border-white/10 opacity-60 cursor-not-allowed text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">{t.settings.role}</label>
                          <input
                            disabled
                            value={userProfile?.role || "user"}
                            className="w-full p-3 rounded-xl bg-black/50 border border-white/10 opacity-60 cursor-not-allowed text-sm capitalize"
                          />
                        </div>
                      </div>
                    </Box>

                    <div className="space-y-6">
                      <Box title={t.settings.language} icon={<Globe size={18} className="text-gray-400"/>}>
                        <div className="mt-2 relative">
                          <select
                            value={lang}
                            onChange={(e) => updateSetting("language", e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 rounded-xl appearance-none focus:border-red-500/50 focus:outline-none transition-all text-sm text-white"
                          >
                            <option value="EN" className="bg-black">English (US)</option>
                            <option value="FR" className="bg-black">Français (FR)</option>
                            <option value="CN" className="bg-black">中文 (CN)</option>
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
                            ▼
                          </div>
                        </div>
                      </Box>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PLAN ================= */}
              {activeTab === "plan" && (
                <div className="max-w-6xl">
                  
                  {/* Current Status Bar */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                        <CreditCard className="text-red-500" size={24} />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{t.profile.currentPlan}</p>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold uppercase">{userProfile?.active_plan || t.common.free}</h2>
                          <span className="bg-white/10 text-xs px-2 py-1 rounded-md text-gray-300 capitalize">{userProfile?.subscription_status || t.common.active}</span>
                        </div>
                      </div>
                    </div>
                    {userProfile?.trial_ends_at && userProfile.subscription_status === 'trialing' && (
                      <div className="text-left md:text-right">
                        <p className="text-sm text-gray-400">{t.profile.trialEnds}</p>
                        <p className="font-medium">{new Date(userProfile.trial_ends_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pricingPlans.map((plan) => {
                      const isActive = userProfile?.active_plan?.toLowerCase() === plan.type.toLowerCase();
                      
                      return (
                        <div 
                          key={plan.name} 
                          className={`relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 flex flex-col transition-all duration-500
                            ${plan.popular ? 'border border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.15)] -translate-y-2' : 'border border-white/10 hover:border-white/30'}
                          `}
                        >
                          {/* Glow effect for Pro card */}
                          {plan.popular && (
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                          )}

                          {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-1">
                              <Zap size={12} /> {t.profile.mostPopular}
                            </div>
                          )}

                          <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                            <p className="text-gray-400 text-sm h-10">{plan.description}</p>
                          </div>

                          <div className="mb-8">
                            <span className="text-3xl font-bold tracking-tight">{plan.price[billingCycle].toLocaleString()} FCFA</span>
                            <span className="text-gray-500 text-sm">/{t.common.month}</span>
                          </div>

                          <ul className="space-y-4 mb-10 flex-1">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className={plan.popular ? "text-red-500 shrink-0" : "text-gray-500 shrink-0"} />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => router.push('/dashboard/subscribe')}
                            disabled={isActive}
                            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all
                              ${isActive 
                                ? 'bg-white/10 text-gray-400 cursor-not-allowed' 
                                : plan.popular 
                                  ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:bg-red-600' 
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }
                            `}
                          >
                            {isActive ? t.profile.currentPlanBtn : `${t.profile.upgradeTo} ${plan.name}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

/* ================= UI COMPONENTS ================= */
function Box({ title, icon, children }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-medium text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Empty({ text, icon }: { text: string, icon?: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
      {icon}
      <p className="text-gray-400 font-medium">{text}</p>
    </div>
  );
}
