"use client"

import { useState } from "react"

const categories = {
  Electronics: ["Phones", "Computers", "Accessories", "Gaming"],
  Clothing: ["Men", "Women", "Kids", "Sportswear"],
  Home: ["Furniture", "Kitchen", "Decor", "Lighting"],
  Beauty: ["Skincare", "Makeup", "Hair", "Fragrance"],
}

export default function FilterSidebar() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)

  return (
    <aside
      className="
      w-72
      h-fit
      sticky top-24

      bg-white/5 backdrop-blur-xl
      border border-white/10
      rounded-2xl

      p-5
      flex flex-col gap-6

      shadow-[0_0_30px_rgba(0,0,0,0.5)]
    "
    >
      {/* HEADER */}
      <div className="pb-4 border-b border-white/10">
        <h2 className="text-white text-lg font-semibold">
          Filters
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Refine your supplier search
        </p>
      </div>

      {/* CATEGORY */}
      <div>
        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">
          Category
        </p>

        <div className="grid grid-cols-2 gap-3">
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
                  py-2 rounded-xl text-sm
                  border transition-all duration-300
                  hover:scale-[1.03]

                  ${
                    active
                      ? "bg-red-500/10 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                      : "bg-white/5 border-white/10 text-gray-300 hover:border-red-500"
                  }
                `}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* SUB CATEGORY */}
      <div>
        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">
          Sub-category
        </p>

        <div className="grid grid-cols-2 gap-3">
          {selectedCategory &&
            categories[selectedCategory as keyof typeof categories].map(
              (sub) => {
                const active = selectedSub === sub

                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSub(sub)}
                    className={`
                      py-2 rounded-xl text-sm
                      border transition-all duration-300
                      hover:scale-[1.03]

                      ${
                        active
                          ? "bg-red-500/10 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                          : "bg-white/5 border-white/10 text-gray-300 hover:border-red-500"
                      }
                    `}
                  >
                    {sub}
                  </button>
                )
              }
            )}
        </div>

        {!selectedCategory && (
          <p className="text-xs text-gray-500 mt-2">
            Select a category first
          </p>
        )}
      </div>

      {/* APPLY BUTTON */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <button
          className="
          w-full py-2 rounded-full text-sm font-medium
          bg-red-500 text-white
          shadow-[0_0_20px_rgba(239,68,68,0.6)]
          transition-all duration-300
          hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]
        "
        >
          Apply Filters
        </button>
      </div>
    </aside>
  )
}