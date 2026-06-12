"use client"

import { useState, useEffect } from "react"
import { X, Clock, Search } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function SearchBar({ close }: { close: () => void }) {
  const [query, setQuery] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    setHistory(stored)
  }, [])

  const handleSearch = (searchTerm?: string) => {
    const finalQuery = searchTerm || query
    if (!finalQuery.trim()) return

    // Save to history
    const newHistory = [finalQuery, ...history.filter(h => h !== finalQuery)].slice(0, 6)
    setHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))

    // Determine where to navigate
    const isProductPage = pathname?.includes("winning-products") || pathname?.includes("dashboard/products")
    const targetBase = isProductPage ? "/dashboard/winning-products" : "/dashboard"
    
    router.push(`${targetBase}?q=${encodeURIComponent(finalQuery)}`)
    close()
  }

  const removeItem = (item: string) => {
    const newHistory = history.filter(h => h !== item)
    setHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex justify-center pt-32 px-4" onClick={close}>

      <div 
        className="
          w-full max-w-2xl h-fit
          bg-white/5 backdrop-blur-2xl
          border border-white/10
          rounded-3xl p-8
          shadow-[0_0_80px_rgba(239,68,68,0.2)]
          animate-in zoom-in-95 duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* INPUT */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="relative flex items-center gap-4"
        >
          <div className="absolute left-5 text-gray-500">
             <Search size={20} />
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manufacturers, products, niches..."
            className="
              flex-1 pl-14 pr-5 py-4 rounded-2xl
              bg-black/50 text-white
              border border-white/10
              focus:border-red-500/50 outline-none
              transition-all
            "
          />

          <button
            type="submit"
            className="
              px-8 py-4 rounded-2xl
              bg-red-500 text-white font-bold
              shadow-[0_0_30px_rgba(239,68,68,0.5)]
              hover:bg-red-600 transition-all
            "
          >
            Search
          </button>
        </form>

        {/* HISTORY */}
        {history.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Recent searches</p>
              <button 
                onClick={() => { setHistory([]); localStorage.setItem("searchHistory", "[]"); }}
                className="text-[10px] text-gray-500 hover:text-red-500 uppercase font-bold tracking-widest"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2">
              {history.map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleSearch(item)}
                  className="
                    flex items-center justify-between
                    px-5 py-3 rounded-xl
                    bg-white/5 border border-white/5
                    text-sm text-gray-300
                    hover:bg-white/10 hover:border-red-500/30 transition cursor-pointer
                    group
                  "
                >
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-gray-500 group-hover:text-red-500" />
                    <span>{item}</span>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeItem(item); }}
                    className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                  >
                    <X size={14} className="text-gray-600 group-hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
           <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-gray-400">ESC</kbd> to close</span>
              <span className="flex items-center gap-1.5"><kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-gray-400">ENTER</kbd> to search</span>
           </div>
           <button onClick={close} className="text-red-500 hover:text-red-400">
             Close Search
           </button>
        </div>
      </div>
    </div>
  )
}