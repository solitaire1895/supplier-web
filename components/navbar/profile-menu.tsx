"use client"

import { Settings, Heart, Activity, LogOut } from "lucide-react"

export default function ProfileMenu({ close }: { close: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex justify-center items-center">

      <div className="
        w-full max-w-sm
        bg-white/5 backdrop-blur-2xl
        border border-white/10
        rounded-2xl p-6
      ">

        <h2 className="text-white mb-4">My Account</h2>

        <div className="space-y-3 text-gray-300">

          <button className="menu-item">
            <Settings size={16} /> Settings
          </button>

          <button className="menu-item">
            <Activity size={16} /> Activity
          </button>

          <button className="menu-item">
            <Heart size={16} /> Favorite Suppliers
          </button>

          <button className="menu-item text-red-500">
            <LogOut size={16} /> Logout
          </button>

        </div>

        <button onClick={close} className="mt-4 text-sm text-gray-400">
          Close
        </button>
      </div>
    </div>
  )
}