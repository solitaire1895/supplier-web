"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { useRouter } from "next/navigation"

type Supplier = {
  name: string
  platform: string
  moq: number
  category: string
}

export default function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const router = useRouter()

  const handleNavigate = () => {
    const query = new URLSearchParams({
      name: supplier.name,
      platform: supplier.platform,
      category: supplier.category,
      moq: supplier.moq.toString(),
    })

    router.push(`/dashboard/suppliers/${encodeURIComponent(supplier.name)}?${query}`)
  }

  return (
    <div
      onClick={handleNavigate}
      className="
      relative group cursor-pointer
      bg-white/5 backdrop-blur-xl
      border border-white/10
      rounded-2xl p-5
      transition-all duration-300
      hover:border-red-500
      hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]
    "
    >
      {/* ⭐ FAVORITE BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsFavorite(!isFavorite)
        }}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"
      >
        <Star
          className={`w-5 h-5 ${
            isFavorite
              ? "text-red-500 fill-red-500"
              : "text-gray-400 group-hover:text-white"
          }`}
        />
      </button>

      {/* HEADER */}
      <div className="mb-4 pr-8">
        <h3 className="text-white text-lg font-semibold">
          {supplier.name}
        </h3>

        <p className="text-gray-400 text-sm">
          {supplier.platform}
        </p>
      </div>

      {/* INFO */}
      <div className="flex justify-between text-sm text-gray-300 mb-6">
        <div>
          <p className="text-gray-500">MOQ</p>
          <p className="text-white font-medium">{supplier.moq}</p>
        </div>

        <div>
          <p className="text-gray-500">Category</p>
          <p className="text-white font-medium">{supplier.category}</p>
        </div>
      </div>

      {/* ACTION */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="
        w-full py-2 rounded-full text-sm font-medium
        bg-red-500 text-white
        shadow-[0_0_20px_rgba(239,68,68,0.6)]
      "
      >
        Contact Supplier
      </button>
    </div>
  )
}