"use client";

import ProfileDropdown from "./profile-dropdown";
import { motion } from "framer-motion";

export default function ProfileMenu({ close }: { close: () => void }) {
  return (
    <div
      className="
      fixed inset-0 z-50
      bg-black/70 backdrop-blur-xl
      flex items-center justify-center px-4
    "
    >
      {/* CLICK OUTSIDE TO CLOSE */}
      <div className="absolute inset-0" onClick={close} />

      {/* SAME DROPDOWN UI */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-sm"
      >
        <ProfileDropdown />
      </motion.div>
    </div>
  );
}
