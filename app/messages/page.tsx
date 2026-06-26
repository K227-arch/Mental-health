"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { insforge, detectKeywords } from "@/lib/insforge";
import type { Message, CounsellorSession } from "@/lib/insforge";

export default function StudentMessagesPage() {
  const [session, setSession] = useState<CounsellorSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollBottom(); }, [messages]);

  const loadMessages = useCallback(async (sid: string) => {
    const { data } = await insforge.database.from("messages")
      .select()
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user) { setLoading(false); return; }
      const uid = data.user.id;
      setUserId(uid);
      setUserName(data.user.profile?.name || data.user.email);

      // Find active session for this student
      const { data: sess } = await insforge.database.from("counsellor_sessions")
        .select().eq("student_id", uid).eq("status", "active").maybeSingle();

      if (sess) {
        setSession(sess as CounsellorSession);
        loadMessages(sess.id);
      } else {
        setLoading(false);
      }
    });
  }, [loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!session) return;
    const channelName = `chat:${session.id}`;
    let cleanup = false;

    (async () => {
      insforge.realtime.on("connect", () => { if (!cleanup) setConnected(true); });
      insforge.realtime.on("disconnect", () => { if (!cleanup) setConnected(false); });
      await insforge.realtime.connect();
      const sub = await insforge.realtime.subscribe(channelName);
      if (sub.ok && !cleanup) {
        setConnected(true);
        insforge.realtime.on<Message>("new_message", (msg) => {
          if (!cleanup) {
            setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          }
        });
      }
    })();

    return () => {
      cleanup = true;
      insforge.realtime.unsubscribe(channelName);
    };
  }, [session]);

  const sendMessage = async () => {
    if (!input.trim() || !session || !userId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    const keywords = detectKeywords(content);
    const isFlagged = keywords.length > 0;

    const { data } = await insforge.database.from("messages").insert([{
      session_id: session.id,
      sender_id: userId,
      sender_role: "student",
      content,
      is_flagged: isFlagged,
    }]).select();

    if (data?.[0]) {
      const msg = data[0] as Message;
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);

      try {
        await insforge.realtime.publish(`chat:${session.id}`, "new_message", msg);
      } catch (_) {}

      // Notify counsellor if flagged
      if (isFlagged) {
        await insforge.database.from("notifications").insert([{
          user_id: "counsellor",
          title: "⚠️ Flagged Message Received",
          body: `A student sent a message containing crisis keywords: "${keywords.join(", ")}"`,
          type: "critical",
          link: `/counsellor/chat?session=${session.id}&student=${userId}`,
        }]);
      } else {
        await insforge.database.from("notifications").insert([{
          user_id: "counsellor",
          title: "New message from student",
          body: content.substring(0, 80),
          type: "info",
          link: `/counsellor/chat?session=${session.id}&student=${userId}`,
        }]);
      }
    }

    setSending(false);
  };

  const startSession = async () => {
    if (!userId) return;

    // Load anonymous_mode from profile
    const { data: prof } = await insforge.database
      .from("student_profiles").select("anonymous_mode,anonymous_id,name").eq("id", userId).maybeSingle();
    const isAnon = (prof as any)?.anonymous_mode ?? false;
    const displayName = isAnon
      ? ((prof as any)?.anonymous_id || "Anonymous Student")
      : ((prof as any)?.name || userName || "Student");

    const { data } = await insforge.database.from("counsellor_sessions").insert([{
      student_id: userId,
      counsellor_id: "counsellor",
      status: "active",
      risk_level: "Minimal",
      student_name: displayName,
    }]).select();

    if (data?.[0]) {
      setSession(data[0] as CounsellorSession);
      await insforge.database.from("notifications").insert([{
        user_id: "counsellor",
        title: "New student session started",
        body: `${displayName} has started a chat session.`,
        type: "info",
        link: `/counsellor/chat?session=${data[0].id}&student=${userId}`,
      }]);
    }
  };

  if (!loading && !userId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col gap-4">
        <p className="text-on-surface-variant">Sign in to access messaging.</p>
        <Link href="/auth/sign-in" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />
      <div className="pt-16 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
        {loading ? (
          <div className="flex items-center justify-center flex-1 h-64">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !session ? (
          <div className="flex items-center justify-center flex-1 flex-col gap-6 py-20">
            <div className="text-center">
              <span className="material-symbols-outlined text-primary text-[60px] block mb-3">support_agent</span>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Connect with your Counsellor</h2>
              <p className="text-on-surface-variant max-w-sm mx-auto">Start a secure, confidential session with your assigned university counsellor.</p>
            </div>
            <button onClick={startSession} className="px-8 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill">chat</span>
              Start Session
            </button>
            <Link href="/crisis" className="text-error text-sm font-medium flex items-center gap-1 hover:underline">
              <span className="material-symbols-outlined text-[16px]">emergency</span>
              Need immediate help?
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined icon-fill">support_agent</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Your Counsellor</h2>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${connected ? "bg-secondary" : "bg-outline-variant"}`} />
                    <span className="text-xs text-on-surface-variant">{connected ? "Real-time connected" : "Connecting…"}</span>
                  </div>
                </div>
              </div>
              <Link href="/crisis" className="text-xs text-error font-medium flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[14px]">emergency</span>
                Crisis Help
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-[40px] block mb-2 opacity-20">chat</span>
                  Session started. Your counsellor will respond shortly.
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-end gap-3 max-w-[80%] ${msg.sender_role === "student" ? "self-end flex-row-reverse" : "self-start"}`}>
                  {msg.sender_role !== "student" && (
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender_role === "student"
                      ? "bg-primary text-on-primary rounded-br-sm"
                      : "bg-surface-container-lowest text-on-surface border border-outline-variant/20 shadow-sm rounded-bl-sm"
                  }`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 opacity-60 ${msg.sender_role === "student" ? "text-right" : ""}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="py-4 border-t border-outline-variant flex gap-3 items-end">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a confidential message…"
                rows={1}
                className="flex-1 bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary rounded-xl py-3 px-4 text-on-surface text-sm resize-none min-h-[48px] max-h-[120px]" />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="w-11 h-11 rounded-full bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center shadow-md disabled:opacity-40 shrink-0">
                {sending
                  ? <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[20px]" style={{ marginLeft: "2px" }}>send</span>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
