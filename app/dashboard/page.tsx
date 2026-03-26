import Navbar from "@/components/navbar/navbar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">

      {/* PAGE CONTENT */}
      <div className="pt-10 px-6">
        <h1 className="text-2xl font-semibold mb-4">
          Dashboard
        </h1>

        <p className="text-gray-400">
          This is a test page for your Nexusply navigation system.
        </p>

        {/* Fake content to test scrolling */}
        <div className="mt-10 space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="
                p-4 rounded-xl
                bg-white/5 border border-white/10
              "
            >
              Supplier Card #{i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <Navbar />
    </div>
  )
}