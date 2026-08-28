"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Clock, Loader2, MessageSquare, Search,
  User, Truck, Package, CreditCard, Wrench, Tag,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import {
  sendMessage, updateConversationStatus, assignAgent,
} from "@/lib/supabase/actions";

/* ─────────────────────── CATEGORIES ─────────────────────── */
const CATEGORY_ICONS: Record<string, typeof User> = {
  "Account & Profile": User,
  "Supplier Support": Truck,
  "Product Support": Package,
  "Billing & Plan": CreditCard,
  "Technical Support": Wrench,
};

const STATUSES = ["open", "waiting", "resolved", "closed"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500",
  waiting: "bg-yellow-500",
  resolved: "bg-gray-600",
  closed: "bg-gray-700",
};

const STATUS_TEXT: Record<string, string> = {
  open: "text-green-400",
  waiting: "text-yellow-400",
  resolved: "text-gray-500",
  closed: "text-gray-600",
};

/* ─────────────────────── TYPES ─────────────────────── */
interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  category: string | null;
  ticket_id: string | null;
  assigned_agent: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; full_name: string } | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function SupportChatAdmin() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [agentName, setAgentName] = useState("");
  const [showAgentInput, setShowAgentInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  /* ── Fetch all conversations (admin sees all) ──
   * NOTE: support_conversations.user_id references auth.users(id), NOT
   * public.profiles(id), so we can't use a PostgREST relationship join.
   * We fetch conversations first, then batch-fetch the matching profiles
   * and merge them manually.
   */
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);

    // 1. Fetch all conversations
    const { data: convData, error: convError } = await supabase
      .from("support_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (convError) {
      console.error("Admin chat: Error fetching conversations:", convError);
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    const conversationsRaw = (convData as Conversation[]) || [];

    // 2. Batch-fetch profiles for all user_ids
    const userIds = [...new Set(conversationsRaw.map((c) => c.user_id).filter(Boolean))];

    if (userIds.length === 0) {
      setConversations(conversationsRaw);
      setLoadingConversations(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Admin chat: Error fetching user profiles:", profilesError);
      setConversations(conversationsRaw);
      setLoadingConversations(false);
      return;
    }

    // 3. Merge profile data onto conversations
    const profileMap = new Map<string, { email: string; full_name: string }>();
    (profilesData || []).forEach((p: any) => {
      profileMap.set(p.id, { email: p.email || "", full_name: p.full_name || "" });
    });

    const merged = conversationsRaw.map((conv) => ({
      ...conv,
      profiles: profileMap.get(conv.user_id) || null,
    }));

    setConversations(merged);
    setLoadingConversations(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ── Fetch messages for active conversation ── */
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

  /* ── Realtime: new/updated conversations ── */
  useEffect(() => {
    const channel = supabase
      .channel("admin_support_conversations_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_conversations",
        },
        () => fetchConversations()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations]);

  /* ── Realtime: new messages in active conversation ── */
  useEffect(() => {
    if (!activeConversation) return;
    const channel = supabase
      .channel(`admin_support_messages_${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const newMsg = payload.new as ChatMessage;
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation]);

  /* ── Auto-scroll to bottom on new messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send admin reply ── */
  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    setSending(true);
    setError(null);

    const result = await sendMessage(activeConversation.id, newMessage, true);
    setSending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setNewMessage("");
      messageInputRef.current?.focus();
    }
  };

  /* ── Change conversation status ── */
  const handleStatusChange = async (newStatus: Status) => {
    if (!activeConversation) return;
    await updateConversationStatus(activeConversation.id, newStatus);
    setActiveConversation({ ...activeConversation, status: newStatus });
    await fetchConversations();
  };

  /* ── Assign agent ── */
  const handleAssignAgent = async () => {
    if (!activeConversation || !agentName.trim()) return;
    const result = await assignAgent(activeConversation.id, agentName);
    if (result.error) {
      setError(result.error);
    } else {
      setActiveConversation({ ...activeConversation, assigned_agent: agentName.trim() });
      setShowAgentInput(false);
      setAgentName("");
      await fetchConversations();
    }
  };

  /* ── Format helpers ── */
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ── Filtered conversations ── */
  const filteredConversations = conversations.filter((conv) => {
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    const email = conv.profiles?.email || "";
    const name = conv.profiles?.full_name || "";
    const ticketId = conv.ticket_id || "";
    const matchesSearch =
      !searchTerm ||
      conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openCount = conversations.filter((c) => c.status === "open").length;
  const waitingCount = conversations.filter((c) => c.status === "waiting").length;

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
          <Image
            src="/logo.jpg"
            alt="Nexusply"
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Nexusply Support</h3>
          <p className="text-xs text-gray-500 font-medium">
            Manage user support conversations
            {openCount > 0 && <span className="ml-2 text-green-400">• {openCount} open</span>}
            {waitingCount > 0 && <span className="ml-2 text-yellow-400">• {waitingCount} waiting</span>}
          </p>
        </div>
      </div>

      {/* ── CHAT CONTAINER ── */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[600px] max-h-[700px]">

          {/* ── CONVERSATION LIST (LEFT) ── */}
          <div className="border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col">
            {/* Search + filter */}
            <div className="p-3 border-b border-white/[0.08] space-y-2">
              <div className="flex items-center bg-white/5 border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-red-500/30 transition-all">
                <Search size={14} className="text-gray-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by user, subject, ticket…"
                  className="bg-transparent outline-none text-sm text-white placeholder-gray-500 w-full"
                />
              </div>
              <div className="flex gap-1">
                {(["all", ...STATUSES] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      statusFilter === f
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : "bg-white/5 border border-transparent text-gray-500 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  <Loader2 size={16} className="animate-spin mr-2" /> Loading…
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageSquare size={32} className="text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500">
                    {conversations.length === 0 ? "No conversations yet." : "No matches found."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const catIcon = conv.category ? CATEGORY_ICONS[conv.category] : null;
                  const CatIcon = catIcon || MessageSquare;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                        activeConversation?.id === conv.id
                          ? "bg-red-500/10 border border-red-500/20"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <CatIcon size={14} className="text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-white truncate">
                            {conv.subject}
                          </span>
                        </div>
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${STATUS_COLORS[conv.status] || "bg-gray-600"}`} />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {conv.ticket_id && (
                          <span className="text-[10px] font-mono text-gray-600">{conv.ticket_id}</span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${STATUS_TEXT[conv.status] || "text-gray-500"}`}>
                          {conv.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-1">
                        {conv.profiles?.email || "Unknown user"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={11} />
                        {formatDate(conv.updated_at)}
                        {conv.assigned_agent && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400">{conv.assigned_agent}</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── CHAT AREA (RIGHT) ── */}
          <div className="flex flex-col">
            {!activeConversation ? (
              /* ── EMPTY STATE ── */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 mb-4 opacity-30">
                  <Image
                    src="/logo.jpg"
                    alt="Nexusply"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No conversation selected</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Select a conversation from the list to view and reply to user messages.
                </p>
              </div>
            ) : (
              /* ── ACTIVE CHAT ── */
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-white truncate">{activeConversation.subject}</h3>
                      {activeConversation.ticket_id && (
                        <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">
                          {activeConversation.ticket_id}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 truncate">
                        {activeConversation.profiles?.email || "Unknown user"}
                      </span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${STATUS_TEXT[activeConversation.status] || "text-gray-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[activeConversation.status] || "bg-gray-600"}`} />
                        {activeConversation.status}
                      </span>
                      {activeConversation.assigned_agent && (
                        <>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">{activeConversation.assigned_agent}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status dropdown + agent assignment */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status selector */}
                    <select
                      value={activeConversation.status}
                      onChange={(e) => handleStatusChange(e.target.value as Status)}
                      className="bg-white/5 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-red-500/30 cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-black text-white">
                          {s}
                        </option>
                      ))}
                    </select>

                    {/* Agent assignment */}
                    {showAgentInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          placeholder="Agent name"
                          autoFocus
                          className="bg-white/5 border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-red-500/30 w-24"
                        />
                        <button
                          onClick={handleAssignAgent}
                          className="px-2 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAgentInput(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white/5 border-white/[0.08] text-gray-400 hover:bg-white/10 transition-all"
                      >
                        <Tag size={12} />
                        Assign
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
                      <Loader2 size={16} className="animate-spin mr-2" /> Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-sm text-gray-500">No messages in this conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isAdmin = msg.sender_role === "admin";
                      const showAgentHeader =
                        isAdmin &&
                        (idx === 0 || messages[idx - 1].sender_role !== "admin");
                      const showUserHeader =
                        !isAdmin &&
                        (idx === 0 || messages[idx - 1].sender_role !== "user");

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          {/* User avatar */}
                          {!isAdmin && (
                            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 flex-shrink-0 mt-1">
                              <User size={16} />
                            </div>
                          )}

                          <div className={`max-w-[70%] ${
                            isAdmin
                              ? "bg-red-500 text-white rounded-2xl rounded-br-md shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                              : "bg-white/[0.06] text-gray-100 rounded-2xl rounded-bl-md border border-white/[0.08]"
                          }`}>
                            <div className="px-4 py-2.5">
                              {showUserHeader && (
                                <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-1">
                                  {activeConversation.profiles?.email?.split("@")[0] || "User"}
                                </p>
                              )}
                              {showAgentHeader && (
                                <p className="text-[10px] font-bold tracking-wider text-red-300 mb-1">
                                  {activeConversation.assigned_agent || "Support Agent"}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-1.5 ${
                                isAdmin ? "text-white/50" : "text-gray-500"
                              }`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Admin avatar */}
                          {isAdmin && (
                            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 mt-1">
                              <Image
                                src="/logo.jpg"
                                alt="Nexusply"
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {activeConversation.status !== "closed" && (
                  <div className="p-4 border-t border-white/[0.08] bg-white/[0.02]">
                    {error && (
                      <p className="text-xs text-red-400 mb-2">{error}</p>
                    )}
                    <div className="flex items-end gap-3">
                      <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={1}
                        placeholder="Type your reply…"
                        className="flex-1 bg-white/5 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/30 focus:shadow-[0_0_15px_rgba(239,68,68,0.08)] transition-all duration-300 resize-none max-h-32"
                        style={{ minHeight: "44px" }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !newMessage.trim()}
                        className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-red-500 text-white rounded-2xl border border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-600 hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}