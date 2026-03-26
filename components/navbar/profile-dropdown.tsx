"use client"

import { Settings, LogOut, User, Heart, Activity } from "lucide-react"

export default function ProfileDropdown() {
  return (
    <div
      className="
      w-80
      bg-white/5 backdrop-blur-2xl
      border border-white/10
      rounded-2xl p-3
      shadow-[0_0_40px_rgba(239,68,68,0.15)]
    "
    >
      {/* USER CARD */}
      <div
        className="
        flex items-center justify-between
        p-4 rounded-xl
        bg-white/5 border border-white/10
        mb-3
      "
      >
        <div>
          <p className="text-white text-sm font-medium">
            Nexus User
          </p>
          <p className="text-gray-400 text-xs">
            user@email.com
          </p>
        </div>

        <div
          className="
          w-12 h-12 rounded-full
          bg-white/10 flex items-center justify-center
        "
        >
          <User size={20} className="text-gray-300" />
        </div>
      </div>

      {/* MENU LIST */}
      <div className="space-y-1">

        <MenuItem icon={<User size={16} />} label="Profile" active />
        <MenuItem icon={<Activity size={16} />} label="Activity" />
        <MenuItem icon={<Heart size={16} />} label="Favorite Suppliers" />
        <MenuItem icon={<Settings size={16} />} label="Settings" />

      </div>

      {/* DIVIDER */}
      <div className="my-3 h-px bg-white/10" />

      {/* LOGOUT */}
      <MenuItem
        icon={<LogOut size={16} />}
        label="Sign out"
        danger
      />
    </div>
  )
}

/* ================= ITEM ================= */

function MenuItem({
  icon,
  label,
  active,
  danger,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      className={`
        w-full flex items-center gap-3
        px-4 py-3 rounded-xl
        text-sm transition-all

        ${active
          ? "bg-white text-black"
          : "bg-transparent text-gray-300"}

        ${danger && "text-red-500"}

        hover:border-red-500
        hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]
        border border-transparent
      `}
    >
      <span
        className={`
        ${danger ? "text-red-500" : ""}
      `}
      >
        {icon}
      </span>

      {label}
    </button>
  )
}