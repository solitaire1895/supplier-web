"use client";

import {
  User,
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
import { supabase } from "@/lib/supabase/client";
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        fixed top-0 left-0 h-screen z-40
        transition-all duration-300 ease-in-out
        ${expanded ? "w-64" : "w-20"}
        bg-black/80 backdrop-blur-2xl
        border-r border-white/10
        flex flex-col justify-between
        p-4
      `}
    >
      {/* TOP */}
      <div>
        {/* LOGO + BACK */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-red-500 font-bold text-xl px-2">
            {expanded ? "Nexusply" : "N"}
          </div>

          {expanded && (
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
          )}
        </div>

        {/* USER */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-8 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
              <User className="w-5 h-5 text-red-500" />
            </div>

            {expanded && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-white">
                  {profile?.full_name || profile?.email?.split('@')[0] || "User"}
                </p>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  {profile?.active_plan || "Free"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MENU */}
        <div className="space-y-1.5 text-sm">
          <SidebarItem
            icon={<Phone size={18} />}
            label={t.profile.contacted}
            expanded={expanded}
            active={activeTab === "contacts"}
            onClick={() => setActiveTab("contacts")}
          />

          <SidebarItem
            icon={<Star size={18} />}
            label={t.profile.favoritesSuppliers}
            expanded={expanded}
            active={activeTab === "fav-suppliers"}
            onClick={() => setActiveTab("fav-suppliers")}
          />

          <SidebarItem
            icon={<Package size={18} />}
            label={t.profile.favoritesProducts}
            expanded={expanded}
            active={activeTab === "fav-products"}
            onClick={() => setActiveTab("fav-products")}
          />

          <SidebarItem
            icon={<Settings size={18} />}
            label={t.profile.settings}
            expanded={expanded}
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />

          <SidebarItem
            icon={<CreditCard size={18} />}
            label={t.profile.plan}
            expanded={expanded}
            active={activeTab === "plan"}
            onClick={() => setActiveTab("plan")}
          />
        </div>
      </div>

      {/* LOGOUT */}
      <SidebarItem
        icon={<LogOut size={18} />}
        label={t.profile.logout}
        expanded={expanded}
        onClick={handleLogout}
        className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
      />
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  expanded,
  active,
  onClick,
  className = ""
}: any) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300
        ${
          active
            ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            : `text-gray-400 hover:text-white hover:bg-white/5 ${className}`
        }
      `}
    >
      <div className="shrink-0">{icon}</div>
      {expanded && <span className="font-medium whitespace-nowrap">{label}</span>}
    </div>
  );
}