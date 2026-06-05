"use client";

import React, { useState } from "react";
import { 
  Search, MoreHorizontal, Trash2, Edit, 
  UserX, Shield, Clock, Search as SearchIcon, 
  TrendingUp, CreditCard, Calendar, UserCheck,
  Eye, Loader2
} from "lucide-react";
import { deleteUser, suspendUser, updateUser } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
export default function UsersAdmin({ initialUsers, currentUser }: { initialUsers: any[], currentUser: any }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const router = useRouter();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const filtered = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase())
  );

  // ... (revenue calculations remain same)

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) return;
    setIsProcessing(userId);
    const res = await updateUser(userId, { role: newRole });
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Error updating role: " + res.error);
    }
    setIsProcessing(userId === null ? null : userId); // Fix: need to clear isProcessing
    setIsProcessing(null);
  };

  // Calculate Mock Revenue (In a real app, this would come from Stripe or DB)
  const monthlyRevenue = users.reduce((acc, user) => {
    if (user.active_plan === 'pro') return acc + 29;
    if (user.active_plan === 'enterprise') return acc + 99;
    return acc;
  }, 0);

  const yearlyRevenue = monthlyRevenue * 12;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    setIsProcessing(id);
    const res = await deleteUser(id);
    if (res.success) {
      setUsers(users.filter(u => u.id !== id));
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
      setUsers(users.map(u => u.id === id ? { ...u, status: 'suspended' } : u));
    } else {
      alert("Error: " + res.error);
    }
    setIsProcessing(null);
  };

  return (
    <div className="space-y-8">
      {/* REVENUE OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={48} className="text-red-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Monthly Revenue</p>
          <h4 className="text-2xl font-bold text-white">${monthlyRevenue.toLocaleString()}</h4>
          <p className="text-[10px] text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={10} /> +12.5% from last month
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard size={48} className="text-red-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Yearly Projection</p>
          <h4 className="text-2xl font-bold text-white">${yearlyRevenue.toLocaleString()}</h4>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            Based on current {users.length} active users
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <UserCheck size={48} className="text-red-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Subscriptions</p>
          <h4 className="text-2xl font-bold text-white">
            {users.filter(u => u.active_plan !== 'free').length}
          </h4>
          <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
            {Math.round((users.filter(u => u.active_plan !== 'free').length / users.length) * 100) || 0}% conversion rate
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock size={48} className="text-red-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Users</p>
          <h4 className="text-2xl font-bold text-white">{users.length}</h4>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            Registered since launch
          </p>
        </div>
      </div>

      {/* USER LIST HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">User Management</h3>
          <p className="text-xs text-gray-500">Monitor and manage all user accounts and subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by email or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500/50 transition-all w-72"
            />
          </div>
        </div>
      </div>

      {/* USER TABLE */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">User info</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Role</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Plan</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Join Date</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Activity</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Usage</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500/20 to-red-900/20 border border-white/10 flex items-center justify-center text-red-500 font-bold text-xs">
                        {u.email?.substring(0, 2).toUpperCase() || "UN"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{u.email}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isSuperAdmin ? (
                      <select 
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isProcessing === u.id}
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[10px] focus:outline-none focus:border-red-500/50 transition-all text-gray-300"
                      >
                        <option value="user" className="bg-black">User</option>
                        <option value="admin" className="bg-black">Admin</option>
                        <option value="super_admin" className="bg-black">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'super_admin' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 
                        u.role === 'admin' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/20' : 
                        'text-gray-500'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.active_plan === 'pro' ? 'bg-red-500 text-white' : 
                      u.active_plan === 'enterprise' ? 'bg-purple-500 text-white' : 
                      'bg-white/10 text-gray-400'
                    }`}>
                      {u.active_plan || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        u.status === 'suspended' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <span className="capitalize text-gray-300">{u.status || 'active'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <div className="flex flex-col">
                      <span className="text-xs">Last active</span>
                      <span className="text-[10px] text-gray-500">2 hours ago</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span>Searches: 12/50</span>
                        <span>Saved: {u.favorites_count}</span>
                      </div>
                      <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-1/4" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-gray-500 hover:text-white transition-colors" title="View details">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-white transition-colors" title="Edit user">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleSuspend(u.id)}
                        disabled={isProcessing === u.id}
                        className="p-2 text-gray-500 hover:text-yellow-500 transition-colors" 
                        title="Suspend user"
                      >
                        <UserX size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        disabled={isProcessing === u.id}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors" 
                        title="Delete user"
                      >
                        {isProcessing === u.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
