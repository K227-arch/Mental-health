"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface ChatMsg {
  id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface StudentSession {
  id: string;
  sessionId: string;
  name: string;
  riskLevel: string;
  lastActive: string;
}

export default function CounsellorChat() {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<{ id?: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.user) setUser(d.user);
    });

    // Fetch student sessions
    fetch("/api/counsellor/students")
      .then((r) => r.ok ? r.json() : { students: [] })
      .then((data) => {
        const studentSessions = (data.students || []).map((s: any) => ({
          id: s.id,
          sessionId: s.sessionId,
          name: s.name,
          riskLevel: s.riskLevel,
          lastActive: s.lastActive,
        }));
        setSessions(studentSessions);
        if (studentSessions.length > 0) {
          setSelectedSession(studentSessions[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSession?.sessionId) {
      setMessages([]);
      return;
    }
    fetch(`/api/messages?sessionId=${selectedSession.sessionId}`)
      .then((r) => r.ok ? r.json() : { messages: [] })
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      if (!selectedSession?.sessionId) return;
      fetch(`/api/messages?sessionId=${selectedSession.sessionId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.messages) setMessages(data.messages);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedSession || !user?.id) return;
    setSending(true);

    let sessionId = selectedSession.sessionId;

    // If no session exists, create one
    if (!sessionId) {
      try {
        const sessRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedSession.id,
            counsellorId: user.id,
            riskLevel: selectedSession.riskLevel || "Minimal",
            notes: "Session created from chat.",
            studentName: selectedSession.name,
          }),
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          sessionId = sessData.session?.id;
          // Update the selected session with the new ID
          setSelectedSession({ ...selectedSession, sessionId: sessionId || "" });
          setSessions((prev) =>
            prev.map((s) => s.id === selectedSession.id ? { ...s, sessionId: sessionId || "" } : s)
          );
        }
      } catch {
        // Session creation failed
      }
    }

    if (!sessionId) {
      setSending(false);
      return;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        senderId: user.id,
        senderRole: "counsellor",
        content: input.trim(),
        studentId: selectedSession.id,
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
      setInput("");
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use a supported mimeType
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/mp4";
        if (!MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = ""; // Let browser pick default
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

        // Upload the voice note
        const formData = new FormData();
        formData.append("file", blob, `voice-note.${recorder.mimeType.includes("mp4") ? "mp4" : "webm"}`);
        formData.append("userId", user?.id || "counsellor");
        formData.append("type", "audio");

        try {
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const audioUrl = uploadData.url || uploadData.key;

            // Send as a message with audio URL
            let sessionId = selectedSession?.sessionId;
            if (!sessionId && selectedSession && user?.id) {
              const sessRes = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId: selectedSession.id,
                  counsellorId: user.id,
                  riskLevel: selectedSession.riskLevel || "Minimal",
                  notes: "Session created from voice note.",
                  studentName: selectedSession.name,
                }),
              });
              if (sessRes.ok) {
                const sessData = await sessRes.json();
                sessionId = sessData.session?.id;
              }
            }

            if (sessionId) {
              const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  senderId: user?.id,
                  senderRole: "counsellor",
                  content: `🎤 Voice note: ${audioUrl}`,
                  studentId: selectedSession?.id,
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
          }
        } catch {
          // Upload failed
        }
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

  const riskColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "bg-error text-on-error";
      case "High": return "bg-error-container text-on-error-container";
      case "Moderate": return "bg-secondary-container text-on-secondary-container";
      default: return "bg-surface-container-high text-on-surface";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-surface">
      {/* Sidebar - Student List */}
      <aside className="w-72 border-r border-outline-variant bg-surface-container-low flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="text-sm font-bold text-on-surface">Conversations</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">{sessions.length} active sessions</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] opacity-40 block mb-2">forum</span>
              No active sessions yet.
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={clsx(
                  "w-full text-left px-4 py-3 border-b border-outline-variant/30 hover:bg-surface-container transition-colors",
                  selectedSession?.id === session.id && "bg-primary-container/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface truncate">{session.name}</span>
                  <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-semibold", riskColor(session.riskLevel))}>
                    {session.riskLevel}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {session.lastActive ? new Date(session.lastActive).toLocaleDateString() : "No activity"}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">{selectedSession.name}</h3>
                <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-semibold", riskColor(selectedSession.riskLevel))}>
                  {selectedSession.riskLevel} Risk
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-on-surface-variant text-sm mt-20">
                  <span className="material-symbols-outlined text-[40px] opacity-30 block mb-2">chat</span>
                  No messages yet. Start the conversation.
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={`${msg.id}-${idx}`}
                    className={clsx(
                      "max-w-[70%] px-4 py-3 rounded-2xl text-sm",
                      msg.sender_role === "counsellor"
                        ? "ml-auto bg-primary text-on-primary rounded-br-sm"
                        : "mr-auto bg-surface-container text-on-surface rounded-bl-sm"
                    )}
                  >
                    <p>{msg.content}</p>
                    <span className={clsx(
                      "text-[10px] mt-1 block",
                      msg.sender_role === "counsellor" ? "text-on-primary/60 text-right" : "text-on-surface-variant"
                    )}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
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
                  placeholder={recording ? "Recording..." : "Type a message..."}
                  disabled={recording}
                  className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant/50 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder:text-on-surface-variant/50 disabled:opacity-50"
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] opacity-30 block mb-3">forum</span>
              <p className="text-sm">Select a conversation to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
