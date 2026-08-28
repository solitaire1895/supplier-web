"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Clock, Loader2, ArrowLeft, Plus, MessageSquare,
  CheckCheck, User, Truck, Package, CreditCard, Wrench,
  ChevronLeft, CheckCircle2, XCircle, Check, Search,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/provider";
import {
  createConversation, sendMessage, updateConversationStatus,
} from "@/lib/supabase/actions";

/* ─────────────────────── CATEGORIES ─────────────────────── */
const CATEGORIES = [
  { id: "account", label: "Account & Profile", icon: User, description: "Login problems, profile settings, language, account information" },
  { id: "supplier", label: "Supplier Support", icon: Truck, description: "Contacted suppliers, supplier information, matching, issues" },
  { id: "product", label: "Product Support", icon: Package, description: "Product pages, winning products, favorites, product info" },
  { id: "billing", label: "Billing & Plan", icon: CreditCard, description: "Current plan, upgrade, payments, subscription issues" },
  { id: "technical", label: "Technical Support", icon: Wrench, description: "Bugs, pages not loading, navigation, general technical issues" },
];

/* ─────────────────────── TYPES ─────────────────────── */
interface Conversation {
  id: string;
  subject: string;
  status: string;
  category: string | null;
  ticket_id: string | null;
  assigned_agent: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

/* ─────────────────────── HELPERS ─────────────────────── */
function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatListTime(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatTime(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500",
  waiting: "bg-yellow-500",
  resolved: "bg-gray-600",
  closed: "bg-gray-700",
};

/* ═══════════════════════════ PAGE ═══════════════════════════ */
export default function SupportPage() {
  const router = useRouter();
  const { user } = useUser();

  /* View: "list" | "new" | "chat" */
  const [view, setView] = useState<"list" | "new" | "chat">("list");

  /* Chat state */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [firstMessage, setFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResolution, setShowResolution] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  /* ── Fetch conversations ── */
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setConversations((data as Conversation[]) || []);
    setLoadingConversations(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ── Fetch messages ── */
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessage[]) || []);
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

  /* ── Realtime: conversations ── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("support_conversations_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations", filter: `user_id=eq.${user.id}` }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  /* ── Realtime: messages ── */
  useEffect(() => {
    if (!activeConversation) return;
    const channel = supabase
      .channel(`support_messages_${activeConversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeConversation.id}` }, (payload) => {
        setMessages((prev) => {
          const newMsg = payload.new as ChatMessage;
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Resolution prompt ── */
  useEffect(() => {
    if (activeConversation && activeConversation.status === "open" && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      setShowResolution(lastMsg.sender_role === "admin");
    } else {
      setShowResolution(false);
    }
  }, [messages, activeConversation]);

  /* ── Send message ── */
  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setSending(true);
    setError(null);
    const result = await sendMessage(activeConversation.id, newMessage, false);
    setSending(false);
    if (result.error) { setError(result.error); }
    else { setNewMessage(""); messageInputRef.current?.focus(); }
  };

  /* ── Start conversation ── */
  const handleStartConversation = async () => {
    if (!firstMessage.trim() || !selectedCategory) return;
    setCreating(true);
    setError(null);
    const categoryLabel = CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Support Request";
    const result = await createConversation(categoryLabel, categoryLabel);
    if (result.error) { setError(result.error); setCreating(false); return; }
    const msgResult = await sendMessage(result.conversation.id, firstMessage, false);
    setCreating(false);
    if (msgResult.error) { setError(msgResult.error); return; }
    setFirstMessage(""); setSelectedCategory(null);
    await fetchConversations();
    setActiveConversation(result.conversation);
    setView("chat");
  };

  /* ── Resolution handlers ── */
  const handleResolved = async () => {
    if (!activeConversation) return;
    await updateConversationStatus(activeConversation.id, "resolved");
    setActiveConversation({ ...activeConversation, status: "resolved" });
    setShowResolution(false);
    await fetchConversations();
  };

  const handleNotResolved = async () => {
    if (!activeConversation) return;
    await updateConversationStatus(activeConversation.id, "waiting");
    setActiveConversation({ ...activeConversation, status: "waiting" });
    setShowResolution(false);
    await fetchConversations();
  };

  const handleReopen = async () => {
    if (!activeConversation) return;
    await updateConversationStatus(activeConversation.id, "open");
    setActiveConversation({ ...activeConversation, status: "open" });
    await fetchConversations();
  };

  /* ── Date separator logic ── */
  const shouldShowDateSeparator = (idx: number): string | null => {
    if (idx === 0) return getDateLabel(messages[0].created_at);
    const prevDate = new Date(messages[idx - 1].created_at).toDateString();
    const currDate = new Date(messages[idx].created_at).toDateString();
    if (prevDate !== currDate) return getDateLabel(messages[idx].created_at);
    return null;
  };

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-4 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ═══════════════════ LIST VIEW (WhatsApp home) ═══════════════════ */}
        {view === "list" && (
          <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                <Image src="/logo.jpg" alt="Nexusply" fill className="object-cover" sizes="44px" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black tracking-tight text-white">Nexusply Support</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-400">Online · Typically replies within a few hours</span>
                </div>
              </div>
            </div>

            {/* ── Conversation list ── */}
            <div className="space-y-1">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading…
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border border-white/10 mb-4 opacity-40">
                    <Image src="/logo.jpg" alt="Nexusply" fill className="object-cover" sizes="80px" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">No conversations yet</p>
                  <p className="text-xs text-gray-600">Tap the + button to start a new chat</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConversation(conv); setView("chat"); }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 text-left"
                  >
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                      <Image src="/logo.jpg" alt="Nexusply" fill className="object-cover" sizes="48px" />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#050505] ${STATUS_COLORS[conv.status] || "bg-gray-600"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-bold text-white truncate">{conv.subject}</span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{formatListTime(conv.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {conv.ticket_id && (
                          <span className="text-[10px] font-mono text-gray-600">{conv.ticket_id}</span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{conv.status}</span>
                        {conv.assigned_agent && (
                          <span className="text-[10px] text-gray-600">· {conv.assigned_agent}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* ── FAB (Floating Action Button) ── */}
            <button
              onClick={() => setView("new")}
              className="fixed bottom-8 right-8 lg:right-[calc(50%-20rem)] w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:shadow-[0_6px_30px_rgba(239,68,68,0.6)] transition-all duration-300 z-50"
            >
              <Plus size={24} />
            </button>
          </div>
        )}

        {/* ═══════════════════ NEW CHAT VIEW ═══════════════════ */}
        {view === "new" && (
          <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
              <button
                onClick={() => { setView("list"); setSelectedCategory(null); }}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-lg font-black tracking-tight text-white">New Chat</h1>
            </div>

            {/* ── Category grid ── */}
            {!selectedCategory ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Choose a category</p>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:border-red-500/20 hover:bg-white/[0.06] transition-all duration-300 text-left"
                    >
                      <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center text-red-500 flex-shrink-0">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm">{cat.label}</p>
                        <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* ── Message form ── */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center text-red-500 flex-shrink-0">
                    {(() => {
                      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
                      const Icon = cat?.icon || MessageSquare;
                      return <Icon size={18} />;
                    })()}
                  </div>
                  <span className="text-sm font-bold text-white">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                  </span>
                </div>

                <textarea
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  rows={5}
                  autoFocus
                  placeholder="Describe your issue or question…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/30 transition-all duration-300 resize-none"
                />

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={handleStartConversation}
                  disabled={creating || !firstMessage.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting…</>
                  ) : (
                    <><Send size={16} /> Start Conversation</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ CHAT VIEW (WhatsApp conversation) ═══════════════════ */}
        {view === "chat" && activeConversation && (
          <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* ── Chat Header ── */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08] flex-shrink-0">
              <button
                onClick={() => { setView("list"); setActiveConversation(null); }}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                <Image src="/logo.jpg" alt="Nexusply" fill className="object-cover" sizes="44px" />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#050505] ${STATUS_COLORS[activeConversation.status] || "bg-gray-600"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate">{activeConversation.subject}</h2>
                  {activeConversation.ticket_id && (
                    <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">{activeConversation.ticket_id}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {activeConversation.assigned_agent || "Nexusply Support"} · {activeConversation.status}
                </p>
              </div>

              {(activeConversation.status === "resolved" || activeConversation.status === "closed") && (
                <button
                  onClick={handleReopen}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all"
                >
                  <CheckCheck size={14} />
                  Reopen
                </button>
              )}
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-600 mt-1">Send a message below to start the conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isUser = msg.sender_role === "user";
                  const dateLabel = shouldShowDateSeparator(idx);
                  const showAgentName = !isUser && (idx === 0 || messages[idx - 1].sender_role !== "admin");

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {dateLabel && (
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/[0.06] px-3 py-1 rounded-full">
                            {dateLabel}
                          </span>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1`}>
                        <div className={`max-w-[75%] px-3 py-2 ${
                          isUser
                            ? "bg-red-500 text-white rounded-2xl rounded-br-md"
                            : "bg-white/[0.08] text-gray-100 rounded-2xl rounded-bl-md border border-white/[0.06]"
                        }`}>
                          {showAgentName && (
                            <p className="text-[10px] font-bold tracking-wider text-red-400 mb-0.5">
                              {activeConversation.assigned_agent || "Nexusply Support"}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1 justify-end mt-0.5 ${isUser ? "text-white/60" : "text-gray-500"}`}>
                            <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                            {isUser && <Check size={12} className="text-white/60" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* ── Resolution Prompt ── */}
              {showResolution && (
                <div className="flex justify-center my-4">
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 max-w-xs text-center">
                    <p className="text-sm text-gray-300 font-medium mb-3">Was your issue resolved?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleResolved}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-bold hover:bg-green-500/20 transition-all"
                      >
                        <CheckCircle2 size={14} /> Yes, solved
                      </button>
                      <button
                        onClick={handleNotResolved}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-full text-xs font-bold hover:bg-white/10 transition-all"
                      >
                        <XCircle size={14} /> Not yet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Composer ── */}
            {activeConversation.status !== "closed" && activeConversation.status !== "resolved" && (
              <div className="flex items-end gap-2 pt-3 border-t border-white/[0.08] flex-shrink-0">
                {error && <p className="text-xs text-red-400 mb-1 w-full">{error}</p>}
                <textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  rows={1}
                  placeholder="Type a message…"
                  className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/30 transition-all duration-300 resize-none max-h-32"
                  style={{ minHeight: "42px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-red-500 text-white rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}