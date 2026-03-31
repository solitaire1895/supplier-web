"use client"

import { useState } from "react"

const categories = {
  Electronics: ["Phones", "Computers", "Accessories", "Gaming"],
  Clothing: ["Men", "Women", "Kids", "Sportswear"],
  Home: ["Furniture", "Kitchen", "Decor", "Lighting"],
  Beauty: ["Skincare", "Makeup", "Hair", "Fragrance"],
}

export default function FilterPanel({ close }: { close: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-end">
      
      <div
        className="
        w-full max-w-2xl mx-auto
        bg-white/5 backdrop-blur-2xl
        border border-white/10
        rounded-t-3xl p-6
        max-h-[90vh] overflow-y-auto
      "
      >
        {/* HANDLE */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* TITLE */}
        <h2 className="text-white text-lg mb-6">
          Filter Suppliers
        </h2>

        {/* CATEGORY */}
        <div className="mb-6">
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
                    py-2 rounded-xl text-sm border transition-all duration-300

                    ${
                      active
                        ? "bg-red-500/10 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                        : "bg-white/5 border-white/10 text-gray-300"
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
        <div className="mb-6">
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
                        py-2 rounded-xl text-sm border transition-all duration-300

                        ${
                          active
                            ? "bg-red-500/10 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                            : "bg-white/5 border-white/10 text-gray-300"
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

        {/* OTHER FILTERS */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-6">
          <input placeholder="Country" className="input" />
          <input placeholder="MOQ" className="input" />
          <input placeholder="Min Price" className="input" />
          <input placeholder="Max Price" className="input" />
        </div>

        {/* CHECKBOXES */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Verified
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            High margin
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Top rated
          </label>
        </div>

        {/* ACTIONS */}
        <button
          className="
          w-full py-3 rounded-full text-sm font-medium
          bg-red-500 text-white
          shadow-[0_0_20px_rgba(239,68,68,0.7)]
          transition-all duration-300
          hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]
        "
        >
          Apply Filters
        </button>

        <button
          onClick={close}
          className="mt-3 text-gray-400 text-sm w-full text-center"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}