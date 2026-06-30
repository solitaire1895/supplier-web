"use client";

import React from "react";
import { 
  Home, Users, Truck, Package, 
  LogOut, Zap, ChevronRight, LifeBuoy
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  currentUser: any;
}

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  currentUser 
}: AdminSidebarProps) {
  const menuItems = [
    { id: "User", name: "User Management", icon: Users, category: "Overview" },
    { id: "Supplier", name: "Suppliers", icon: Truck, category: "Content" },
    { id: "Product", name: "Winning Products", icon: Package, category: "Content" },
  ];

  return (
    <aside className="w-72 border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col h-screen sticky top-0 overflow-y-auto no-scrollbar">
      {/* LOGO */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter">NEXUSPLY</span>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-4 space-y-8">
        {/* OVERVIEW SECTION */}
        <div>
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Overview</p>
          <div className="space-y-1">
            <SidebarButton 
              active={activeTab === "Dashboard"} 
              onClick={() => setActiveTab("Dashboard")}
              icon={<Home size={20} />}
              label="Dashboard"
            />
            <SidebarButton 
              active={activeTab === "User"} 
              onClick={() => setActiveTab("User")}
              icon={<Users size={20} />}
              label="User Management"
            />
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div>
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Content Management</p>
          <div className="space-y-1">
            <SidebarButton 
              active={activeTab === "Supplier"} 
              onClick={() => setActiveTab("Supplier")}
              icon={<Truck size={20} />}
              label="Suppliers"
            />
            <SidebarButton 
              active={activeTab === "Product"} 
              onClick={() => setActiveTab("Product")}
              icon={<Package size={20} />}
              label="Winning Products"
            />
          </div>
        </div>

        {/* SUPPORT SECTION */}
        <div>
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Support</p>
          <div className="space-y-1">
            <SidebarButton 
              active={activeTab === "Support"} 
              onClick={() => setActiveTab("Support")}
              icon={<LifeBuoy size={20} />}
              label="User Support"
            />
          </div>
        </div>
      </nav>

      {/* USER & LOGOUT */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3 px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-red-900 border border-white/10 flex items-center justify-center font-bold text-sm">
            {currentUser?.email?.substring(0, 2).toUpperCase() || "AD"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white truncate">{currentUser?.email?.split('@')[0] || "Admin"}</span>
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{currentUser?.role?.replace('_', ' ') || "Super Admin"}</span>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Logout System</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
        ${active 
          ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.1)]" 
          : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? "text-red-500" : "text-gray-500 group-hover:text-white"} transition-colors`}>
          {icon}
        </span>
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </div>
      {active && <ChevronRight size={14} className="opacity-50" />}
    </button>
  );
}
