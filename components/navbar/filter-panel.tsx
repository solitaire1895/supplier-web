"use client"

export default function FilterPanel({ close }: { close: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-end">

      <div className="
        w-full max-w-2xl mx-auto
        bg-white/5 backdrop-blur-2xl
        border border-white/10
        rounded-t-3xl p-6
      ">

        <h2 className="text-white text-lg mb-4">Filter Suppliers</h2>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">

          <input placeholder="Country" className="input" />
          <input placeholder="Category" className="input" />

          <input placeholder="Min Price" className="input" />
          <input placeholder="Max Price" className="input" />

          <input placeholder="MOQ" className="input" />
          <input placeholder="Delivery (days)" className="input" />

        </div>

        <div className="mt-4 flex gap-3 text-sm">
          <label><input type="checkbox" /> Verified</label>
          <label><input type="checkbox" /> High margin</label>
          <label><input type="checkbox" /> Top rated</label>
        </div>

        <button className="
          mt-6 w-full py-3 rounded-full
          bg-red-500 text-white
          shadow-[0_0_20px_rgba(239,68,68,0.7)]
        ">
          Apply Filters
        </button>

        <button onClick={close} className="mt-3 text-gray-400 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}