"use client";

import {
  User,
  Star,
  Package,
  Phone,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        fixed top-0 left-0 h-screen z-40
        transition-all duration-300 ease-in-out
        ${expanded ? "w-64" : "w-20"}
        bg-white/5 backdrop-blur-xl
        border-r border-white/10
        flex flex-col justify-between
        p-4
      `}
    >
      {/* TOP */}
      <div>
        {/* LOGO + BACK */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-red-500 font-bold text-lg">
            {expanded ? "Nexusply" : "N"}
          </div>

          {expanded && (
            <ArrowLeft
              onClick={() => router.push("/dashboard")}
              className="w-5 h-5 cursor-pointer text-gray-400 hover:text-white"
            />
          )}
        </div>

        {/* USER */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>

            {expanded && (
              <div>
                <p className="text-sm font-medium">Maixent</p>
                <p className="text-xs text-gray-400">maixent@mail.com</p>
              </div>
            )}
          </div>
        </div>

        {/* MENU */}
        <div className="space-y-2 text-sm">
          <SidebarItem
            icon={<Phone />}
            label="Contacted"
            expanded={expanded}
            active={activeTab === "contacts"}
            onClick={() => setActiveTab("contacts")}
          />

          <SidebarItem
            icon={<Star />}
            label="Favorite Suppliers"
            expanded={expanded}
            active={activeTab === "fav-suppliers"}
            onClick={() => setActiveTab("fav-suppliers")}
          />

          <SidebarItem
            icon={<Package />}
            label="Favorite Products"
            expanded={expanded}
            active={activeTab === "fav-products"}
            onClick={() => setActiveTab("fav-products")}
          />

          <SidebarItem
            icon={<Settings />}
            label="Settings"
            expanded={expanded}
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />

          <SidebarItem
            icon={<User />}
            label="Plan"
            expanded={expanded}
            active={activeTab === "plan"}
            onClick={() => setActiveTab("plan")}
          />
        </div>
      </div>

      {/* LOGOUT */}
      <SidebarItem
        icon={<LogOut />}
        label="Logout"
        expanded={expanded}
        onClick={() => console.log("logout")}
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
}: any) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${
          active
            ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        }
      `}
    >
      <div className="w-5 h-5">{icon}</div>
      {expanded && <span>{label}</span>}
    </div>
  );
}