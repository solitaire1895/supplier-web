"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Filter, User, Home } from "lucide-react";
import SearchBar from "./search-bar";
import FilterPanel from "./filter-panel";
import ProfileMenu from "./profile-menu";
import ProfileDropdown from "./profile-dropdown";
import MobileNavMenu from "./mobile-nav-menu";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {/* ================= MOBILE NAV ================= */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 px-4 pb-4">
        <div
          className="
          w-full max-w-md mx-auto
          bg-black/70 backdrop-blur-2xl
          border border-white/10
          rounded-full
          px-4 py-3
          flex items-center justify-between
          shadow-[0_0_40px_rgba(239,68,68,0.2)]
        "
        >
          {/* HOME */}

          <button
            onClick={() => setNavOpen(true)}
            className={`nav-icon ${pathname === "/dashboard" ? "active" : ""}`}
          >
            <Home size={18} />
          </button>

          {/* SEARCH */}
          <button onClick={() => setSearchOpen(true)} className="nav-icon">
            <Search size={18} />
          </button>

          {/* FILTER */}
          <button onClick={() => setFilterOpen(true)} className="nav-icon">
            <Filter size={18} />
          </button>

          {/* PROFILE */}
          <button onClick={() => setProfileOpen(true)} className="nav-icon">
            <User size={18} />
          </button>
        </div>
      </div>

      {/* ================= DESKTOP NAV ================= */}
      <div
        className="
        hidden md:flex
        fixed top-0 left-0 w-full z-50
        bg-black/60 backdrop-blur-xl
        border-b border-white/10
      "
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6 py-4">
          {/* LOGO */}
          <div
            onClick={() => router.push("/dashboard")}
            className="text-lg font-semibold cursor-pointer"
          >
            <span className="text-white">Nexus</span>
            <span className="text-red-500">ply</span>
          </div>

          {/* NAV LINKS */}
          <div className="flex items-center gap-8 text-gray-300 text-sm">
            {[
              { label: "Home", path: "/dashboard" },
              { label: "Suppliers", path: "/suppliers" },
              { label: "Products", path: "/products" },
              { label: "Analytics", path: "/analytics" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`
                  transition
                  ${
                    pathname === item.path
                      ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      : "hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {/* SEARCH INPUT */}
            <div
              className="
              hidden lg:flex items-center
              bg-white/5 border border-white/10
              rounded-full px-4 py-2
              focus-within:border-red-500
              transition
            "
            >
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                placeholder="Search suppliers..."
                className="bg-transparent outline-none text-sm text-white placeholder-gray-500"
              />
            </div>

            {/* FILTER */}
            <button onClick={() => setFilterOpen(true)} className="nav-icon">
              <Filter size={18} />
            </button>

            {/* PROFILE (HOVER) */}
            <div className="relative group hidden md:block">
              <button className="nav-icon">
                <User size={18} />
              </button>

              <div
                className="
                absolute right-0 mt-4 w-72
                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                transition-all duration-300
              "
              >
                <ProfileDropdown />
              </div>
            </div>

            {/* CTA */}
            <button
              className="
              px-4 py-2 rounded-full text-sm
              bg-red-500 text-white
              shadow-[0_0_20px_rgba(239,68,68,0.7)]
              hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]
              transition
            "
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* ================= OVERLAYS ================= */}
      {searchOpen && <SearchBar close={() => setSearchOpen(false)} />}
      {filterOpen && <FilterPanel close={() => setFilterOpen(false)} />}
      {profileOpen && <ProfileMenu close={() => setProfileOpen(false)} />}
      {navOpen && <MobileNavMenu close={() => setNavOpen(false)} />}
    </>
  );
}
