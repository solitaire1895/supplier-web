"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Filter, User, Zap, Sparkles, Menu } from "lucide-react";
import SearchBar from "./search-bar";
import FilterPanel from "./filter-panel";
import ProfileMenu from "./profile-menu";
import ProfileDropdown from "./profile-dropdown";
import MobileNavMenu from "./mobile-nav-menu";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { getPlanFeatures } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/supabase/provider";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { t, lang } = useI18n();
  const { profile } = useUser();

  const router = useRouter();
  const pathname = usePathname();

  const currentPlan = profile?.active_plan || "Free";
  const features = getPlanFeatures(currentPlan);
  const isPremium = currentPlan !== "Free";

  // Reusable button classes to ensure a premium feel without relying on external CSS
  const iconBtnClass = "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer";
  const inactiveIcon = `${iconBtnClass} bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20`;
  const activeIcon = `${iconBtnClass} bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]`;

  const handleUpgrade = () => {
    router.push("/dashboard/profile?tab=plan");
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setNavOpen(false);
  };

  if (!t) return null;

  return (
    <>
      {/* ================= MOBILE NAV (FLOATING PILL) ================= */}
      <div className="md:hidden fixed bottom-6 left-0 w-full z-50 px-4">
        <div
          className="
          w-full max-w-[320px] mx-auto
          bg-black/60 backdrop-blur-3xl
          border border-white/10
          rounded-full
          px-6 py-3
          flex items-center justify-between
          shadow-[0_20px_40px_rgba(0,0,0,0.5),_0_0_30px_rgba(239,68,68,0.15)]
        "
        >
          {/* MENU / NAV */}
          <button
            onClick={() => setNavOpen(true)}
            className={navOpen ? activeIcon : inactiveIcon}
          >
            <Menu size={18} />
          </button>

          {/* SEARCH */}
          <button onClick={() => setSearchOpen(true)} className={inactiveIcon}>
            <Search size={18} />
          </button>

          {/* FILTER */}
          <button onClick={() => setFilterOpen(true)} className={inactiveIcon}>
            <Filter size={18} />
          </button>

          {/* PROFILE */}
          <button onClick={() => setProfileOpen(true)} className={profileOpen ? activeIcon : inactiveIcon}>
            <User size={18} />
          </button>
        </div>
      </div>

      {/* ================= DESKTOP NAV ================= */}
      <div
        className="
        fixed top-0 left-0 w-full z-50
        bg-black/40 backdrop-blur-2xl
        border-b border-white/5
        transition-all duration-300
      "
      >
        <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between px-6 lg:px-8 py-4">
          
          {/* LOGO */}
          <div
            onClick={() => navigateTo("/dashboard")}
            className="text-xl tracking-tight cursor-pointer flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] transition-all duration-300">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <div className="font-bold">
              <span className="text-white">NEXUS</span>
              <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">PLY</span>
            </div>
          </div>

          {/* NAV LINKS - Fixed visibility on large screens by changing lg:flex to md:flex */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 shadow-inner hidden md:flex">
            {[
              { label: t.navbar?.home || "Home", path: "/dashboard" },
              { label: t.navbar?.winning || "Winning", path: "/dashboard/winning-products" },
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => navigateTo(item.path)}
                  className={`
                    px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center
                    ${isActive 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {item.label}
                  {/* Highlight for Winning Products */}
                  {item.label === t.navbar?.winning && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      {t.common?.hot || "Hot"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-4">
            
            <LanguageSwitcher />

            {/* SEARCH INPUT */}
            <div
              className="
              hidden xl:flex items-center
              bg-white/5 border border-white/10
              rounded-full px-4 py-2.5 w-64
              focus-within:border-red-500/50 focus-within:bg-black/50 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.15)]
              transition-all duration-300 group
            "
            >
              <Search size={16} className="text-gray-500 group-focus-within:text-red-500 transition-colors mr-3" />
              <input
                placeholder={t.dashboard?.searchPlaceholder || "Search..."}
                className="bg-transparent outline-none text-sm text-white placeholder-gray-500 w-full cursor-pointer"
                onClick={() => setSearchOpen(true)}
                readOnly
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-[10px] font-medium text-gray-400">
                ⌘K
              </kbd>
            </div>

            <div className="h-6 w-px bg-white/10 hidden md:block mx-1"></div>

            {/* FILTER */}
            <button onClick={() => setFilterOpen(true)} className={inactiveIcon}>
              <Filter size={18} />
            </button>

            {/* PROFILE WITH HOVER DROPDOWN */}
            <div className="relative group hidden md:block">
              <button 
                onClick={() => setProfileOpen(true)} 
                className={pathname.startsWith("/dashboard/profile") || profileOpen ? activeIcon : inactiveIcon}
              >
                <User size={18} />
              </button>

              <div
                className="
                absolute right-0 top-full mt-4 w-72
                opacity-0 invisible translate-y-2
                group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                transition-all duration-300 ease-out
                before:absolute before:-top-4 before:right-0 before:w-20 before:h-4 before:bg-transparent
              "
              >
                <ProfileDropdown />
              </div>
            </div>

            {/* CTA BUTTON */}
            <button
              onClick={handleUpgrade}
              className={`
              hidden sm:flex items-center gap-2
              px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300
              ${isPremium 
                ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" 
                : "bg-red-500 text-white border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.7)] hover:bg-red-600"
              }
            `}
            >
              {isPremium ? (
                <>
                  <Sparkles size={16} className="text-red-500 fill-red-500" />
                  {features.name[lang] || features.name.EN}
                </>
              ) : (
                t.dashboard?.upgrade || "Upgrade Plan"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= OVERLAYS ================= */}
      {searchOpen && <SearchBar close={() => setSearchOpen(false)} />}
      {filterOpen && <FilterPanel close={() => setFilterOpen(false)} />}
      {profileOpen && <ProfileMenu close={() => setProfileOpen(false)} />}
      {navOpen && <MobileNavMenu close={() => setNavOpen(false)} />}
    </>
  );
}
