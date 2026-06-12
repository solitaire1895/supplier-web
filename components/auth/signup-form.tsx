"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebookF, FaApple } from "react-icons/fa";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { t } = useI18n();

  // ✅ HANDLE SIGNUP
  const handleSignup = async () => {
    setError("");

    if (!email || !password || !confirmPassword) {
      return setError(t.auth.allFieldsRequired);
    }

    if (password !== confirmPassword) {
      return setError(t.auth.passwordsDoNotMatch);
    }

    if (!agreed) {
      return setError(t.auth.mustAgree);
    }

    try {
      setLoading(true);

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      // ✅ SUCCESS → redirect
      router.push(`/auth/login?message=${encodeURIComponent(t.auth.checkEmail)}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          {t.auth.signupTitle}
        </h1>
        <p className="text-gray-400">
          {t.auth.signupSubtitle}
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label className="text-gray-300">{t.auth.confirmPasswordLabel}</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-white/5 border-white/10 focus:border-red-500 text-white placeholder:text-gray-500"
          />
        </div>

        {/* ✅ AGREEMENT CHECKBOX */}
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500"
          />
          <Label htmlFor="agree" className="text-sm text-gray-400 leading-snug cursor-pointer">
            {t.auth.agreeTerms}
            <div className="mt-1 space-x-2">
              <Link href="/terms" className="text-red-500 hover:underline">{t.footer.links.terms}</Link>
              <span>&</span>
              <Link href="/privacy" className="text-red-500 hover:underline">{t.footer.links.privacy}</Link>
            </div>
          </Label>
        </div>

        {/* ✅ ERROR MESSAGE */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* BUTTON */}
        <Button
          onClick={handleSignup}
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
          {loading ? t.auth.signingUp : t.auth.signupButton}
        </Button>
      </div>

      {/* Footer */}
      <p className="text-gray-400 text-sm text-center">
        {t.auth.hasAccount}{" "}
        <Link href="/auth/login" className="text-red-500 hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>
    </motion.div>
  );
}