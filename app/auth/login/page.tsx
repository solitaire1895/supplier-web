import LoginForm from "@/components/auth/login-form"
import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4">

      {/* FULL PAGE BACKGROUND */}
      {/* <HexagonBackground /> */}

      {/* MAIN CONTAINER */}
      <div className="
        relative z-10 
        w-full max-w-5xl 
        grid md:grid-cols-2 
        rounded-3xl 
        overflow-hidden
        bg-white/5 backdrop-blur-2xl
        border border-white/10
        shadow-[0_0_60px_rgba(239,68,68,0.15)]
      ">

        {/* LEFT PANEL */}
        <div className="
          hidden md:flex 
          flex-col justify-between 
          p-10
          bg-gradient-to-br from-red-500/20 via-black to-black
        ">
          {/* Logo */}
          <div className="text-lg font-semibold">
            <span className="text-white">Nexus</span>
            <span className="text-red-500">ply</span>
          </div>

          {/* Content */}
          <div>
            <p className="text-gray-400 mb-3 text-sm">
              Supplier Intelligence
            </p>

            <h2 className="text-3xl font-semibold text-white leading-snug">
              Access your supplier command center
            </h2>

            <p className="text-gray-400 mt-4 text-sm">
              Discover, compare, and optimize sourcing decisions with precision.
            </p>
          </div>

          <div />
        </div>

        {/* RIGHT PANEL */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <LoginForm />
        </div>

      </div>
    </div>
  )
}