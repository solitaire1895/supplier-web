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
  CreditCard,
} from "lucide-react";
import { useI18n, Lang } from "@/lib/i18n";
import { useUser } from "@/lib/supabase/provider";
import { logoutAndRedirect } from "@/lib/logout";
import { UnreadBadge, useSupportNotifications } from "@/lib/support-notifications";

const languages = [
  { code: "FR" as Lang, label: "Français" },
  { code: "EN" as Lang, label: "English" },
  { code: "CN" as Lang, label: "中文" },
];

/** `onNavigate` lets a parent overlay (mobile profile menu) close itself after a link is used. */
export default function ProfileDropdown({ onNavigate }: { onNavigate?: () => void } = {}) {
  const router = useRouter();
  const { t, lang, setLanguage } = useI18n();
  const { profile, user, refreshProfile } = useUser();
  const { userUnread } = useSupportNotifications();

  // Self-heal: if the session exists but the profile row didn't load
  // (transient null), refetch it so the card always shows user info.
  useEffect(() => {
    if (user && !profile) {
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  // Resilient logout: never freezes on a hung network call, always clears
  // the local session and hard-navigates to the login page.
  const handleLogout = () => logoutAndRedirect();

  const go = (path: string) => {
    onNavigate?.();
    router.push(path);
  };

  const normalizedRole = profile?.role?.toString().trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin';
  const displayEmail = profile?.email || user?.email;
  const displayName = profile?.full_name || displayEmail?.split('@')[0] || "User";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-2/95 p-2 font-text shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
      {/* USER */}
      <div className="flex items-center gap-3 px-3 pb-4 pt-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 font-display text-lg text-white">
          {displayName[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-light capitalize text-white">{displayName}</p>
          <p className="truncate text-xs text-stone">{displayEmail || "No email"}</p>
        </div>
      </div>

      {/* LANGUAGE */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <p className="mb-2 font-label text-[10px] uppercase tracking-[0.18em] text-stone-2">{t.settings.language}</p>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-white/[0.08] p-1">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              aria-pressed={lang === l.code}
              className={`rounded-full py-1.5 font-label text-[11px] tracking-[0.12em] transition ${
                lang === l.code ? "bg-white/10 text-white" : "text-stone hover:text-white"
              }`}
            >
              {l.code}
            </button>
          ))}
        </div>
      </div>

      {/* MENU */}
      <div className="space-y-0.5 border-t border-white/[0.06] pt-2 text-sm">
        {isAdmin && (
          <DropdownItem
            icon={<Shield size={15} className="text-red-500" />}
            label="Admin Panel"
            onClick={() => go("/admin")}
            className="text-white"
          />
        )}
        <DropdownItem icon={<User size={15} />} label={t.navbar.profile} onClick={() => go("/dashboard/profile?tab=fav-suppliers")} />
        <DropdownItem icon={<Clock size={15} />} label={t.profile.activity} onClick={() => go("/dashboard/profile?tab=contacts")} />
        <DropdownItem icon={<Star size={15} />} label={t.profile.favoritesProducts} onClick={() => go("/dashboard/profile?tab=fav-products")} />
        <DropdownItem icon={<CreditCard size={15} />} label={t.profile.plan} onClick={() => go("/dashboard/profile?tab=plan")} />
        <DropdownItem icon={<Settings size={15} />} label={t.settings.account} onClick={() => go("/dashboard/profile?tab=settings")} />

        <div className="my-1.5 border-t border-white/[0.06]" />

        <DropdownItem icon={<LifeBuoy size={15} />} label={t.navbar.support} onClick={() => go("/dashboard/support")} badge={userUnread} />
        <DropdownItem
          icon={<LogOut size={15} />}
          label={t.profile.logout}
          onClick={handleLogout}
          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
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
  badge = 0,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/70 transition hover:bg-white/[0.05] hover:text-white ${className}`}
    >
      <span className="shrink-0 text-stone">{icon}</span>
      <span>{label}</span>
      <UnreadBadge count={badge} className="ml-auto" />
    </button>
  );
}
