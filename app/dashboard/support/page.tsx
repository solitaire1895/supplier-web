"use client";

import { useState } from "react";
import { LifeBuoy, Mail, MessageCircle, ChevronDown, ChevronUp, ExternalLink, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

const faqs = [
  {
    q: "How do I upgrade my plan?",
    a: "Go to your Profile page and click on the 'Subscription & Billing' tab. You can choose from Explorer, Importer, or Partner plans and complete checkout via Stripe."
  },
  {
    q: "How do I unlock direct supplier contacts?",
    a: "Direct manufacturer contacts (WhatsApp, WeChat, email) are available on the Importer and Partner plans. Upgrade your plan to access them instantly."
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards through Stripe. Payments are processed securely and your card details are never stored on our servers."
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel your subscription at any time from your profile billing settings. You will retain access until the end of your current billing period."
  },
  {
    q: "How often are winning products updated?",
    a: "Winning products are updated in real-time for Importer and Partner plan users. Explorer plan users receive one product per month with a 48-hour delay."
  },
  {
    q: "I have a billing issue — what should I do?",
    a: "Please reach out to us directly at support@nexusply.com with your account email and a description of the issue. We typically respond within 24 hours."
  },
];

export default function SupportPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <LifeBuoy size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">
            How can we <span className="text-red-500">help?</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
            Browse our frequently asked questions or reach out to our team directly.
          </p>
        </div>

        {/* CONTACT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <a
            href="mailto:support@nexusply.com"
            className="
              group flex items-start gap-4 p-6
              bg-white/5 border border-white/10 rounded-2xl
              hover:border-red-500/30 hover:bg-red-500/5
              transition-all duration-300
            "
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
            className="
              group flex items-start gap-4 p-6
              bg-white/5 border border-white/10 rounded-2xl
              hover:border-red-500/30 hover:bg-red-500/5
              transition-all duration-300
            "
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

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-500 rounded-full inline-block" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`
                  border rounded-2xl overflow-hidden transition-all duration-300
                  ${openIndex === i
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }
                `}
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
                    : <ChevronDown size={16} className="text-gray-500 flex-shrink-0 ml-4" />
                  }
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

        {/* UPGRADE CTA */}
        <div className="
          bg-gradient-to-br from-red-500/10 to-transparent
          border border-red-500/20
          rounded-3xl p-8 text-center
          shadow-[0_0_40px_rgba(239,68,68,0.08)]
        ">
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
