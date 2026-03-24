"use client"

import { useState } from "react"
import Link from "next/link"

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur-xl">
      
      

      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <div className="text-xl font-semibold tracking-wide">
          <span className="text-white">Nexus</span>
          <span className="text-red-500">ply</span>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex gap-10 text-base font-medium text-gray-300">

          {["Features", "Pricing", "About"].map((item) => (
            <Link
              key={item}
              href="#"
              className="
                relative transition duration-300
                hover:text-red-500
                hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]
              "
            >
              {item}
            </Link>
          ))}

        </div>

        {/* ACTION BUTTONS */}
        <div className="hidden md:flex items-center gap-4">

          {/* LOGIN */}
          <button className="
            px-5 py-2 rounded-xl text-sm
            border border-red-500 text-red-500
            transition-all duration-300
            hover:bg-red-500 hover:text-white
            hover:shadow-[0_0_20px_rgba(239,68,68,0.7)]
          ">
            Login
          </button>

          {/* GLASS BUTTON */}
          <button className="
            relative px-6 py-2 rounded-full text-sm font-medium text-white
            bg-white/10 backdrop-blur-2xl
            border border-white/20
            transition-all duration-300
            hover:bg-white/20
            hover:border-red-500
            hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]
          ">
            Get Started
          </button>

        </div>

        {/* MOBILE TOGGLE */}
        <button
          onClick={() => setOpen(!open)}
          className="
            md:hidden flex flex-col gap-1
            group
          "
        >
          <span className="w-6 h-[2px] bg-white group-hover:bg-red-500 transition shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          <span className="w-6 h-[2px] bg-white group-hover:bg-red-500 transition shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          <span className="w-6 h-[2px] bg-white group-hover:bg-red-500 transition shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </button>

      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="
          md:hidden bg-black/90 backdrop-blur-xl
          border-t border-red-900/30
          px-6 py-6 flex flex-col gap-6 text-lg
        ">
          {["Features", "Pricing", "About"].map((item) => (
            <Link
              key={item}
              href="#"
              className="
                text-gray-300
                hover:text-red-500
                hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]
                transition
              "
            >
              {item}
            </Link>
          ))}

          <button className="
            mt-4 px-5 py-2 rounded-xl
            border border-red-500 text-red-500
            hover:bg-red-500 hover:text-white
            transition
            shadow-[0_0_15px_rgba(239,68,68,0.6)]
          ">
            Login
          </button>

          <button className="
            px-6 py-2 rounded-full text-white
            bg-white/10 backdrop-blur-xl
            border border-white/20
            hover:border-red-500
            hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]
            transition
          ">
            Get Started
          </button>
    
        </div>
      )}
    </div>
  )
}