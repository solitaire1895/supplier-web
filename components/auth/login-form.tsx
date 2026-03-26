"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { FaGoogle, FaFacebookF, FaApple } from "react-icons/fa"
import Link from "next/link"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()

  // ✅ HANDLE LOGIN
  const handleLogin = async () => {
    setError("")

    if (!email || !password) {
      return setError("All fields are required")
    }

    try {
      setLoading(true)

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }

      // ✅ OPTIONAL: store token
      localStorage.setItem("token", data.token)

      // ✅ redirect to future dashboard
      router.push("/dashboard")

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-6"
    >
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Welcome back
        </h1>
        <p className="text-gray-400">
          Enter your credentials to access Nexusply
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        
        {/* Email */}
        <div className="space-y-2">
          <Label className="text-gray-300">Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-white/5 border-white/10 focus:border-red-500 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label className="text-gray-300">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-white/5 border-white/10 focus:border-red-500 text-white placeholder:text-gray-500"
          />
        </div>

        {/* ✅ ERROR */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* BUTTON */}
        <Button
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full 
            bg-red-500 
            hover:bg-red-600 
            text-white 
            border-none
            shadow-[0_0_20px_rgba(239,68,68,0.7)]
            hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]
            transition-all
          "
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-gray-500 text-sm">or continue with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-3 gap-3">
        {[FaGoogle, FaFacebookF, FaApple].map((Icon, i) => (
          <button
            key={i}
            className="
              bg-white/5 
              border border-white/10 
              rounded-lg 
              py-2 
              flex items-center justify-center
              hover:border-red-500 
              hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]
              transition
            "
          >
            <Icon className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="text-gray-400 text-sm text-center">
        Don’t have an account?{" "}
        <Link href="/auth/signup" className="text-red-500 hover:underline">
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}