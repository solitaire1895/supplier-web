"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/supabase/provider";

type BannerState =
  | { kind: "confirming" }
  | { kind: "paid"; expiresAt: string | null }
  | { kind: "processing" }
  | { kind: "failed" }
  | { kind: "mismatch" };

/** Delays between checks (ms): fast at first, then backing off. ~60s in total. */
const POLL_DELAYS = [0, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 10000, 10000];

/**
 * Shown when the customer comes back from the SasPay checkout
 * (/dashboard?payment=<id>). Confirms the payment with the server, which
 * checks SasPay directly, then refreshes the profile so the plan unlocks
 * without a manual reload.
 */
export default function PaymentStatusBanner() {
  const { t, lang } = useI18n();
  const s = t.subscription;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useUser();
  const paymentId = searchParams.get("payment");
  const [state, setState] = useState<BannerState | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setState({ kind: "confirming" });

    const finish = (next: BannerState) => {
      if (cancelled) return;
      setState(next);
      // Drop ?payment from the URL so a reload does not re-run the check.
      router.replace("/dashboard", { scroll: false });
    };

    const check = async (attempt: number) => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/saspay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentId }),
        });
        const data = await res.json().catch(() => ({}));

        if (data.status === "paid") {
          await refreshProfile();
          router.refresh(); // server components re-read the upgraded plan
          finish({ kind: "paid", expiresAt: data.plan_expires_at ?? null });
          return;
        }
        if (data.status === "failed" && data.message === "payment_mismatch") {
          finish({ kind: "mismatch" });
          return;
        }
        if (res.status === 404 || res.status === 400) {
          finish({ kind: "failed" });
          return;
        }
        // A failed attempt with an open checkout, or a pending one: keep checking for a while,
        // the customer may still be retrying on the payment page.
        if (data.status === "failed" && attempt >= 3) {
          finish({ kind: "failed" });
          return;
        }
      } catch {
        // Network hiccup: just try again.
      }

      if (attempt + 1 < POLL_DELAYS.length) {
        timer = setTimeout(() => check(attempt + 1), POLL_DELAYS[attempt + 1]);
      } else {
        // The webhook will still activate the plan; the provider picks it up on next load.
        finish({ kind: "processing" });
      }
    };

    check(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  // Auto-hide the success message.
  useEffect(() => {
    if (state?.kind !== "paid") return;
    const timeout = setTimeout(() => setState(null), 8000);
    return () => clearTimeout(timeout);
  }, [state]);

  if (!state) return null;

  const locale = lang === "FR" ? "fr-FR" : lang === "CN" ? "zh-CN" : "en-US";

  const styles = {
    confirming: "border-white/10 bg-white/5 text-gray-200",
    paid: "border-green-500/30 bg-green-500/10 text-green-200",
    processing: "border-yellow-500/30 bg-yellow-500/10 text-yellow-100",
    failed: "border-red-500/30 bg-red-500/10 text-red-200",
    mismatch: "border-red-500/30 bg-red-500/10 text-red-200",
  }[state.kind];

  return (
    <div role="status" aria-live="polite" className={`mb-8 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm ${styles}`}>
      {state.kind === "confirming" && <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin" />}
      {state.kind === "paid" && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
      {state.kind === "processing" && <Clock size={18} className="mt-0.5 shrink-0" />}
      {(state.kind === "failed" || state.kind === "mismatch") && <XCircle size={18} className="mt-0.5 shrink-0" />}

      <div className="flex-1">
        {state.kind === "confirming" && s.confirming}
        {state.kind === "paid" && (
          <>
            {s.confirmed}
            {state.expiresAt && (
              <strong className="ml-1">{new Date(state.expiresAt).toLocaleDateString(locale)}</strong>
            )}
          </>
        )}
        {state.kind === "processing" && s.processing}
        {state.kind === "mismatch" && s.mismatch}
        {state.kind === "failed" && (
          <>
            {s.failed}{" "}
            <Link href="/dashboard/subscribe" className="font-semibold underline underline-offset-2">
              {s.tryAgain}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
