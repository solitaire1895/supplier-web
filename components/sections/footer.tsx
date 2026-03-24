"use client"

import { Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative px-6 pb-20 bg-black text-white">

      {/* OUTER SPACING */}
      <div className="max-w-7xl mx-auto">

        {/* MAIN CONTAINER */}
        <div className="
          relative rounded-3xl p-10 md:p-16
          bg-white/5 backdrop-blur-2xl
          border border-white/10
          overflow-hidden
        ">

          {/* 🔥 BACKGROUND GLOW */}
          <div className="absolute inset-0 opacity-20 blur-3xl bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2),transparent_70%)]" />

          {/* CTA */}
          <div className="text-center mb-16 relative z-10">

            <h2 className="text-3xl md:text-4xl font-bold">
              Continue Your
              <span className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,1)]">
                {" "}Success Story
              </span>
            </h2>

            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Join thousands of entrepreneurs using Nexusply to find winning suppliers and maximize profits.
            </p>

            {/* INPUT */}
            <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center">

              <div className="
                flex items-center gap-2 px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus-within:border-red-500
                transition
              ">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="bg-transparent outline-none text-sm"
                />
              </div>

              <button className="
                px-6 py-3 rounded-xl
                bg-red-500 text-white font-medium
                hover:bg-red-600
                shadow-[0_0_20px_rgba(239,68,68,0.7)]
                transition
              ">
                Subscribe
              </button>

            </div>

            <p className="text-xs text-gray-500 mt-3">
              No spam. Only valuable insights.
            </p>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-white/10 my-10" />

          {/* FOOTER GRID */}
          <div className="grid md:grid-cols-5 gap-10 text-sm relative z-10">

            {/* BRAND */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                <span className="text-white">Nexus</span>
                <span className="text-red-500">ply</span>
              </h3>

              <p className="text-gray-400 text-sm">
                Transforming supplier data into profitable decisions.
              </p>
            </div>

            {/* LINKS */}
            {[
              {
                title: "Product",
                links: ["Analytics", "Insights", "Reporting", "AI Tools"],
              },
              {
                title: "Solutions",
                links: ["Startups", "Enterprise", "E-commerce", "Agencies"],
              },
              {
                title: "Resources",
                links: ["Blog", "Guides", "Docs", "API"],
              },
              {
                title: "Company",
                links: ["About", "Careers", "Contact", "Partners"],
              },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="mb-3 text-gray-300">{section.title}</h4>
                <ul className="space-y-2 text-gray-400">
                  {section.links.map((link, j) => (
                    <li
                      key={j}
                      className="
                        hover:text-red-500
                        hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]
                        transition cursor-pointer
                      "
                    >
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          {/* BOTTOM */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between text-xs text-gray-500 relative z-10">
            <p>© 2026 Nexusply. All rights reserved.</p>

            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-red-500 cursor-pointer">Privacy</span>
              <span className="hover:text-red-500 cursor-pointer">Terms</span>
              <span className="hover:text-red-500 cursor-pointer">Security</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}