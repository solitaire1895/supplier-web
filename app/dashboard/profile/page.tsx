"use client";

import { useState, useEffect } from "react";
import ProfileSidebar from "@/components/dashboard/profile-sidebar";
import SupplierCard from "@/components/dashboard/supplier-card";
import ProductCard from "@/components/dashboard/product-card";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Zap, Shield, CreditCard, Star, User, Bell, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

import { PLANS, PlanType } from "@/lib/plans";

/* ================= SETTINGS ================= */
const SETTINGS_KEY = "nexusply_settings";

/* ================= PAGE ================= */
export default function ProfilePage() {
  const { t, lang, setLanguage } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("contacts");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [favoriteSuppliers, setFavoriteSuppliers] = useState<any[]>([]);
  const [contactedSuppliers, setContactedSuppliers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  /* INITIALIZATION */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // Fetch Favorites
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select(`
          products (*),
          suppliers (*)
        `)
        .eq('user_id', user.id);

      if (favorites) {
        setFavoriteProducts(favorites.map(f => f.products).filter(Boolean));
        setFavoriteSuppliers(favorites.map(f => f.suppliers).filter(Boolean));
      }

      // Contacted suppliers (placeholder for now, as we don't have a messages/leads table yet)
      setContactedSuppliers([]);

      setLoading(false);
    };

    loadData();
  }, [activeTab]); // Reload when tab changes to ensure fresh data

  const updateSetting = async (key: string, value: any) => {
    if (!profile) return;
    
    // For now, we only update specific fields in Supabase
    const updates: any = {};
    if (key === "username") updates.email = value; // Placeholder as we don't have username in schema yet
    
    // Update local state first
    setProfile({ ...profile, ...updates });

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
      features: lang === "FR" ? [
        "Téléphones entrée et milieu de gamme",
        "Calculatrice basique",
        "1 produit gagnant/mois (48h délai)",
        "Fournisseurs plateformes uniquement",
        "Canal WhatsApp communauté"
      ] : lang === "CN" ? [
        "入门级和中端手机",
        "基础计算器",
        "每月1个爆款产品（48小时延迟）",
        "仅限平台供应商",
        "社区WhatsApp频道"
      ] : [
        "Entry-level and mid-range phones",
        "Basic calculator",
        "1 winning product/month (48h delay)",
        "Platform suppliers only",
        "Community WhatsApp channel"
      ],
    },
    {
      name: PLANS.importateur.name[lang] || PLANS.importateur.name.EN,
      type: 'importateur' as PlanType,
      price: { monthly: PLANS.importateur.price, yearly: Math.round(PLANS.importateur.price * 0.8) },
      description: PLANS.importateur.description[lang] || PLANS.importateur.description.EN,
      features: lang === "FR" ? [
        "Téléphones milieu et haut de gamme",
        "Tablettes toutes marques",
        "Ordinateurs standards et gaming entrée",
        "Calculatrice complète",
        "Produits gagnants en temps réel",
        "Fournisseurs direct contacts",
      ] : lang === "CN" ? [
        "中高端手机",
        "所有品牌平板电脑",
        "标准及入门级游戏电脑",
        "完整版计算器",
        "实时爆款产品",
        "供应商直接联系方式",
      ] : [
        "Mid-range and high-end phones",
        "All brand tablets",
        "Standard and entry gaming computers",
        "Complete calculator",
        "Real-time winning products",
        "Direct supplier contacts",
      ],
      popular: true,
    },
    {
      name: PLANS.partenaire.name[lang] || PLANS.partenaire.name.EN,
      type: 'partenaire' as PlanType,
      price: { monthly: PLANS.partenaire.price, yearly: Math.round(PLANS.partenaire.price * 0.8) },
      description: PLANS.partenaire.description[lang] || PLANS.partenaire.description.EN,
      features: lang === "FR" ? [
        "Tous les téléphones & tablettes",
        "Tous les ordinateurs (haut de gamme)",
        "Calculatrice full + estimation pub",
        "Produits gagnants en avant-première",
        "Accès prioritaire nouveaux fournisseurs",
        "Canal WhatsApp prioritaire"
      ] : lang === "CN" ? [
        "所有手机和平板电脑",
        "所有电脑（高端）",
        "全功能计算器+广告估算",
        "爆款产品抢先看",
        "新供应商优先访问权",
        "优先WhatsApp频道"
      ] : [
        "All phones & tablets",
        "All computers (high-end)",
        "Full calculator + ad estimation",
        "Preview winning products",
        "Priority access to new suppliers",
        "Priority WhatsApp channel"
      ],
    }
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex selection:bg-red-500/30">
      {/* SIDEBAR */}
      <ProfileSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* CONTENT */}
      <div className={`${sidebarExpanded ? "ml-64" : "ml-20"} w-full p-8 lg:p-12 transition-all duration-300`}>
        
        {/* HEADER */}
        <div className="mb-12 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === "contacts" && (t?.profile?.contacts || "Contacted Suppliers")}
            {activeTab === "fav-suppliers" && (t?.profile?.favoritesSuppliers || "Favorite Suppliers")}
            {activeTab === "fav-products" && (t?.profile?.favoritesProducts || "Favorite Products")}
            {activeTab === "settings" && (t?.profile?.settings || "Account Settings")}
            {activeTab === "plan" && (t?.profile?.plan || "Subscription & Billing")}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {t?.profile?.subtitle || "Manage your preferences and platform data."}
          </p>
        </div>

        <div className="animate-in fade-in duration-500">
          {loading ? (
             <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
             </div>
          ) : (
            <>
              {/* ================= CONTACTED SUPPLIERS ================= */}
              {activeTab === "contacts" && (
                <>
                  {contactedSuppliers.length === 0 ? (
                    <Empty text="You haven't contacted any suppliers yet." icon={<Globe size={40} className="mb-4 text-gray-600" />} />
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
                    <Empty text="You haven't saved any winning products yet." icon={<Star size={40} className="mb-4 text-gray-600" />} />
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
                    <Empty text="No favorite suppliers yet. Start sourcing!" icon={<Shield size={40} className="mb-4 text-gray-600" />} />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {favoriteSuppliers.map((s, i) => (
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
                    <Box title={t?.settings?.account || "Profile Information"} icon={<User size={18} className="text-gray-400"/>}>
                      <div className="space-y-4 mt-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Email Address</label>
                          <input
                            type="email"
                            disabled
                            value={profile?.email || ""}
                            className="w-full p-3 rounded-xl bg-black/50 border border-white/10 opacity-60 cursor-not-allowed text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Role</label>
                          <input
                            disabled
                            value={profile?.role || "user"}
                            className="w-full p-3 rounded-xl bg-black/50 border border-white/10 opacity-60 cursor-not-allowed text-sm capitalize"
                          />
                        </div>
                      </div>
                    </Box>

                    <div className="space-y-6">
                      <Box title={t?.settings?.language || "Localization"} icon={<Globe size={18} className="text-gray-400"/>}>
                        <div className="mt-2 relative">
                          <select
                            value={lang}
                            onChange={(e) => updateSetting("language", e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 rounded-xl appearance-none focus:border-red-500/50 focus:outline-none transition-all text-sm"
                          >
                            <option value="EN">English (US)</option>
                            <option value="FR">Français (FR)</option>
                            <option value="CN">中文 (CN)</option>
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
                        <p className="text-gray-400 text-sm">{lang === "FR" ? "Abonnement actuel" : lang === "CN" ? "当前方案" : "Current Active Plan"}</p>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold uppercase">{profile?.active_plan || "Free"}</h2>
                          <span className="bg-white/10 text-xs px-2 py-1 rounded-md text-gray-300 capitalize">{profile?.subscription_status || "Active"}</span>
                        </div>
                      </div>
                    </div>
                    {profile?.trial_ends_at && profile.subscription_status === 'trialing' && (
                      <div className="text-left md:text-right">
                        <p className="text-sm text-gray-400">{lang === "FR" ? "Fin de l'essai" : lang === "CN" ? "试用结束" : "Trial Ends"}</p>
                        <p className="font-medium">{new Date(profile.trial_ends_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pricingPlans.map((plan) => {
                      const isActive = profile?.active_plan?.toLowerCase() === plan.name.toLowerCase();
                      
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
                              <Zap size={12} /> {lang === "FR" ? "PLUS POPULAIRE" : lang === "CN" ? "最受欢迎" : "MOST POPULAR"}
                            </div>
                          )}

                          <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                            <p className="text-gray-400 text-sm h-10">{plan.description}</p>
                          </div>

                          <div className="mb-8">
                            <span className="text-3xl font-bold tracking-tight">{plan.price[billingCycle].toLocaleString()} FCFA</span>
                            <span className="text-gray-500 text-sm">/{lang === "FR" ? "mois" : lang === "CN" ? "月" : "mo"}</span>
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
                            {isActive ? (lang === "FR" ? "Plan actuel" : lang === "CN" ? "当前方案" : "Current Plan") : (lang === "FR" ? `Choisir ${plan.name}` : lang === "CN" ? `选择 ${plan.name}` : `Upgrade to ${plan.name}`)}
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
