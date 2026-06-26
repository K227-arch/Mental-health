"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { insforge, detectKeywords } from "@/lib/insforge";
import type { Message, CounsellorSession } from "@/lib/insforge";

function ChatContent() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  const studentId = params.get("student");

  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<CounsellorSession | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [flaggedMsg, setFlaggedMsg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const channelName = `chat:${sessionId}`;

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await insforge.database.from("messages")
      .select()
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, [sessionId]);

  // Load session info
  useEffect(() => {
    if (!sessionId) return;
    insforge.database.from("counsellor_sessions").select().eq("id", sessionId).maybeSingle()
      .then(({ data }) => { if (data) setSession(data as CounsellorSession); });
  }, [sessionId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!sessionId) return;
    let cleanup = false;

    (async () => {
      insforge.realtime.on("connect", () => {
        if (!cleanup) setConnected(true);
      });
      insforge.realtime.on("disconnect", () => {
        if (!cleanup) setConnected(false);
      });

      await insforge.realtime.connect();
      const sub = await insforge.realtime.subscribe(channelName);

      if (sub.ok && !cleanup) {
        setConnected(true);
        insforge.realtime.on<Message>("new_message", (msg) => {
          if (!cleanup) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        });
      }
    })();

    return () => {
      cleanup = true;
      insforge.realtime.unsubscribe(channelName);
    };
  }, [sessionId, channelName]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || sending) return;
    setSending(true);

    const content = input.trim();
    setInput("");

    // Check for flagged keywords
    const keywords = detectKeywords(content);
    const isFlagged = keywords.length > 0;
    if (isFlagged) setFlaggedMsg(`⚠️ Flagged keywords detected: ${keywords.join(", ")}`);

    const { data } = await insforge.database.from("messages").insert([{
      session_id: sessionId,
      sender_id: "counsellor",
      sender_role: "counsellor",
      content,
      is_flagged: isFlagged,
    }]).select();

    if (data?.[0]) {
      const msg = data[0] as Message;
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);

      // Publish via realtime so student sees it instantly
      try {
        await insforge.realtime.publish(channelName, "new_message", msg);
      } catch (_) { /* Realtime not subscribed yet — DB polling still works */ }

      // Send notification to student
      if (studentId) {
        await insforge.database.from("notifications").insert([{
          user_id: studentId,
          title: "New message from your counsellor",
          body: content.substring(0, 80) + (content.length > 80 ? "…" : ""),
          type: "info",
          link: "/dashboard",
        }]);
      }
    }

    setSending(false);
  };

  const quickReplies = [
    "I hear you. How are you feeling right now?",
    "Thank you for sharing that with me.",
    "Would you like to schedule a session to discuss this further?",
    "You're doing really well to reach out.",
    "I'm here for you. Take your time.",
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/counsellor" className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined icon-fill">person</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">
              {session?.student_name || studentId || "Student"}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-secondary" : "bg-outline-variant"}`} />
              <span className="text-xs text-on-surface-variant">{connected ? "Real-time connected" : "Connecting…"}</span>
              {session?.risk_level && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${session.risk_level === "Critical" ? "bg-error-container text-on-error-container" : "bg-secondary-container text-on-secondary-container"}`}>
                  {session.risk_level} Risk
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { insforge.database.from("counsellor_sessions").update({ status: "closed" }).eq("id", sessionId!); }}
            className="text-xs px-3 py-1.5 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
            Close Session
          </button>
        </div>
      </div>

      {/* Flagged keywords banner */}
      {flaggedMsg && (
        <div className="bg-error-container text-on-error-container px-4 py-2 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">warning</span>{flaggedMsg}</span>
          <button onClick={() => setFlaggedMsg(null)} className="material-symbols-outlined text-[16px]">close</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 bg-surface">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-[50px] block mb-3 opacity-20">chat</span>
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-3 max-w-[80%] ${msg.sender_role === "counsellor" ? "self-end flex-row-reverse" : "self-start"}`}>
              {msg.sender_role !== "counsellor" && (
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 text-xs font-bold">
                  S
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender_role === "counsellor"
                  ? "bg-primary text-on-primary rounded-br-sm"
                  : msg.sender_role === "system"
                  ? "bg-surface-container text-on-surface-variant italic text-xs rounded-bl-sm"
                  : "bg-surface-container-lowest text-on-surface border border-outline-variant/20 shadow-sm rounded-bl-sm"
              } ${msg.is_flagged ? "border-2 border-error/50" : ""}`}>
                {msg.content}
                {msg.is_flagged && (
                  <span className="block text-[10px] mt-1 text-error/80 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">flag</span>Flagged content
                  </span>
                )}
                <div className={`text-[10px] mt-1 opacity-60 ${msg.sender_role === "counsellor" ? "text-right" : ""}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {quickReplies.map(r => (
            <button key={r} onClick={() => setInput(r)}
              className="text-xs whitespace-nowrap px-3 py-1.5 bg-surface-container border border-outline-variant/50 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0">
              {r.substring(0, 35)}{r.length > 35 ? "…" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a secure message…"
            rows={1}
            className="w-full bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary rounded-xl py-3 px-4 text-on-surface text-sm resize-none min-h-[48px] max-h-[120px]"
          />
        </div>
        <button onClick={sendMessage} disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center shadow-md transition-colors disabled:opacity-40 shrink-0">
          {sending
            ? <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
            : <span className="material-symbols-outlined text-[20px]" style={{ marginLeft: "2px" }}>send</span>
          }
        </button>
      </div>
    </div>
  );
}

export default function CounsellorChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
