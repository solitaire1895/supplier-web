"use client"

export default function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="
      group relative p-6 rounded-2xl
      bg-white/5 backdrop-blur-2xl
      border border-white/10
      overflow-hidden
      transition-all duration-500
      hover:border-red-500
      hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]
    ">

      {/* GLOW BACKGROUND */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        transition duration-500
        bg-gradient-to-br from-red-500/20 via-transparent to-transparent
      " />

      {/* ICON */}
      <div className="
        mb-4 text-red-500
        drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]
      ">
        {icon}
      </div>

      {/* TITLE */}
      <h3 className="
        text-xl font-semibold mb-2
        group-hover:text-red-500
        group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]
        transition
      ">
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p className="text-gray-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}