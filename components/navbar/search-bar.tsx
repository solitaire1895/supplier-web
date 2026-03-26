"use client"

import { useState, useEffect } from "react"
import { X, Clock } from "lucide-react"

export default function SearchBar({ close }: { close: () => void }) {
  const [query, setQuery] = useState("")
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    setHistory(stored)
  }, [])

  const saveSearch = () => {
    if (!query) return

    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 6)
    setHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))
    setQuery("")
  }

  const removeItem = (item: string) => {
    const newHistory = history.filter(h => h !== item)
    setHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex justify-center pt-32 px-4">

      <div className="
        w-full max-w-2xl
        bg-white/5 backdrop-blur-2xl
        border border-white/10
        rounded-2xl p-6
        shadow-[0_0_60px_rgba(239,68,68,0.15)]
      ">

        {/* INPUT */}
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers, products..."
            className="
              flex-1 px-5 py-3 rounded-full
              bg-black/50 text-white
              border border-white/10
              focus:border-red-500 outline-none
            "
          />

          <button
            onClick={saveSearch}
            className="
              px-5 py-2 rounded-full
              bg-red-500 text-white
              shadow-[0_0_20px_rgba(239,68,68,0.7)]
            "
          >
            Search
          </button>
        </div>

        {/* HISTORY */}
        <div className="mt-6">
          <p className="text-gray-400 text-sm mb-3">Recent searches</p>

          <div className="flex flex-wrap gap-2">
            {history.map((item, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-2
                  px-3 py-2 rounded-full
                  bg-white/5 border border-white/10
                  text-sm text-gray-300
                  hover:border-red-500 transition
                "
              >
                <Clock size={14} />
                <span>{item}</span>

                <button onClick={() => removeItem(item)}>
                  <X size={14} className="hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={close} className="mt-6 text-red-500 text-sm">
          Close
        </button>
      </div>
    </div>
  )
}