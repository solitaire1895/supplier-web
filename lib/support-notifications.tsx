"use client";

// In-app support notifications: unread counts, live toasts and a "(n)" tab title.
//
// - Counts come from public.support_unread() (migration 0020) and stay live through
//   Supabase Realtime on support_messages (RLS limits each user to what they may see).
// - "user" scope: support replies in my own conversations.
//   "admin" scope: customer messages in any conversation (admins only).
// - A page showing a conversation calls setViewing(): that conversation is marked read
//   and new messages in it don't raise a toast.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/provider";
import { useI18n } from "@/lib/i18n";

export type SupportScope = "user" | "admin";

type UnreadRow = { conversation_id: string; scope: SupportScope; unread: number };
type Counts = Record<string, number>; // `${scope}:${conversationId}` -> unread

interface Toast {
  id: string;
  scope: SupportScope;
  conversationId: string;
  content: string;
}

interface SupportNotificationsValue {
  /** Unread support replies in my own conversations. */
  userUnread: number;
  /** Unread customer messages across all conversations (0 for non-admins). */
  adminUnread: number;
  /** userUnread + adminUnread (admins), for a single badge. */
  total: number;
  unreadFor: (conversationId: string, scope: SupportScope) => number;
  markRead: (conversationId: string, scope: SupportScope) => void;
  /** Tell the provider which conversation is on screen (null when none). */
  setViewing: (conversationId: string | null, scope: SupportScope) => void;
}

const SupportNotificationsContext = createContext<SupportNotificationsValue>({
  userUnread: 0,
  adminUnread: 0,
  total: 0,
  unreadFor: () => 0,
  markRead: () => {},
  setViewing: () => {},
});

export const useSupportNotifications = () => useContext(SupportNotificationsContext);

const TEXT = {
  FR: { user: "Nouvelle réponse du support", admin: "Nouveau message client", open: "Ouvrir", close: "Fermer", label: "Support" },
  EN: { user: "New reply from support", admin: "New customer message", open: "Open", close: "Close", label: "Support" },
  CN: { user: "客服有新回复", admin: "新的客户消息", open: "打开", close: "关闭", label: "客服" },
} as const;

const TOAST_MS = 7000;
const key = (scope: SupportScope, id: string) => `${scope}:${id}`;

export function SupportNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useUser();
  const { lang } = useI18n();
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  const [counts, setCounts] = useState<Counts>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const viewing = useRef<{ id: string; scope: SupportScope } | null>(null);
  const countsRef = useRef<Counts>({});
  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  const refresh = useCallback(async (): Promise<Counts | null> => {
    if (!user) {
      setCounts({});
      return {};
    }
    const { data, error } = await supabase.rpc("support_unread");
    if (error) {
      // PGRST202: migration 0020 not applied yet. Stay quiet, show no badges.
      if (error.code !== "PGRST202") console.error("support_unread failed:", error.message);
      return null;
    }
    const next: Counts = {};
    for (const row of (data ?? []) as UnreadRow[]) next[key(row.scope, row.conversation_id)] = row.unread;
    setCounts(next);
    return next;
  }, [user]);

  const markRead = useCallback((conversationId: string, scope: SupportScope) => {
    setCounts((prev) => {
      if (!prev[key(scope, conversationId)]) return prev;
      const next = { ...prev };
      delete next[key(scope, conversationId)];
      return next;
    });
    supabase.rpc("mark_support_read", { p_conversation_id: conversationId, p_scope: scope }).then(({ error }) => {
      if (error && error.code !== "PGRST202") console.error("mark_support_read failed:", error.message);
    });
  }, []);

  const setViewing = useCallback(
    (conversationId: string | null, scope: SupportScope) => {
      viewing.current = conversationId ? { id: conversationId, scope } : null;
      if (conversationId) markRead(conversationId, scope);
    },
    [markRead]
  );

  // Initial load, and on account change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the database
    refresh();
  }, [refresh]);

  // Live updates.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`support_notify_${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, async (payload) => {
        const msg = payload.new as { conversation_id: string; sender_id: string; sender_role: string; content: string };
        if (msg.sender_id === user.id) return;

        // Which side is this unread for? Customer messages matter to admins; replies to the owner.
        const scope: SupportScope = msg.sender_role === "user" ? "admin" : "user";
        if (scope === "admin" && !isAdmin) return;

        const onScreen = viewing.current?.id === msg.conversation_id && viewing.current.scope === scope;
        if (onScreen) {
          markRead(msg.conversation_id, scope);
          return;
        }

        const before = countsRef.current[key(scope, msg.conversation_id)] ?? 0;
        const after = await refresh();
        // Only toast when it really added an unread message for me (e.g. an admin
        // reply in someone else's conversation does not).
        if (after && (after[key(scope, msg.conversation_id)] ?? 0) > before) {
          const toast: Toast = {
            id: `${msg.conversation_id}-${Date.now()}`,
            scope,
            conversationId: msg.conversation_id,
            content: msg.content,
          };
          setToasts((prev) => [...prev.filter((t) => t.conversationId !== toast.conversationId), toast].slice(-3));
          setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), TOAST_MS);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, refresh, markRead]);

  const { userUnread, adminUnread } = useMemo(() => {
    let u = 0;
    let a = 0;
    for (const [k, n] of Object.entries(counts)) {
      if (k.startsWith("user:")) u += n;
      else if (isAdmin) a += n;
    }
    return { userUnread: u, adminUnread: a };
  }, [counts, isAdmin]);
  const total = userUnread + adminUnread;

  // "(2) Nexusply" in the browser tab while something is unread.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = total > 0 ? `(${total}) ${base}` : base;
  }, [total, pathname]);

  const unreadFor = useCallback((id: string, scope: SupportScope) => counts[key(scope, id)] ?? 0, [counts]);

  const value = useMemo(
    () => ({ userUnread, adminUnread, total, unreadFor, markRead, setViewing }),
    [userUnread, adminUnread, total, unreadFor, markRead, setViewing]
  );

  const t = TEXT[lang as keyof typeof TEXT] ?? TEXT.FR;

  return (
    <SupportNotificationsContext.Provider value={value}>
      {children}

      {/* Toasts */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-20 z-[70] flex flex-col gap-3 font-text sm:inset-x-auto sm:right-6 sm:w-96"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const href = toast.scope === "admin" ? "/admin?tab=Support" : `/dashboard/support?c=${toast.conversationId}`;
            const dismiss = () => setToasts((prev) => prev.filter((x) => x.id !== toast.id));
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                role="status"
                className="pointer-events-auto overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-2/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              >
                <div className="flex gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-red-500/30 bg-red-500/10">
                    <MessageCircle size={15} className="text-red-500" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.18em] text-stone">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                      {t.label}
                    </p>
                    <p className="mt-1 font-display text-lg font-light leading-snug text-white">{t[toast.scope]}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/65">{toast.content}</p>
                    <Link
                      href={href}
                      onClick={dismiss}
                      className="mt-3 inline-flex items-center rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                    >
                      {t.open}
                    </Link>
                  </div>
                  <button
                    onClick={dismiss}
                    aria-label={t.close}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-stone transition hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <motion.div
                  className="h-px bg-red-500"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: TOAST_MS / 1000, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </SupportNotificationsContext.Provider>
  );
}

/** Small red count pill; renders nothing at 0. */
export function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 font-label text-[10px] leading-[18px] text-white ${className}`}
      aria-label={`${count} unread`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
