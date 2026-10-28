"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Filter, User, Menu, MessageCircle } from "lucide-react";
import Link from "next/link";
import { UnreadBadge, useSupportNotifications } from "@/lib/support-notifications";
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
  const { total: supportUnread, adminUnread } = useSupportNotifications();
  // Admins with customer messages waiting go to the admin inbox, everyone else to their chat.
  const supportHref = adminUnread > 0 ? "/admin?tab=Support" : "/dashboard/support";

  const router = useRouter();
  const pathname = usePathname();

  const currentPlan = profile?.active_plan || "Free";
  const features = getPlanFeatures(currentPlan);
  const isPremium = currentPlan !== "Free";

  // Shared icon-button styles (hairline circle; red outline when active).
  const iconBtnClass = "grid h-10 w-10 place-items-center rounded-full border transition";
  const inactiveIcon = `${iconBtnClass} border-white/10 text-white/60 hover:border-white/25 hover:text-white`;
  const activeIcon = `${iconBtnClass} border-red-500/50 text-red-500`;

  const handleUpgrade = () => {
    router.push("/dashboard/profile?tab=plan");
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setNavOpen(false);
  };

  if (!t) return null;

  const navItems = [
    { label: t.navbar?.home || "Home", path: "/dashboard", hot: false },
    { label: t.navbar?.winning || "Winning", path: "/dashboard/winning-products", hot: true },
    { label: t.navbar?.training || "Training", path: "/dashboard/training", hot: false },
  ];

  return (
    <>
      {/* ================= MOBILE NAV (FLOATING PILL) ================= */}
      <div className="fixed bottom-5 left-0 z-50 w-full px-4 font-text md:hidden">
        <div className="mx-auto flex w-full max-w-[260px] items-center justify-between rounded-full border border-white/10 bg-ink/85 px-5 py-2.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <button onClick={() => setNavOpen(true)} aria-label="Menu" className={`relative ${navOpen ? activeIcon : inactiveIcon}`}>
            <Menu size={17} />
            {supportUnread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-ink" aria-label={`${supportUnread} unread`} />}
          </button>
          <button onClick={() => setFilterOpen(true)} aria-label={t.common.filter} className={inactiveIcon}>
            <Filter size={17} />
          </button>
          <button onClick={() => setProfileOpen(true)} aria-label={t.navbar.profile} className={profileOpen ? activeIcon : inactiveIcon}>
            <User size={17} />
          </button>
        </div>
      </div>

      {/* ================= DESKTOP NAV ================= */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.06] bg-ink/80 font-text backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8 lg:h-[72px]">

          {/* LOGO */}
          <button onClick={() => navigateTo("/dashboard")} className="text-lg font-semibold tracking-tight" aria-label="Nexusply">
            <span className="text-white">Nexus</span>
            <span className="text-red-500">ply</span>
          </button>

          {/* NAV LINKS */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] p-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
                    isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.hot && (
                    <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 font-label text-[9px] uppercase tracking-[0.12em] text-red-500">
                      {t.common?.hot || "Hot"}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 lg:gap-3">
            <LanguageSwitcher />

            {/* SEARCH TRIGGER */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 w-64 items-center gap-3 rounded-full border border-white/10 px-4 text-left text-sm text-stone-2 transition hover:border-white/25 xl:flex"
            >
              <Search size={15} className="text-stone" aria-hidden />
              <span className="flex-1 truncate">{t.dashboard?.searchPlaceholder || "Search..."}</span>
              <kbd className="font-label text-[10px] text-stone">⌘K</kbd>
            </button>

            <span className="mx-1 hidden h-6 w-px bg-white/10 md:block" aria-hidden />

            <Link
              href={supportHref}
              aria-label={t.navbar.support}
              title={t.navbar.support}
              className={`relative hidden md:grid ${pathname.startsWith("/dashboard/support") ? activeIcon : inactiveIcon}`}
            >
              <MessageCircle size={17} />
              <UnreadBadge count={supportUnread} className="absolute -right-1 -top-1 ring-2 ring-ink" />
            </Link>

            <button onClick={() => setFilterOpen(true)} aria-label={t.common.filter} className={inactiveIcon}>
              <Filter size={17} />
            </button>

            {/* PROFILE WITH HOVER DROPDOWN */}
            <div className="group relative hidden md:block">
              <button
                onClick={() => setProfileOpen(true)}
                aria-label={t.navbar.profile}
                className={pathname.startsWith("/dashboard/profile") || profileOpen ? activeIcon : inactiveIcon}
              >
                <User size={17} />
              </button>

              <div className="invisible absolute right-0 top-full mt-3 w-72 translate-y-2 opacity-0 transition-all duration-300 ease-out before:absolute before:-top-3 before:right-0 before:h-3 before:w-20 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ProfileDropdown />
              </div>
            </div>

            {/* PLAN BUTTON */}
            <button
              onClick={handleUpgrade}
              className={`hidden h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition sm:flex ${
                isPremium ? "border border-white/15 text-white hover:border-white/30" : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {isPremium ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                  {features.name[lang] || features.name.EN}
                </>
              ) : (
                t.dashboard?.upgrade || "Upgrade Plan"
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ================= OVERLAYS ================= */}
      {searchOpen && <SearchBar close={() => setSearchOpen(false)} />}
      {filterOpen && <FilterPanel close={() => setFilterOpen(false)} />}
      {profileOpen && <ProfileMenu close={() => setProfileOpen(false)} />}
      {navOpen && <MobileNavMenu close={() => setNavOpen(false)} />}
    </>
  );
}
