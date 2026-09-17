"use client";

import React, { useState, useEffect } from "react";
import {
  Truck, Package, Users, GraduationCap, LifeBuoy, TrendingUp,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";

interface DashboardOverviewProps {
  initialSuppliers: any[];
  initialProducts: any[];
  initialUsers: any[];
  setActiveTab: (tab: string) => void;
}

/* Plan badge colors (mirrors UsersAdmin's PLAN_CONFIG) */
const PLAN_CONFIG: Record<string, string> = {
  free: "bg-white/10 text-gray-400",
  explorateur: "bg-blue-500 text-white",
  importateur: "bg-purple-500 text-white",
  partenaire: "bg-red-500 text-white",
};

/* Support status pills (mirrors SupportChatAdmin) */
const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500",
  waiting: "bg-yellow-500",
  resolved: "bg-gray-600",
  closed: "bg-gray-700",
};
const STATUS_TEXT: Record<string, string> = {
  open: "text-green-400",
  waiting: "text-yellow-400",
  resolved: "text-gray-500",
  closed: "text-gray-600",
};

/* Training type badges (mirrors TrainingAdmin's TYPE_META) */
const TYPE_BADGE: Record<string, string> = {
  document: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  video: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  link: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function DashboardOverview({
  initialSuppliers,
  initialProducts,
  initialUsers,
  setActiveTab,
}: DashboardOverviewProps) {
  // Self-fetched sections (RLS permits admins) — same pattern as
  // TrainingAdmin / SupportChatAdmin. Both degrade gracefully to empty
  // lists when their migrations have not been run yet.
  const [trainings, setTrainings] = useState<any[] | null>(null);
  const [conversations, setConversations] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("trainings")
      .select("id, title, type, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data, error }: any) => {
        if (!mounted) return;
        if (error) {
          // PGRST202 = relation not found (migration 0014 not run yet)
          if (error.code !== "PGRST202") {
            console.error("Overview: trainings fetch error:", error);
          }
          setTrainings([]);
        } else {
          setTrainings(data || []);
        }
      });

    supabase
      .from("support_conversations")
      .select("id, subject, status, category, ticket_id")
      .order("updated_at", { ascending: false })
      .limit(4)
      .then(({ data, error }: any) => {
        if (!mounted) return;
        if (error) {
          if (error.code !== "PGRST202") {
            console.error("Overview: conversations fetch error:", error);
          }
          setConversations([]);
        } else {
          setConversations(data || []);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* Monthly revenue (same math as UsersAdmin) */
  const monthlyRevenue = initialUsers.reduce((acc: number, user: any) => {
    const plan = user?.active_plan as keyof typeof PLANS;
    return acc + (plan && PLANS[plan]?.price ? PLANS[plan].price : 0);
  }, 0);

  const openTickets = (conversations || []).filter(
    (c) => c.status === "open" || c.status === "waiting"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* STATS ROW — each tile jumps to its tab */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatTile
          icon={<Truck size={18} />}
          label="Suppliers"
          value={String(initialSuppliers.length)}
          onClick={() => setActiveTab("Supplier")}
        />
        <StatTile
          icon={<Package size={18} />}
          label="Winning Products"
          value={String(initialProducts.length)}
          onClick={() => setActiveTab("Product")}
        />
        <StatTile
          icon={<Users size={18} />}
          label="Users"
          value={String(initialUsers.length)}
          onClick={() => setActiveTab("User")}
        />
        <StatTile
          icon={<GraduationCap size={18} />}
          label="Trainings"
          value={trainings === null ? "—" : String(trainings.length)}
          onClick={() => setActiveTab("Training")}
        />
        <StatTile
          icon={<LifeBuoy size={18} />}
          label="Open Tickets"
          value={conversations === null ? "—" : String(openTickets)}
          onClick={() => setActiveTab("Support")}
          accent={(conversations?.length && openTickets > 0) || false}
        />
        <StatTile
          icon={<TrendingUp size={18} />}
          label="Monthly Revenue"
          value={`${monthlyRevenue.toLocaleString()} F`}
          onClick={() => setActiveTab("User")}
          accent={monthlyRevenue > 0}
        />
      </div>

      {/* SUPPLIERS + PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          icon={<Truck size={18} />}
          title="Recent Suppliers"
          count={initialSuppliers.length}
          onViewAll={() => setActiveTab("Supplier")}
        >
          {initialSuppliers.length === 0 ? (
            <EmptyRow label="No suppliers indexed yet." />
          ) : (
            initialSuppliers.slice(0, 5).map((s: any) => (
              <ListRow
                key={s.id}
                title={s.name}
                subtitle={s.platform || "—"}
                badge={
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === "active" ? "bg-green-500" : "bg-gray-600"}`} />
                    {timeAgo(s.created_at)}
                  </span>
                }
              />
            ))
          )}
        </SectionCard>

        <SectionCard
          icon={<Package size={18} />}
          title="Recent Winning Products"
          count={initialProducts.length}
          onViewAll={() => setActiveTab("Product")}
        >
          {initialProducts.length === 0 ? (
            <EmptyRow label="No winning products yet." />
          ) : (
            initialProducts.slice(0, 5).map((p: any) => (
              <ListRow
                key={p.id}
                title={p.name}
                subtitle={p.niche || p.category || "—"}
                badge={
                  <span className="text-[10px] font-bold text-gray-500">{timeAgo(p.created_at)}</span>
                }
              />
            ))
          )}
        </SectionCard>
      </div>

      {/* USERS + TRAININGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          icon={<Users size={18} />}
          title="Newest Users"
          count={initialUsers.length}
          onViewAll={() => setActiveTab("User")}
        >
          {initialUsers.length === 0 ? (
            <EmptyRow label="No users registered yet." />
          ) : (
            initialUsers.slice(0, 5).map((u: any) => (
              <ListRow
                key={u.id}
                title={u.full_name || u.email || "Unknown"}
                subtitle={u.email || ""}
                badge={
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${PLAN_CONFIG[u.active_plan] || PLAN_CONFIG.free}`}>
                    {u.active_plan || "free"}
                  </span>
                }
              />
            ))
          )}
        </SectionCard>

        <SectionCard
          icon={<GraduationCap size={18} />}
          title="Latest Training Modules"
          count={trainings === null ? null : trainings.length}
          onViewAll={() => setActiveTab("Training")}
        >
          {trainings === null ? (
            <div className="py-6 text-center text-[11px] text-gray-600">Loading…</div>
          ) : trainings.length === 0 ? (
            <EmptyRow label="No training modules yet — create the first one." />
          ) : (
            trainings.map((tr: any) => (
              <ListRow
                key={tr.id}
                title={tr.title}
                subtitle={`Order ${tr.sort_order ?? 0}`}
                badge={
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${TYPE_BADGE[tr.type] || TYPE_BADGE.document}`}>
                    {tr.type}
                  </span>
                }
              />
            ))
          )}
        </SectionCard>
      </div>

      {/* SUPPORT QUEUE */}
      <SectionCard
        icon={<LifeBuoy size={18} />}
        title="Support Queue"
        count={conversations === null ? null : conversations.length}
        onViewAll={() => setActiveTab("Support")}
      >
        {conversations === null ? (
          <div className="py-6 text-center text-[11px] text-gray-600">Loading…</div>
        ) : conversations.length === 0 ? (
          <EmptyRow label="No support conversations yet." />
        ) : (
          conversations.map((c: any) => (
            <ListRow
              key={c.id}
              title={c.ticket_id || c.subject || "Conversation"}
              subtitle={c.category || c.subject || ""}
              badge={
                <span className={`flex items-center gap-1.5 text-[10px] font-bold ${STATUS_TEXT[c.status] || "text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[c.status] || "bg-gray-600"}`} />
                  {c.status}
                </span>
              }
            />
          ))
        )}
      </SectionCard>
    </div>
  );
}

/* ================= HELPERS ================= */

function StatTile({
  icon,
  label,
  value,
  onClick,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left bg-white/5 border rounded-2xl p-4 transition-all group
        ${accent
          ? "border-red-500/20 bg-red-500/5 hover:border-red-500/40"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]"}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={accent ? "text-red-500" : "text-gray-500 group-hover:text-red-400 transition-colors"}>
          {icon}
        </span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{label}</span>
      </div>
      <p className={`text-xl font-black ${accent ? "text-red-500" : "text-white"} truncate`}>{value}</p>
    </button>
  );
}

function SectionCard({
  icon,
  title,
  count,
  onViewAll,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number | null;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">{icon}</div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">{title}</h4>
            {count !== null && (
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{count} total</p>
            )}
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors group"
        >
          View all
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ListRow({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">{title}</p>
        <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
      </div>
      <div className="shrink-0">{badge}</div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div className="py-6 text-center text-[11px] text-gray-600">{label}</div>;
}
