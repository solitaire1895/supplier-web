"use client";

import {
  Star,
  Package,
  Phone,
  Settings,
  LogOut,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/supabase/provider";
import { logoutAndRedirect } from "@/lib/logout";
import { useI18n } from "@/lib/i18n";

/** Profile tabs, shared by the desktop sidebar and the mobile tab bar. */
function useProfileTabs() {
  const { t } = useI18n();
  return [
    { id: "contacts", label: t.profile.contacted, icon: Phone },
    { id: "fav-suppliers", label: t.profile.favoritesSuppliers, icon: Star },
    { id: "fav-products", label: t.profile.favoritesProducts, icon: Package },
    { id: "settings", label: t.profile.settings, icon: Settings },
    { id: "plan", label: t.profile.plan, icon: CreditCard },
  ];
}

export default function ProfileSidebar({
  activeTab,
  setActiveTab,
  expanded,
  setExpanded,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  const router = useRouter();
  const { profile } = useUser();
  const { t } = useI18n();

  // Resilient logout: never freezes on a hung network call, always clears
  // the local session and hard-navigates to the login page.
  const handleLogout = () => logoutAndRedirect();

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const tabs = useProfileTabs();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col md:flex justify-between border-r border-white/[0.06] bg-ink p-3 font-text transition-[width] duration-300 ease-out ${
        expanded ? "w-64" : "w-20"
      }`}
    >
      <div>
        {/* LOGO + BACK */}
        <div className="mb-8 flex h-12 items-center justify-between px-3">
          <button onClick={() => router.push("/dashboard")} className="text-lg font-semibold tracking-tight" aria-label="Nexusply">
            {expanded ? (
              <>
                <span className="text-white">Nexus</span>
                <span className="text-red-500">ply</span>
              </>
            ) : (
              <span className="font-display text-2xl font-light text-white">
                N<span className="text-red-500">.</span>
              </span>
            )}
          </button>
          {expanded && (
            <button
              onClick={() => router.push("/dashboard")}
              aria-label="Back to dashboard"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-stone transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft size={15} />
            </button>
          )}
        </div>

        {/* USER */}
        <div className="mb-8 flex items-center gap-3 overflow-hidden border-y border-white/[0.06] px-2 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 font-display text-lg text-white">
            {displayName[0]?.toUpperCase()}
          </span>
          {expanded && (
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{displayName}</p>
              <p className="mt-0.5 font-label text-[10px] uppercase tracking-[0.18em] text-red-500">{profile?.active_plan || "Free"}</p>
            </div>
          )}
        </div>

        {/* MENU */}
        <nav className="space-y-1 text-sm" aria-label={t.navbar.profile}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <SidebarItem key={id} icon={<Icon size={17} />} label={label} expanded={expanded} active={activeTab === id} onClick={() => setActiveTab(id)} />
          ))}
        </nav>
      </div>

      {/* LOGOUT */}
      <SidebarItem
        icon={<LogOut size={17} />}
        label={t.profile.logout}
        expanded={expanded}
        onClick={handleLogout}
        className="hover:bg-red-500/10 hover:text-red-400"
      />
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  expanded,
  active = false,
  onClick,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={expanded ? undefined : label}
      aria-current={active ? "page" : undefined}
      className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
        active ? "bg-white/[0.06] text-white" : `text-white/55 hover:bg-white/[0.04] hover:text-white ${className}`
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-red-500" aria-hidden />}
      <span className={`shrink-0 ${active ? "text-red-500" : ""}`}>{icon}</span>
      {expanded && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

/**
 * Small-screen replacement for the sidebar: a sticky header with the user,
 * back and logout, plus a horizontally scrollable tab bar.
 */
export function ProfileMobileNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const router = useRouter();
  const { profile } = useUser();
  const { t } = useI18n();
  const tabs = useProfileTabs();
  const activeRef = useRef<HTMLButtonElement>(null);

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "User";

  // Keep the active tab visible when it changes (e.g. arriving from ?tab=plan).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  return (
    <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/90 font-text backdrop-blur-xl md:hidden">
      {/* Top bar */}
      <div className="flex h-16 items-center gap-3 px-4">
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Back to dashboard"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-stone transition hover:border-white/25 hover:text-white"
        >
          <ArrowLeft size={15} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 font-display text-base text-white">
            {displayName[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-white">{displayName}</p>
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-red-500">{profile?.active_plan || "Free"}</p>
          </div>
        </div>

        <button
          onClick={() => logoutAndRedirect()}
          aria-label={t.profile.logout}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-stone transition hover:border-red-500/40 hover:text-red-400"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* Tabs */}
      <nav
        aria-label={t.navbar.profile}
        className="-mb-px flex gap-1 overflow-x-auto px-2 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              ref={active ? activeRef : undefined}
              onClick={() => setActiveTab(id)}
              aria-current={active ? "page" : undefined}
              className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 pb-3 pt-1 text-sm transition ${
                active ? "text-white" : "text-white/55 hover:text-white"
              }`}
            >
              <Icon size={15} className={active ? "text-red-500" : ""} aria-hidden />
              {label}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-red-500" aria-hidden />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
