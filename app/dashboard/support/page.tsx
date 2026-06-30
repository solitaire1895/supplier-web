"use client";

import { useState, useEffect } from "react";
import {
  LifeBuoy, Mail, MessageCircle, ChevronDown, ChevronUp,
  ExternalLink, Zap, Star, Send, Clock, CheckCircle2, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/provider";

/* ─────────────────────────── FAQ DATA ─────────────────────────── */
const faqs = [
  {
    q: "How do I upgrade my plan?",
    a: "Go to your Profile page and click on the 'Subscription & Billing' tab. You can choose from Explorer, Importer, or Partner plans and complete checkout via Stripe.",
  },
  {
    q: "How do I unlock direct supplier contacts?",
    a: "Direct manufacturer contacts (WhatsApp, WeChat, email) are available on the Importer and Partner plans. Upgrade your plan to access them instantly.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards through Stripe. Payments are processed securely and your card details are never stored on our servers.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel your subscription at any time from your profile billing settings. You will retain access until the end of your current billing period.",
  },
  {
    q: "How often are winning products updated?",
    a: "Winning products are updated in real-time for Importer and Partner plan users. Explorer plan users receive one product per month with a 48-hour delay.",
  },
  {
    q: "I have a billing issue — what should I do?",
    a: "Please reach out to us directly at support@nexusply.com with your account email and a description of the issue. We typically respond within 24 hours.",
  },
];

/* ─────────────────────── TYPES ─────────────────────── */
interface FeedbackRow {
  id: string;
  created_at: string;
  rating: number;
  message: string;
  status: string;
}

/* ═══════════════════════════ PAGE ═══════════════════════════ */
export default function SupportPage() {
  const router = useRouter();
  const { user } = useUser();

  /* FAQ accordion */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  /* Feedback form */
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Past submissions */
  const [history, setHistory] = useState<FeedbackRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* ── Fetch this user's past feedback ── */
  useEffect(() => {
    if (!user) return;
    setLoadingHistory(true);
    supabase
      .from("support_feedback")
      .select("id, created_at, rating, message, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setHistory((data as FeedbackRow[]) || []);
        setLoadingHistory(false);
      });
  }, [user, submitted]);

  /* ── Realtime: push new rows into history live ── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("support_feedback_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_feedback",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setHistory((prev) => [payload.new as FeedbackRow, ...prev].slice(0, 5));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  /* ── Submit feedback ── */
  const handleSubmit = async () => {
    setError(null);
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (message.trim().length < 10) { setError("Please write at least 10 characters."); return; }
    if (!user) { setError("You must be logged in to submit feedback."); return; }

    setSubmitting(true);
    const { error: dbError } = await supabase.from("support_feedback").insert({
      user_id: user.id,
      rating,
      message: message.trim(),
      status: "open",
    });
    setSubmitting(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      setSubmitted(true);
      setRating(0);
      setMessage("");
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* ── HEADER ── */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <LifeBuoy size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">
            How can we <span className="text-red-500">help?</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
            Browse our frequently asked questions, reach out directly, or leave us feedback below.
          </p>
        </div>

        {/* ── CONTACT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:support@nexusply.com"
            className="group flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
              <Mail size={20} />
            </div>
            <div>
              <p className="font-bold text-white mb-1">Email Support</p>
              <p className="text-sm text-gray-400">support@nexusply.com</p>
              <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
            </div>
            <ExternalLink size={14} className="text-gray-600 ml-auto mt-1 group-hover:text-red-500 transition-colors" />
          </a>

          <a
            href="https://wa.me/message/nexusply"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="font-bold text-white mb-1">WhatsApp Community</p>
              <p className="text-sm text-gray-400">Join our active channel</p>
              <p className="text-xs text-gray-500 mt-1">Live discussions & updates</p>
            </div>
            <ExternalLink size={14} className="text-gray-600 ml-auto mt-1 group-hover:text-red-500 transition-colors" />
          </a>
        </div>

        {/* ── FAQ ── */}
        <div>
          <h2 className="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  openIndex === i
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className={`text-sm font-semibold ${openIndex === i ? "text-white" : "text-gray-300"}`}>
                    {faq.q}
                  </span>
                  {openIndex === i
                    ? <ChevronUp size={16} className="text-red-500 flex-shrink-0 ml-4" />
                    : <ChevronDown size={16} className="text-gray-500 flex-shrink-0 ml-4" />}
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── FEEDBACK FORM ── */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
          <h2 className="text-lg font-black text-white tracking-tight mb-1 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
            Send Us Feedback
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Rate your experience and tell us what we can improve.
          </p>

          {/* Star rating */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={`transition-colors ${
                    star <= (hovered || rating)
                      ? "text-red-500 fill-red-500"
                      : "text-white/20"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-xs text-gray-400">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </span>
            )}
          </div>

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Describe your issue or share a suggestion… (min 10 characters)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-gray-500 outline-none resize-none focus:border-red-500/40 focus:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all duration-300 mb-4"
          />

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 mb-3">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold border transition-all duration-300 ${
              submitted
                ? "bg-green-500/10 border-green-500/30 text-green-400 cursor-default"
                : "bg-red-500 border-red-400/50 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
            }`}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Sending…</>
            ) : submitted ? (
              <><CheckCircle2 size={16} /> Feedback sent — thank you!</>
            ) : (
              <><Send size={16} /> Submit Feedback</>
            )}
          </button>
        </div>

        {/* ── SUBMISSION HISTORY ── */}
        {user && (
          <div>
            <h2 className="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
              Your Recent Submissions
            </h2>

            {loadingHistory ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500">No feedback submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3"
                  >
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= row.rating ? "text-red-500 fill-red-500" : "text-white/10"}
                        />
                      ))}
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-300 flex-1 leading-relaxed">{row.message}</p>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                        row.status === "resolved"
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                      }`}>
                        {row.status}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(row.created_at).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── UPGRADE CTA ── */}
        <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(239,68,68,0.08)]">
          <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Still need help?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Upgrade to a premium plan for priority support and direct access to our team.
          </p>
          <button
            onClick={() => router.push("/dashboard/profile?tab=plan")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full text-sm font-bold border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all duration-300"
          >
            <Zap size={16} className="fill-white" /> View Plans
          </button>
        </div>

      </div>
    </div>
  );
}
