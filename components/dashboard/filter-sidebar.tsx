"use client"

import { useState } from "react"
import { SlidersHorizontal, Check, ShieldCheck, RefreshCcw } from "lucide-react"

const categories = {
  Electronics: ["Phones", "Computers", "Accessories", "Gaming"],
  Clothing: ["Men", "Women", "Kids", "Sportswear"],
  Home: ["Furniture", "Kitchen", "Decor", "Lighting"],
  Beauty: ["Skincare", "Makeup", "Hair", "Fragrance"],
}

export default function FilterSidebar() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const handleReset = () => {
    setSelectedCategory(null)
    setSelectedSub(null)
    setVerifiedOnly(false)
  }

  return (
    <aside
      className="
      w-full lg:w-[280px]
      h-fit
      sticky top-32
      bg-white/5 backdrop-blur-2xl
      border border-white/10
      rounded-3xl
      p-6
      flex flex-col gap-8
      shadow-[0_20px_40px_rgba(0,0,0,0.4)]
    "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-gray-400" />
          <h2 className="text-white text-lg font-bold tracking-tight">
            Filters
          </h2>
        </div>
        
        {(selectedCategory || verifiedOnly) && (
          <button 
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCcw size={10} /> Reset
          </button>
        )}
      </div>

      {/* QUICK TOGGLES */}
      <div>
        <p className="text-gray-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
          Quick Filters
        </p>
        <div 
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-all group"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className={verifiedOnly ? "text-green-400" : "text-gray-500"} />
            <span className={`text-sm font-medium transition-colors ${verifiedOnly ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}>
              Verified Only
            </span>
          </div>
          
          {/* iOS Style Toggle */}
          <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-all duration-300 ${verifiedOnly ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-gray-700'}`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ${verifiedOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </div>

      {/* CATEGORY */}
      <div>
        <p className="text-gray-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
          Primary Category
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.keys(categories).map((cat) => {
            const active = selectedCategory === cat

            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedSub(null)
                }}
                className={`
                  relative py-2.5 px-3 rounded-xl text-sm font-medium
                  border transition-all duration-300 overflow-hidden
                  flex items-center justify-center gap-1.5
                  hover:-translate-y-0.5

                  ${
                    active
                      ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                      : "bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5"
                  }
                `}
              >
                {active && <Check size={12} className="text-red-500" />}
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* SUB CATEGORY */}
      <div className={`transition-all duration-500 ${selectedCategory ? 'opacity-100 max-h-96' : 'opacity-50 max-h-24 overflow-hidden pointer-events-none'}`}>
        <p className="text-gray-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
          Sub-category
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {selectedCategory ? (
            categories[selectedCategory as keyof typeof categories].map((sub, i) => {
              const active = selectedSub === sub

              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSub(sub)}
                  className={`
                    animate-in fade-in zoom-in-95 duration-300 fill-mode-both
                    py-2.5 px-3 rounded-xl text-xs font-medium
                    border transition-all duration-300
                    hover:-translate-y-0.5

                    ${
                      active
                        ? "bg-white/10 border-white/20 text-white shadow-sm"
                        : "bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5"
                    }
                  `}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {sub}
                </button>
              )
            })
          ) : (
            <div className="col-span-2 py-4 text-center rounded-xl border border-dashed border-white/10 bg-white/5">
              <p className="text-xs text-gray-500">Select a category first</p>
            </div>
          )}
        </div>
      </div>

      {/* APPLY BUTTON */}
      <div className="mt-2 pt-6 border-t border-white/10">
        <button
          className="
          w-full py-3.5 rounded-xl text-sm font-bold tracking-wide
          bg-red-500 text-white border border-red-400/50
          shadow-[0_0_20px_rgba(239,68,68,0.4)]
          transition-all duration-300
          hover:shadow-[0_0_35px_rgba(239,68,68,0.7)] hover:bg-red-600
          active:scale-[0.98]
        "
        >
          Apply Filters
        </button>
      </div>
    </aside>
  )
}