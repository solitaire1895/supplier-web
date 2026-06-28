"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Clock, Search, Loader2, Package, Factory, CornerDownLeft } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function SearchBar({ close }: { close: () => void }) {
  const [query, setQuery] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const router = useRouter()
  const pathname = usePathname()

  // Used to ignore stale async responses (last-write-wins).
  const requestId = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    setHistory(stored)
  }, [])

  const fetchSuggestions = useCallback(async (term: string) => {
    const trimmed = term.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }

    const currentRequest = ++requestId.current
    setLoadingSuggestions(true)

    // Escape % and _ so user input can't break the LIKE pattern.
    const safe = trimmed.replace(/[%_]/g, (m) => `\\${m}`)
    const pattern = `%${safe}%`

    try {
      const [productsRes, suppliersRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, category")
          .or(`name.ilike.${pattern},category.ilike.${pattern}`)
          .limit(5),
        supabase
          .from("suppliers")
          .select("id, name, category")
          .or(`name.ilike.${pattern},category.ilike.${pattern}`)
          .limit(5),
      ])

      // Ignore if a newer request has started.
      if (currentRequest !== requestId.current) return

      if (productsRes.error) console.error("Product suggestions error:", productsRes.error)
      if (suppliersRes.error) console.error("Supplier suggestions error:", suppliersRes.error)

      const products = (productsRes.data || []).map((p) => ({ ...p, _type: "product" as const }))
      const suppliers = (suppliersRes.data || []).map((s) => ({ ...s, _type: "supplier" as const }))

      // Interleave so both types are visible, products first.
      setSuggestions([...products, ...suppliers])
    } catch (err) {
      console.error("Suggestion fetch failed:", err)
      if (currentRequest === requestId.current) setSuggestions([])
    } finally {
      if (currentRequest === requestId.current) setLoadingSuggestions(false)
    }
  }, [])

  // Debounce suggestion fetching to avoid hammering the DB on every keystroke.
  useEffect(() => {
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

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

  const goToResult = (item: any) => {
    const base = item._type === "product"
      ? "/dashboard/winning-products"
      : "/dashboard"
    router.push(`${base}?q=${encodeURIComponent(item.name)}`)
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
            onKeyDown={(e) => {
              const total = suggestions.length
              if (e.key === "ArrowDown" && total > 0) {
                e.preventDefault()
                setActiveIndex((prev) => (prev + 1) % total)
              } else if (e.key === "ArrowUp" && total > 0) {
                e.preventDefault()
                setActiveIndex((prev) => (prev - 1 + total) % total)
              } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault()
                goToResult(suggestions[activeIndex])
              }
            }}
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

        {/* LIVE SUGGESTIONS */}
        {query.trim().length >= 2 && (
          <div className="mt-6">
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 size={18} className="animate-spin mr-2" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Suggestions</p>
                {suggestions.map((item, i) => (
                  <div
                    key={`${item._type}-${item.id}`}
                    onClick={() => goToResult(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`
                      flex items-center justify-between
                      px-5 py-3 rounded-xl border cursor-pointer transition
                      ${activeIndex === i
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-white/5 border-white/5 hover:bg-white/10"}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item._type === "product"
                        ? <Package size={16} className="text-red-500 shrink-0" />
                        : <Factory size={16} className="text-blue-400 shrink-0" />}
                      <span className="text-sm text-gray-200 truncate">{item.name}</span>
                      {item.category && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {activeIndex === i && (
                      <CornerDownLeft size={14} className="text-gray-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-sm">
                No matches found. Press <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-gray-400 mx-1">ENTER</kbd> to search anyway.
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {history.length > 0 && query.trim().length < 2 && (
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
