"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import StudentSidebar from "../../components/StudentSidebar";
import { useTranslation } from "../../lib/i18n";

interface ChatMsg {
  id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

export default function StudentChatPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<{ id?: string; name?: string } | null>(null);
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [counsellorOnline, setCounsellorOnline] = useState(false);
  const [counsellorLastSeen, setCounsellorLastSeen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check counsellor online status every 30s
  useEffect(() => {
    const check = () => {
      fetch("/api/presence?role=counsellor").then(r => r.ok ? r.json() : null).then(d => {
        if (d) { setCounsellorOnline(d.online); setCounsellorLastSeen(d.lastSeen); }
      });
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then(async (d) => {
        if (!d?.user?.id) { setLoading(false); return; }
        setUser(d.user);

        // Find the student's session
        const sessRes = await fetch(`/api/sessions?studentId=${d.user.id}`);
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.sessions && sessData.sessions.length > 0) {
            setSession(sessData.sessions[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch messages + poll
  useEffect(() => {
    if (!session?.id) return;

    const fetchMessages = () => {
      fetch(`/api/messages?sessionId=${session.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.messages) setMessages(data.messages); });
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !session || !user?.id) return;
    setSending(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        senderId: user.id,
        senderRole: "student",
        content: input.trim(),
        counsellorId: "counsellor-system",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setInput("");
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderMessageContent = (content: string) => {
    const voiceMatch = content.match(/🎤 Voice note: (https?:\/\/\S+)/);
    if (voiceMatch) {
      const url = voiceMatch[1];
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-medium opacity-80">
            <span className="material-symbols-outlined text-[16px]">mic</span>
            Voice Note
          </div>
          <audio controls src={url} className="w-full max-w-[220px] h-8" />
        </div>
      );
    }
    const videoMatch = content.match(/🎥\s*\[Video [^\]]+\]/);
    if (videoMatch) return <span className="flex items-center gap-1.5 text-xs opacity-80"><span className="material-symbols-outlined text-[16px]">videocam</span>Video shared</span>;
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/mp4";
        if (!MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "";
        }
      }
      
      const recorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });

        const formData = new FormData();
        formData.append("file", blob, `voice-note.${recorder.mimeType.includes("mp4") ? "mp4" : "webm"}`);
        formData.append("userId", user?.id || "student");
        formData.append("type", "audio");

        try {
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok && session) {
            const uploadData = await uploadRes.json();
            const audioUrl = uploadData.url || uploadData.key;

            const res = await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: session.id,
                senderId: user?.id,
                senderRole: "student",
                content: `🎤 Voice note: ${audioUrl}`,
                counsellorId: "counsellor-system",
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.message) {
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === data.message.id);
                  return exists ? prev : [...prev, data.message];
                });
              }
            }
          }
        } catch { /* upload failed */ }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err: any) {
      const msg = err?.name === "NotFoundError"
        ? "No microphone detected. Please connect a microphone and try again."
        : err?.name === "NotAllowedError"
        ? "Microphone access was denied. Please allow mic permissions in your browser settings."
        : "Unable to access microphone. Check your device settings.";
      setMicError(msg);
      setTimeout(() => setMicError(null), 5000);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar variant="student" />
        <div className="flex pt-16">
          <StudentSidebar />
          <div className="flex-1 flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
            {t("chat.loading")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="student" />
      <div className="flex flex-1 pt-16 pb-16 md:pb-0">
        <StudentSidebar />
        <div className="flex-1 flex flex-col w-full mx-auto max-w-3xl" style={{ height: "calc(100svh - 64px - 56px)", maxHeight: "calc(100svh - 64px)" }}>

          {/* Chat Header — improved UI */}
          <div className="px-4 md:px-6 py-3 border-b border-outline-variant bg-surface-container-lowest shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined icon-fill text-primary text-[20px]">support_agent</span>
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${counsellorOnline ? "bg-green-500" : "bg-on-surface-variant/40"}`} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Your Counsellor</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs font-medium ${counsellorOnline ? "text-green-600" : "text-on-surface-variant"}`}>
                      {counsellorOnline ? "● Online" : "○ Offline"}
                    </span>
                    {!counsellorOnline && counsellorLastSeen && (
                      <span className="text-[10px] text-on-surface-variant">
                        · Last seen {new Date(counsellorLastSeen).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/dashboard/crisis" className="text-xs text-error font-medium flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[14px]">emergency</span>
                Crisis Help
              </Link>
            </div>
            {!counsellorOnline && (
              <p className="text-[10px] text-on-surface-variant/70 mt-2 italic">
                Kindly be patient — the counsellor will respond when they are back online.
              </p>
            )}
          </div>

        {!session ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined icon-fill text-primary text-[40px]">support_agent</span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface mb-2">{t("chat.noSession")}</h2>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-5">{t("chat.noSessionDesc")}</p>
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  const res = await fetch("/api/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentId: user.id, counsellorId: "counsellor-system", riskLevel: "Minimal", studentName: user.name || "Student" }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.session) setSession(data.session);
                    else if (data.data) setSession(data.data);
                  }
                }}
                className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Start Session
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 ? (
                <div className="text-center text-on-surface-variant text-sm mt-16">
                  <span className="material-symbols-outlined text-[40px] opacity-30 block mb-2">chat_bubble_outline</span>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-xs text-on-surface-variant/70 mt-3 max-w-xs mx-auto italic">
                    Start the conversation. Your counsellor will respond as soon as they are online.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={`${msg.id}-${idx}`} className={`flex items-end gap-2 ${msg.sender_role === "student" ? "flex-row-reverse" : "flex-row"}`}>
                    {msg.sender_role !== "student" && (
                      <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0 mb-1">
                        <span className="material-symbols-outlined text-primary text-[14px]">support_agent</span>
                      </div>
                    )}
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                      msg.sender_role === "student"
                        ? "bg-surface-container-high text-on-surface rounded-br-sm border border-outline-variant/30"
                        : "bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-bl-sm"
                    }`}>
                      {renderMessageContent(msg.content)}
                      <span className={`text-[10px] mt-1 block ${msg.sender_role === "student" ? "text-on-surface-variant/60 text-right" : "text-on-surface-variant"}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 md:px-6 py-3 border-t border-outline-variant shrink-0 bg-surface-container-lowest/50">
              {micError && (
                <div className="mb-3 p-3 bg-error-container/80 text-on-error-container text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">mic_off</span>
                  {micError}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <button
                  onClick={recording ? stopVoiceRecording : startVoiceRecording}
                  className={`p-3 rounded-xl transition-all shrink-0 ${recording ? "bg-error text-on-error animate-pulse" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                  title={recording ? "Stop recording" : "Record voice note"}
                >
                  <span className="material-symbols-outlined text-[18px]">{recording ? "stop" : "mic"}</span>
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={recording ? t("chat.recording") : "Type a message..."}
                  disabled={recording}
                  className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-on-surface-variant/40 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || recording}
                  className="p-3 bg-primary text-on-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ marginLeft: "1px" }}>send</span>
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
