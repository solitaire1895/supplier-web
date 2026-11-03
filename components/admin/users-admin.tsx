"use client";

import React, { useMemo, useState } from "react";
import {
  Search, Trash2, UserX, Shield, TrendingUp, TrendingDown,
  CreditCard, Calendar, UserCheck, Users, Loader2,
} from "lucide-react";
import { deleteUser, suspendUser, updateUser, updateUserPlan } from "@/lib/supabase/actions";
import { PLANS, isPaidPlan } from "@/lib/plans";
import type { AdminStats, AdminUser } from "@/lib/supabase/admin-queries";

// Plan display config: maps internal plan names to badge colors and labels
const PLAN_CONFIG: Record<string, { color: string; label: string }> = {
  free: { color: "bg-white/10 text-gray-400", label: "Free" },
  explorateur: { color: "bg-blue-500 text-white", label: "Explorer" },
  importateur: { color: "bg-purple-500 text-white", label: "Importer" },
  partenaire: { color: "bg-red-500 text-white", label: "Partner" },
};
const PLAN_RANK: Record<string, number> = { partenaire: 3, importateur: 2, explorateur: 1 };

type Filter = "all" | "paying" | "free";

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 30) return `${days} d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Same rule as the server: paying customers first, highest plan, latest payment; then newest accounts. */
function sortPayingFirst(list: AdminUser[]) {
  return [...list].sort((a, b) => {
    if (a.is_paying !== b.is_paying) return a.is_paying ? -1 : 1;
    if (a.is_paying) {
      const rank = (PLAN_RANK[b.active_plan ?? ""] ?? 0) - (PLAN_RANK[a.active_plan ?? ""] ?? 0);
      if (rank) return rank;
      return (b.last_paid_at ?? "").localeCompare(a.last_paid_at ?? "");
    }
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

export default function UsersAdmin({
  initialUsers,
  stats,
  currentUser,
}: {
  initialUsers: AdminUser[];
  stats: AdminStats | null;
  currentUser: any;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdmin = isSuperAdmin || currentUser?.role === "admin";

  const payingCount = users.filter((u) => u.is_paying).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortPayingFirst(users).filter((u) => {
      if (filter === "paying" && !u.is_paying) return false;
      if (filter === "free" && u.is_paying) return false;
      if (!q) return true;
      return (
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
      );
    });
  }, [users, search, filter]);

  const firstNonPaying = filtered.findIndex((u) => !u.is_paying);

  // Revenue trend vs the previous 30 days (real payments only).
  const trend =
    stats && stats.revenuePrev30d > 0
      ? Math.round(((stats.revenue30d - stats.revenuePrev30d) / stats.revenuePrev30d) * 100)
      : null;

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) return;
    setIsProcessing(userId);
    const res = await updateUser(userId, { role: newRole });
    if (res.success) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } else {
      alert("Error updating role: " + res.error);
    }
    setIsProcessing(null);
  };

  // Admin plan change handler — calls the secure server action
  const handlePlanChange = async (userId: string, newPlan: string) => {
    setIsProcessing(userId);
    const res = await updateUserPlan(userId, newPlan);
    if (res.success) {
      const paid = isPaidPlan(newPlan);
      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                active_plan: newPlan,
                subscription_status: paid ? "active" : "free",
                plan_expires_at: paid ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() : null,
                is_paying: paid,
              }
            : u
        )
      );
    } else {
      alert("Error updating plan: " + res.error);
    }
    setIsProcessing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    setIsProcessing(id);
    const res = await deleteUser(id);
    if (res.success) {
      setUsers(users.filter((u) => u.id !== id));
    } else {
      alert("Error: " + res.error);
    }
    setIsProcessing(null);
  };

  const handleSuspend = async (id: string) => {
    if (!confirm("Suspend this user's access?")) return;
    setIsProcessing(id);
    const res = await suspendUser(id);
    if (res.success) {
      setUsers(users.map((u) => (u.id === id ? { ...u, status: "suspended" } : u)));
    } else {
      alert("Error: " + res.error);
    }
    setIsProcessing(null);
  };

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: users.length },
    { id: "paying", label: "Paying", count: payingCount },
    { id: "free", label: "Not paying", count: users.length - payingCount },
  ];

  return (
    <div className="space-y-8">
      {/* REVENUE OVERVIEW — real paid plan payments */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp size={48} className="text-red-500" />}
          label="Revenue · last 30 days"
          value={stats ? fcfa(stats.revenue30d) : "—"}
          note={
            !stats ? (
              "Unavailable"
            ) : trend === null ? (
              `${stats.paymentsCount30d} payment${stats.paymentsCount30d === 1 ? "" : "s"}`
            ) : (
              <span className={`flex items-center gap-1 ${trend >= 0 ? "text-green-500" : "text-red-400"}`}>
                {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {trend >= 0 ? "+" : ""}
                {trend}% vs previous 30 days
              </span>
            )
          }
        />
        <StatCard
          icon={<CreditCard size={48} className="text-red-500" />}
          label="Revenue · all time"
          value={stats ? fcfa(stats.revenueAllTime) : "—"}
          note="Sum of confirmed plan payments"
        />
        <StatCard
          icon={<UserCheck size={48} className="text-red-500" />}
          label="Paying customers"
          value={String(payingCount)}
          note={
            <span className="text-red-500">
              {users.length ? Math.round((payingCount / users.length) * 100) : 0}% of accounts
            </span>
          }
        />
        <StatCard
          icon={<Users size={48} className="text-red-500" />}
          label="Total users"
          value={String(users.length)}
          note="Registered accounts"
        />
      </div>

      {/* USER LIST HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-bold">User Management</h3>
          <p className="text-xs text-gray-500">Paying customers are listed first.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filter === f.id ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {f.label} <span className="opacity-70">({f.count})</span>
              </button>
            ))}
          </div>
          <div className="group relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-500" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm transition-all focus:border-red-500/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* USER TABLE */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 font-medium text-gray-400">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">User info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Paid</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Join date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Last active</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Usage · 30 d</th>
                <th className="px-6 py-4 text-right text-[10px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u, index) => {
                const expired = isPaidPlan(u.active_plan) && !u.is_paying;
                return (
                  <React.Fragment key={u.id}>
                    {filter === "all" && index === 0 && u.is_paying && <GroupRow label={`Paying customers · ${payingCount}`} accent />}
                    {filter === "all" && index === firstNonPaying && firstNonPaying !== -1 && (
                      <GroupRow label={`Other accounts · ${users.length - payingCount}`} />
                    )}
                    <tr className={`group transition-colors hover:bg-white/5 ${u.is_paying ? "bg-red-500/[0.03]" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-tr from-red-500/20 to-red-900/20 text-xs font-bold text-red-500">
                            {u.email?.substring(0, 2).toUpperCase() || "UN"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{u.full_name || u.email}</span>
                            <span className="text-[11px] text-gray-500">{u.full_name ? u.email : <span className="font-mono">{u.id}</span>}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isSuperAdmin ? (
                          <select
                            value={u.role || "user"}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isProcessing === u.id}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-300 transition-all focus:border-red-500/50 focus:outline-none"
                          >
                            <option value="user" className="bg-black">User</option>
                            <option value="admin" className="bg-black">Admin</option>
                            <option value="super_admin" className="bg-black">Super Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              u.role === "super_admin"
                                ? "border border-red-500/20 bg-red-500/20 text-red-500"
                                : u.role === "admin"
                                  ? "border border-blue-500/20 bg-blue-500/20 text-blue-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {u.role || "user"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {isAdmin ? (
                            <select
                              value={u.active_plan || "free"}
                              onChange={(e) => handlePlanChange(u.id, e.target.value)}
                              disabled={isProcessing === u.id}
                              className="w-fit rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] capitalize text-gray-300 transition-all focus:border-red-500/50 focus:outline-none"
                            >
                              <option value="free" className="bg-black">Free</option>
                              <option value="explorateur" className="bg-black">Explorer</option>
                              <option value="importateur" className="bg-black">Importer</option>
                              <option value="partenaire" className="bg-black">Partner</option>
                            </select>
                          ) : (
                            <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${(PLAN_CONFIG[u.active_plan ?? ""] || PLAN_CONFIG.free).color}`}>
                              {(PLAN_CONFIG[u.active_plan ?? ""] || PLAN_CONFIG.free).label}
                            </span>
                          )}
                          {u.plan_expires_at && isPaidPlan(u.active_plan) && (
                            <span className={`text-[10px] ${expired ? "text-red-400" : "text-gray-500"}`}>
                              {expired ? "Expired " : "Until "}
                              {new Date(u.plan_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.payments_count > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{fcfa(u.total_paid)}</span>
                            <span className="text-[10px] text-gray-500">
                              {u.payments_count} payment{u.payments_count === 1 ? "" : "s"} · last {timeAgo(u.last_paid_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-600">
                            {u.is_paying ? "Granted by admin" : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{timeAgo(u.last_active_at)}</td>
                      <td className="px-6 py-4 text-[11px] text-gray-400">
                        <div className="flex flex-col gap-0.5">
                          <span>{u.searches_30d} searches · {u.views_30d} views</span>
                          <span className="text-gray-500">{u.favorites_count} saved</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {u.status === "suspended" && (
                            <span className="mr-2 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-500">Suspended</span>
                          )}
                          <button
                            onClick={() => handleSuspend(u.id)}
                            disabled={isProcessing === u.id || u.status === "suspended"}
                            className="p-2 text-gray-500 transition-colors hover:text-yellow-500 disabled:opacity-30"
                            title="Suspend user"
                          >
                            <UserX size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={isProcessing === u.id}
                            className="p-2 text-gray-500 transition-colors hover:text-red-500"
                            title="Delete user"
                          >
                            {isProcessing === u.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-20 text-center text-gray-500">
              <Shield size={48} className="mx-auto mb-4 opacity-10" />
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-gray-600">
        Plan prices: {Object.values(PLANS).filter((p) => p.price).map((p) => `${p.name.EN} ${fcfa(p.price)}`).join(" · ")}.
        Revenue counts confirmed SasPay payments only, in XAF.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="absolute right-0 top-0 p-4 opacity-10 transition-transform group-hover:scale-110">{icon}</div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
      <h4 className="text-2xl font-bold text-white">{value}</h4>
      <div className="mt-2 text-[10px] text-gray-400">{note}</div>
    </div>
  );
}

function GroupRow({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <tr>
      <td colSpan={8} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${accent ? "bg-red-500/10 text-red-400" : "bg-white/[0.03] text-gray-500"}`}>
        {label}
      </td>
    </tr>
  );
}
