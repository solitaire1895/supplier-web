"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Clock,
  Star,
  Settings,
  LogOut,
  Shield,
  LifeBuoy,
} from "lucide-react";
import { useI18n, Lang } from "@/lib/i18n";
import { useUser } from "@/lib/supabase/provider";
import { supabase } from "@/lib/supabase/client";

const languages = [
  { code: "EN" as Lang, label: "English", flag: "🇺🇸" },
  { code: "FR" as Lang, label: "Français", flag: "🇫🇷" },
  { code: "CN" as Lang, label: "中文", flag: "🇨🇳" },
];

export default function ProfileDropdown() {
  const router = useRouter();
  const { t, lang, setLanguage } = useI18n();
  const { profile, user, refreshProfile } = useUser();

  // Self-heal: if the session exists but the profile row didn't load
  // (transient null), refetch it so the card always shows user info.
  useEffect(() => {
    if (user && !profile) {
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const normalizedRole = profile?.role?.toString().trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin';
  const displayEmail = profile?.email || user?.email;
  const displayName = profile?.full_name || displayEmail?.split('@')[0] || "User";

  return (
    <div
      className="
      bg-black/80 backdrop-blur-xl
      border border-white/10
      rounded-2xl p-4
      shadow-[0_0_30px_rgba(0,0,0,0.5)]
    "
    >
      {/* USER */}
      <div className="mb-4 px-2">
        <p className="text-white font-medium capitalize">
          {displayName}
        </p>
        <p className="text-gray-400 text-sm truncate">
          {displayEmail || "No email"}
        </p>
      </div>

      <div className="border-t border-white/10 my-3" />

      {/* LANGUAGE SELECTOR */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2 px-2">
          {t.settings.language}
        </p>
        <div className="grid grid-cols-3 gap-1">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300
                ${
                  lang === l.code
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <span className="text-lg mb-1">{l.flag}</span>
              <span className="text-[10px] font-medium">{l.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 my-3" />

      {/* MENU */}
      <div className="space-y-1 text-sm">

        {isAdmin && (
          <DropdownItem
            icon={<Shield size={16} className="text-red-500" />}
            label="Admin Panel"
            onClick={() => router.push("/admin")}
            className="bg-red-500/5 text-red-500 hover:bg-red-500/10"
          />
        )}

        <DropdownItem
          icon={<User size={16} />}
          label={t.navbar.profile}
          onClick={() => router.push("/dashboard/profile")}
        />

        <DropdownItem
          icon={<Clock size={16} />}
          label={t.profile.activity}
          onClick={() => console.log("activity")}
        />

        <DropdownItem
          icon={<Star size={16} />}
          label={t.profile.favoritesProducts}
          onClick={() => router.push("/dashboard/profile")}
        />

        <DropdownItem
          icon={<Settings size={16} />}
          label={t.settings.account}
          onClick={() => router.push("/dashboard/profile")}
        />

        <div className="border-t border-white/10 my-2" />

        <DropdownItem
          icon={<LifeBuoy size={16} />}
          label={t.navbar.support}
          onClick={() => router.push("/dashboard/support")}
        />

        <DropdownItem
          icon={<LogOut size={16} />}
          label={t.profile.logout}
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        />

      </div>
    </div>
  );
}

/* ================= ITEM ================= */

function DropdownItem({
  icon,
  label,
  onClick,
  className = "",
}: any) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-2.5 rounded-xl
        text-gray-300 cursor-pointer
        hover:text-white hover:bg-white/5
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
  );
}
