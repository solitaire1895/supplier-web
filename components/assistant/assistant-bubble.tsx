"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

const TEXT = {
  FR: {
    open: "Ouvrir Nexus AI", close: "Fermer", title: "Nexus AI", subtitle: "Votre assistant import Chine",
    placeholder: "Posez votre question…", send: "Envoyer", left: (n: number) => `${n} message${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""} aujourd'hui`,
    limit: "Vous avez utilisé tous vos messages Nexus AI pour aujourd'hui. Ils reviennent à minuit (heure de Douala), ou passez à un plan supérieur pour en avoir plus.",
    upgrade: "Voir les plans", error: "Nexus AI est indisponible pour le moment. Réessayez dans quelques minutes.",
    privacy: "Ne partagez pas de mots de passe ni de données bancaires.",
    examples: ["Comment payer un fournisseur sur 1688 ?", "Avion ou bateau pour 50 kg de marchandises ?", "Comment vérifier un fournisseur chinois ?"],
  },
  EN: {
    open: "Open Nexus AI", close: "Close", title: "Nexus AI", subtitle: "Your China import assistant",
    placeholder: "Ask your question…", send: "Send", left: (n: number) => `${n} message${n === 1 ? "" : "s"} left today`,
    limit: "You've used all your Nexus AI messages for today. They come back at midnight (Douala time), or upgrade your plan to get more.",
    upgrade: "See plans", error: "Nexus AI is unavailable right now. Please try again in a few minutes.",
    privacy: "Don't share passwords or bank details.",
    examples: ["How do I pay a supplier on 1688?", "Air or sea freight for 50 kg of goods?", "How do I check a Chinese supplier?"],
  },
  CN: {
    open: "打开 Nexus AI", close: "关闭", title: "Nexus AI", subtitle: "您的中国进口助手",
    placeholder: "输入您的问题…", send: "发送", left: (n: number) => `今天还剩 ${n} 条消息`,
    limit: "您今天的 Nexus AI 消息已用完。午夜（杜阿拉时间）恢复，或升级套餐获取更多。",
    upgrade: "查看套餐", error: "Nexus AI 暂时不可用，请几分钟后再试。",
    privacy: "请勿分享密码或银行信息。",
    examples: ["如何在 1688 上向供应商付款？", "50 公斤货物走空运还是海运？", "如何核实中国供应商？"],
  },
};

/** Floating Nexus AI chat, shown on dashboard pages only. History lives in memory (cleared on reload). */
export function AssistantBubble() {
  const pathname = usePathname();
  const { lang } = useI18n();
  const t = TEXT[lang] ?? TEXT.FR;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<"limit" | "error" | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || remaining !== null) return;
    fetch("/api/assistant").then((r) => (r.ok ? r.json() : null)).then((d) => d && setRemaining(d.remaining)).catch(() => {});
  }, [open, remaining]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, notice]);

  if (!pathname?.startsWith("/dashboard")) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history: Msg[] = [...messages, { role: "user" as const, content }].slice(-20);
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "limit") setRemaining(0);
        setMessages(history.slice(0, -1)); // the question was not answered: put it back in the input
        setInput(content);
        setNotice(err.error === "limit" ? "limit" : "error");
        return;
      }
      const left = res.headers.get("X-Assistant-Remaining");
      if (left !== null) setRemaining(Number(left));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
      }
      if (!answer) setNotice("error");
    } catch {
      setNotice("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t.open}
          className="fixed bottom-20 right-4 z-[60] grid h-14 w-14 place-items-center rounded-full bg-red-600 text-white shadow-[0_15px_40px_-10px_rgba(239,68,68,0.7)] transition-transform hover:scale-105 md:bottom-6 md:right-6"
        >
          <Sparkles size={22} aria-hidden />
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="fixed inset-0 z-[80] flex flex-col bg-ink font-text sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-3rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-white/[0.08] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        >
          <header className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-red-600/15 text-red-500"><Sparkles size={16} aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="truncate text-xs text-white/50">{remaining !== null ? t.left(remaining) : t.subtitle}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t.close} className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-2">
                {t.examples.map((q) => (
                  <button key={q} onClick={() => send(q)} disabled={busy} className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white/80 hover:border-white/20 hover:text-white">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-red-600 text-white" : "bg-white/[0.06] text-white/90"}`}>
                  {m.content || (busy && i === messages.length - 1 ? "…" : "")}
                </p>
              </div>
            ))}
            {notice === "limit" && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-white/90">
                <p>{t.limit}</p>
                <Link href="/dashboard/profile?tab=plan" onClick={() => setOpen(false)} className="mt-3 inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                  {t.upgrade}
                </Link>
              </div>
            )}
            {notice === "error" && <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">{t.error}</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-white/[0.08] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={t.placeholder}
                rows={1}
                maxLength={2000}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-base text-white placeholder:text-white/40 focus:border-white/25 focus:outline-none sm:text-sm"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label={t.send} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-600 text-white disabled:opacity-40">
                <Send size={17} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-white/40">{t.privacy}</p>
          </form>
        </section>
      )}
    </>
  );
}
