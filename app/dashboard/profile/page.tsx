"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import ProfileSidebar, { ProfileMobileNav } from "@/components/dashboard/profile-sidebar";
import SupplierCard from "@/components/dashboard/supplier-card";
import ProductCard from "@/components/dashboard/product-card";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, ChevronDown, Star, User, Globe, Loader2, Shield, AlertCircle } from "lucide-react";
import { DisplayHeading, SectionLabel } from "@/components/landing/primitives";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/provider";
import { PLANS, type PaidPlan } from "@/lib/plans";
import { usePlanCheckout } from "@/lib/use-plan-checkout";
import { useBillingCountry } from "@/lib/use-billing-country";
import CountrySelect from "@/components/billing/country-select";

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
  const { user, profile: userProfile, loading: userLoading, refreshProfile } = useUser();
  const { startCheckout, pendingPlan, error: checkoutError } = usePlanCheckout();
  const { countries: billingCountries, country: billingCountry, setCountry: setBillingCountry, priceLabel } = useBillingCountry();

  // Keep activeTab in state but always sync it from the URL so query-only
  // navigations (e.g. ?tab=plan from the navbar) reliably update the view.
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "contacts");

  useEffect(() => {
    const urlTab = searchParams.get("tab") || "contacts";
    setActiveTab(urlTab);
  }, [searchParams]);

  // Refresh the profile whenever the user (re-)lands on this page while
  // authenticated, so a plan applied by the payment webhook after the
  // session was loaded (active_plan / plan_expires_at) shows up.
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [favoriteSuppliers, setFavoriteSuppliers] = useState<any[]>([]);
  const [contactedSuppliers, setContactedSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      type: 'explorateur' as PaidPlan,
      description: PLANS.explorateur.description[lang] || PLANS.explorateur.description.EN,
      features: t.pricing.plans.basic.features,
    },
    {
      name: PLANS.importateur.name[lang] || PLANS.importateur.name.EN,
      type: 'importateur' as PaidPlan,
      description: PLANS.importateur.description[lang] || PLANS.importateur.description.EN,
      features: t.pricing.plans.standard.features,
      popular: true,
    },
    {
      name: PLANS.partenaire.name[lang] || PLANS.partenaire.name.EN,
      type: 'partenaire' as PaidPlan,
      description: PLANS.partenaire.description[lang] || PLANS.partenaire.description.EN,
      features: t.pricing.plans.premium.features,
    }
  ];

  // Show spinner while auth is resolving or data is loading for a confirmed user.
  if (userLoading || (loading && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Only show the login wall when we are certain there is no authenticated user.
  if (!user) {
    return (
      <div className="editorial flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="mb-5 text-red-500" size={28} />
        <h1 className="mb-6 font-display text-3xl font-light">{t.profile.notLoggedIn}</h1>
        <button onClick={() => router.push("/auth/login")} className="rounded-full bg-red-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-red-600">{t.profile.login}</button>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/profile?tab=${tab}`, { scroll: false });
  };

  const tabTitle =
    activeTab === "contacts" ? t.profile.contacts
    : activeTab === "fav-suppliers" ? t.profile.favoritesSuppliers
    : activeTab === "fav-products" ? t.profile.favoritesProducts
    : activeTab === "settings" ? t.profile.settings
    : t.profile.plan;

  const daysLeft = getDaysRemaining(userProfile?.plan_expires_at);
  const currentPlanName =
    (userProfile?.active_plan && PLANS[userProfile.active_plan as keyof typeof PLANS]?.name[lang]) ||
    userProfile?.active_plan ||
    t.common.free;

  return (
    <div className="editorial min-h-screen selection:bg-red-500/30 md:flex">
      {/* MOBILE: sticky header + tab bar (replaces the sidebar on small screens) */}
      <ProfileMobileNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* SIDEBAR (md and up) */}
      <ProfileSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* CONTENT */}
      <div className={`${sidebarExpanded ? "md:ml-64" : "md:ml-20"} w-full min-w-0 px-4 py-8 transition-[margin] duration-300 sm:px-8 md:py-10 lg:px-12 lg:py-14`}>

        {/* HEADER */}
        <header key={activeTab} className="mb-12 border-b border-white/[0.08] pb-8 animate-in fade-in slide-in-from-bottom-1 duration-500">
          <SectionLabel>{t.navbar.profile}</SectionLabel>
          <DisplayHeading as="h1" className="mt-4 text-4xl leading-[1.05] sm:text-5xl">
            {tabTitle}
          </DisplayHeading>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone sm:text-base">{t.profile.subtitle}</p>
        </header>

        <div key={`body-${activeTab}`} className="animate-in fade-in duration-500">
          {/* The plan and settings tabs don't depend on favorites/contacts data,
              so we never block them behind the loading spinner. */}
          {loading && activeTab !== "plan" && activeTab !== "settings" ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {/* ================= CONTACTED SUPPLIERS ================= */}
              {activeTab === "contacts" && (
                contactedSuppliers.length === 0 ? (
                  <Empty text={t.profile.emptyContacts} icon={<Globe size={20} />} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {contactedSuppliers.map((supplier, i) => (
                      <SupplierCard key={supplier.id ?? i} supplier={supplier} />
                    ))}
                  </div>
                )
              )}

              {/* ================= FAVORITE PRODUCTS ================= */}
              {activeTab === "fav-products" && (
                favoriteProducts.length === 0 ? (
                  <Empty text={t.profile.emptyFavProducts} icon={<Star size={20} />} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favoriteProducts.map((p, i) => (
                      <ProductCard key={p.id ?? i} product={p} />
                    ))}
                  </div>
                )
              )}

              {/* ================= FAVORITE SUPPLIERS ================= */}
              {activeTab === "fav-suppliers" && (
                favoriteSuppliers.length === 0 ? (
                  <Empty text={t.profile.emptyFavSuppliers} icon={<Shield size={20} />} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favoriteSuppliers.map((s, i) => (
                      <SupplierCard key={s.id ?? i} supplier={s} />
                    ))}
                  </div>
                )
              )}

              {/* ================= SETTINGS ================= */}
              {activeTab === "settings" && (
                <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
                  <Box title={t.settings.account} icon={<User size={16} />}>
                    <Field label={t.settings.email}>
                      <input
                        type="email"
                        disabled
                        value={userProfile?.email || ""}
                        className="w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-ink px-4 py-3 text-sm text-white/60"
                      />
                    </Field>
                    <Field label={t.settings.role}>
                      <input
                        disabled
                        value={userProfile?.role || "user"}
                        className="w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-ink px-4 py-3 text-sm capitalize text-white/60"
                      />
                    </Field>
                  </Box>

                  <Box title={t.settings.language} icon={<Globe size={16} />}>
                    <Field label={t.settings.language}>
                      <div className="relative">
                        <select
                          value={lang}
                          onChange={(e) => updateSetting("language", e.target.value)}
                          className="w-full appearance-none rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white transition focus:border-red-500/50 focus:outline-none"
                        >
                          <option value="FR" className="bg-ink">Français (FR)</option>
                          <option value="EN" className="bg-ink">English (US)</option>
                          <option value="CN" className="bg-ink">中文 (CN)</option>
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone" aria-hidden />
                      </div>
                    </Field>
                  </Box>
                </div>
              )}

              {/* ================= PLAN ================= */}
              {activeTab === "plan" && (
                <div className="max-w-6xl">

                  {/* Current status (hairline strip) */}
                  <dl className="mb-12 grid border-y border-white/[0.08] sm:grid-cols-2">
                    <div className="py-6 sm:pr-6">
                      <dt className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">{t.profile.currentPlan}</dt>
                      <dd className="mt-3 flex items-center gap-3">
                        <span className="font-display text-4xl font-light text-white">{currentPlanName}</span>
                        <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-label text-[10px] uppercase tracking-[0.12em] text-white/70">
                          {userProfile?.subscription_status || t.common.active}
                        </span>
                      </dd>
                    </div>

                    {userProfile?.plan_expires_at && userProfile.subscription_status === "active" && (
                      <>
                        <div className="border-t border-white/[0.08] py-6 sm:border-l sm:border-t-0 sm:px-6">
                          <dt className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">{t.subscription.expiresIn}</dt>
                          <dd className="mt-3 font-display text-4xl font-light text-white">
                            {daysLeft === null ? "—" : daysLeft}{" "}
                            <span className="font-text text-sm text-stone">{t.dashboardUi.supplier.days}</span>
                          </dd>
                          <dd className="mt-1 font-label text-[11px] text-stone-2">
                            {new Date(userProfile.plan_expires_at).toLocaleDateString(lang === "FR" ? "fr-FR" : lang === "CN" ? "zh-CN" : "en-US")}
                          </dd>
                        </div>
                      </>
                    )}

                    {/* Trial countdown (kept for backward compatibility) */}
                    {userProfile?.trial_ends_at && userProfile.subscription_status === "trialing" && (
                      <div className="border-t border-white/[0.08] py-6 sm:border-l sm:border-t-0 sm:px-6">
                        <dt className="font-label text-[10px] uppercase tracking-[0.18em] text-stone">{t.profile.trialEnds}</dt>
                        <dd className="mt-3 font-display text-4xl font-light text-white">
                          {new Date(userProfile.trial_ends_at).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {checkoutError && (
                    <p role="alert" className="mb-6 text-sm text-red-400">{t.subscription.checkoutError}</p>
                  )}

                  <div className="mb-10">
                    <CountrySelect
                      countries={billingCountries}
                      value={billingCountry.iso}
                      onChange={setBillingCountry}
                      lang={lang}
                      label={t.subscription.payFrom}
                    />
                  </div>

                  {/* Pricing cards */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {pricingPlans.map((plan) => {
                      const isActive = userProfile?.active_plan?.toLowerCase() === plan.type.toLowerCase();
                      return (
                        <div
                          key={plan.name}
                          className={`relative flex flex-col rounded-2xl border p-8 transition-colors duration-500 ${
                            plan.popular
                              ? "border-red-500/50 bg-gradient-to-b from-red-500/[0.08] to-ink-2 shadow-[0_30px_80px_-40px_rgba(239,68,68,0.6)]"
                              : "border-white/[0.08] bg-ink-2 hover:border-white/20"
                          }`}
                        >
                          {plan.popular && (
                            <span className="absolute -top-3 left-8 rounded-full bg-red-500 px-3 py-1 font-label text-[10px] uppercase tracking-[0.15em] text-white">
                              {t.profile.mostPopular}
                            </span>
                          )}
                          {isActive && (
                            <span className="absolute right-6 top-6 rounded-full border border-white/15 px-2.5 py-0.5 font-label text-[10px] uppercase tracking-[0.12em] text-white/80">
                              {t.profile.currentPlanBtn}
                            </span>
                          )}

                          <p className="font-label text-[11px] uppercase tracking-[0.18em] text-stone">{plan.name}</p>
                          <p className="mt-3 min-h-10 text-sm leading-relaxed text-stone">{plan.description}</p>

                          <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="font-display text-5xl font-light tracking-[-0.02em] text-white">{priceLabel(plan.type, lang)}</span>
                            <span className="whitespace-nowrap text-sm text-stone">{t.landing.pricing.perMonth}</span>
                          </p>

                          <ul className="mt-8 flex-1 space-y-3.5 border-t border-white/[0.08] pt-8">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm leading-snug text-white/75">
                                <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${plan.popular ? "text-red-500" : "text-white/40"}`} aria-hidden />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => startCheckout(plan.type, billingCountry.iso)}
                            disabled={pendingPlan !== null}
                            className={`mt-10 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                              plan.popular && !isActive
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/10"
                            }`}
                          >
                            {pendingPlan === plan.type && <Loader2 size={16} className="animate-spin" />}
                            {pendingPlan === plan.type
                              ? t.subscription.redirecting
                              : isActive
                                ? t.subscription.renew
                                : `${t.profile.upgradeTo} ${plan.name}`}
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
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

/* ================= UI COMPONENTS ================= */
function Box({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-ink-2 p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-white/[0.08] pb-5">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-stone">{icon}</span>
        <h2 className="font-display text-2xl font-light text-white">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-label text-[10px] uppercase tracking-[0.18em] text-stone-2">{label}</span>
      {children}
    </label>
  );
}

function Empty({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
      <span className="mb-5 grid h-11 w-11 place-items-center rounded-full border border-white/10 text-stone">{icon}</span>
      <p className="max-w-sm text-sm leading-relaxed text-stone">{text}</p>
    </div>
  );
}

function getDaysRemaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
