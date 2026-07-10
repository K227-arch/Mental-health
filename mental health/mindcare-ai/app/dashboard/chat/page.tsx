"use client";

import { useState, useEffect, useRef } from "react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-1 pt-16">
        <StudentSidebar />
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant">
          <h1 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">forum</span>
            {t("chat.title")}
          </h1>
          <p className="text-xs text-on-surface-variant">{t("chat.subtitle")}</p>
        </div>

        {!session ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">forum</span>
              <h2 className="text-lg font-semibold text-on-surface mb-2">{t("chat.noSession")}</h2>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                {t("chat.noSessionDesc")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 ? (
                <div className="text-center text-on-surface-variant text-sm mt-16">
                  <span className="material-symbols-outlined text-[40px] opacity-30 block mb-2">chat</span>
                  <p>{t("chat.noMessages")}</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={`${msg.id}-${idx}`}
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      msg.sender_role === "student"
                        ? "ml-auto bg-primary text-on-primary rounded-br-sm"
                        : "mr-auto bg-surface-container text-on-surface rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${
                      msg.sender_role === "student" ? "text-on-primary/60 text-right" : "text-on-surface-variant"
                    }`}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-outline-variant">
              {micError && (
                <div className="mb-3 p-3 bg-error-container/80 text-on-error-container text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px]">mic_off</span>
                  {micError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={recording ? stopVoiceRecording : startVoiceRecording}
                  className={`px-3 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-1 ${
                    recording
                      ? "bg-error text-on-error animate-pulse"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                  title={recording ? "Stop recording" : "Record voice note"}
                >
                  <span className="material-symbols-outlined text-[18px]">{recording ? "stop" : "mic"}</span>
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={recording ? t("chat.recording") : t("chat.typeMessage")}
                  disabled={recording}
                  className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder:text-on-surface-variant/40 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || recording}
                  className="px-4 py-3 bg-primary text-on-primary rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
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
