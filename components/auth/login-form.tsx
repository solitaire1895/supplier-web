"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { FaGoogle, FaFacebookF, FaApple } from "react-icons/fa"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useI18n } from "@/lib/i18n"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { t } = useI18n()

  // ✅ HANDLE LOGIN
  const handleLogin = async () => {
    setError("")

    if (!email || !password) {
      return setError(t.auth.allFieldsRequired)
    }

    try {
      setLoading(true)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // ✅ Use hard navigation to ensure cookies are sent to the server middleware
      window.location.href = "/dashboard"

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ HANDLE SOCIAL LOGIN
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
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
          {t.auth.loginTitle}
        </h1>
        <p className="text-gray-400">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">

        {/* Email */}
        <div className="space-y-2">
          <Label className="text-gray-300">{t.auth.emailLabel}</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-white/5 border-white/10 focus:border-red-500 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label className="text-gray-300">{t.auth.passwordLabel}</Label>
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
          {loading ? t.auth.loggingIn : t.auth.loginButton}
        </Button>
      </div>

      {/* Footer */}
      <p className="text-gray-400 text-sm text-center">
        {t.auth.noAccount}{" "}
        <Link href="/auth/signup" className="text-red-500 hover:underline">
          {t.auth.signupLink}
        </Link>
      </p>
    </motion.div>
  )
}