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
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/supabase/provider";
import { logoutAndRedirect } from "@/lib/logout";
import { useI18n } from "@/lib/i18n";

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

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col justify-between border-r border-white/[0.06] bg-ink p-3 font-text transition-[width] duration-300 ease-out ${
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
          <SidebarItem icon={<Phone size={17} />} label={t.profile.contacted} expanded={expanded} active={activeTab === "contacts"} onClick={() => setActiveTab("contacts")} />
          <SidebarItem icon={<Star size={17} />} label={t.profile.favoritesSuppliers} expanded={expanded} active={activeTab === "fav-suppliers"} onClick={() => setActiveTab("fav-suppliers")} />
          <SidebarItem icon={<Package size={17} />} label={t.profile.favoritesProducts} expanded={expanded} active={activeTab === "fav-products"} onClick={() => setActiveTab("fav-products")} />
          <SidebarItem icon={<Settings size={17} />} label={t.profile.settings} expanded={expanded} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <SidebarItem icon={<CreditCard size={17} />} label={t.profile.plan} expanded={expanded} active={activeTab === "plan"} onClick={() => setActiveTab("plan")} />
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
