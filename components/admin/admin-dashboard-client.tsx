"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, Settings, Home, BarChart2, 
  Users, Activity, Database, Zap, 
  ChevronDown, ArrowUpRight, 
  Truck, Package, LogOut, LifeBuoy, Mail
} from "lucide-react";
import SuppliersAdmin from "./suppliers-admin";
import ProductsAdmin from "./products-admin";
import UsersAdmin from "./users-admin";
import SupportChatAdmin from "./support-chat-admin";
import TrainingAdmin from "./training-admin";
import DashboardOverview from "./dashboard-overview";
import AdminSidebar from "./admin-sidebar";
import { logoutAndRedirect } from "@/lib/logout";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminDashboardClient({ 
  initialSuppliers, 
  initialProducts,
  initialUsers,
  currentUser
}: { 
  initialSuppliers: any[], 
  initialProducts: any[],
  initialUsers: any[],
  currentUser: any
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "User";

  const setActiveTab = (tab: string) => {
    router.push(`/admin?tab=${tab}`);
  };

  // Resilient logout: never freezes on a hung network call, always clears
  // the local session and hard-navigates to the login page.
  const handleLogout = () => logoutAndRedirect();

  const renderView = () => {
    switch (activeTab) {
      case "User":
        return <UsersAdmin initialUsers={initialUsers} currentUser={currentUser} />;
      case "Supplier":
        return <SuppliersAdmin initialSuppliers={initialSuppliers} />;
      case "Product":
        return <ProductsAdmin initialProducts={initialProducts} />;
      case "Support":
        return <SupportChatAdmin />;
      case "Training":
        return <TrainingAdmin />;
      case "Dashboard":
        return (
          <DashboardOverview
            initialSuppliers={initialSuppliers}
            initialProducts={initialProducts}
            initialUsers={initialUsers}
            setActiveTab={setActiveTab}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Activity size={48} className="mb-4 opacity-20" />
            <p>Section &quot;{activeTab}&quot; is under migration to Supabase.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans selection:bg-red-500/30">
      
      {/* SIDEBAR */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto h-screen bg-[#050505]">
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Admin Console</h2>
            <p className="text-xs text-gray-500 font-medium">Internal System Control • Nexusply Engine v2.4</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <button className="flex items-center gap-3 pl-4 border-l border-white/10 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white">{currentUser?.email?.split('@')[0] || 'Admin'}</p>
                  <p className="text-[10px] text-red-500 font-black tracking-widest uppercase">{currentUser?.role?.replace('_', ' ') || 'Super Admin'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-red-900 border-2 border-black/50 flex items-center justify-center text-white font-black uppercase text-sm shadow-xl shadow-red-500/10">
                  {currentUser?.email?.substring(0, 2) || 'AD'}
                </div>
              </button>
              
              {/* Profile Dropdown */}
              <div className="absolute right-0 mt-3 w-56 bg-black border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform group-hover:translate-y-0 translate-y-2">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Session Access</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => router.push("/dashboard/profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors"
                  >
                    <Settings size={18} /> <span>Account Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5 mt-1 rounded-xl"
                  >
                    <LogOut size={18} /> <span>Exit System</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-700">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
