"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { useTranslation } from "../../lib/i18n";

interface ChatMsg {
  id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface StudentSession {
  id: string;          // student user id
  sessionId: string;   // counsellor_sessions row id (may be empty)
  name: string;
  riskLevel: string;
  lastActive: string;
  hasUnread?: boolean;
}

export default function CounsellorChat() {
  const { t } = useTranslation();
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
  const [studentOnline, setStudentOnline] = useState(false);
  const [studentLastSeen, setStudentLastSeen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check selected student online status
  useEffect(() => {
    if (!selectedSession?.id) return;
    const check = () => {
      fetch(`/api/presence?userId=${selectedSession.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) { setStudentOnline(d.online); setStudentLastSeen(d.lastSeen); }
        });
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [selectedSession?.id]);

  const loadStudents = async () => {
    const [meRes, studentsRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/counsellor/students"),
    ]);

    const meData = meRes.ok ? await meRes.json() : null;
    if (meData?.user) setUser(meData.user);

    const data = studentsRes.ok ? await studentsRes.json() : { students: [] };
    const students = data.students || [];

    // For each student, also check if there are any messages in their session
    // to show unread badge
    const studentList: StudentSession[] = students.map((s: any) => ({
      id: s.id,
      sessionId: s.sessionId || "",
      name: s.name || "Student",
      riskLevel: s.riskLevel || "Minimal",
      lastActive: s.lastActive || "",
      hasUnread: false,
    }));

    setSessions(studentList);

    // Auto-select first student with a session, otherwise first student
    if (studentList.length > 0) {
      const withSession = studentList.find(s => s.sessionId);
      setSelectedSession(withSession || studentList[0]);
    }

    setLoading(false);
    return studentList;
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Fetch messages for selected student — handles both with and without existing session
  const fetchMessages = async (student: StudentSession) => {
    if (!student.sessionId) {
      // No session yet — student hasn't started a chat or needs one created
      // Check if they have a session as student_id in counsellor_sessions
      const sessRes = await fetch(`/api/sessions?studentId=${student.id}`);
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const existingSession = sessData.sessions?.[0];
        if (existingSession) {
          // Found their session — update our local state
          setSelectedSession(prev => prev ? { ...prev, sessionId: existingSession.id } : prev);
          setSessions(prev => prev.map(s => s.id === student.id ? { ...s, sessionId: existingSession.id } : s));
          // Now fetch messages
          const msgRes = await fetch(`/api/messages?sessionId=${existingSession.id}`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData.messages || []);
          }
          return;
        }
      }
      setMessages([]);
      return;
    }

    const msgRes = await fetch(`/api/messages?sessionId=${student.sessionId}`);
    if (msgRes.ok) {
      const msgData = await msgRes.json();
      setMessages(msgData.messages || []);
    }
  };

  useEffect(() => {
    if (!selectedSession) return;
    fetchMessages(selectedSession);

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      if (!selectedSession) return;
      // Re-fetch using current session state
      const sessionId = selectedSession.sessionId;
      if (!sessionId) return;
      fetch(`/api/messages?sessionId=${sessionId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.messages) setMessages(data.messages); })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSession?.id, selectedSession?.sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ensure or create a session when counsellor tries to send a message
  const ensureSession = async (student: StudentSession): Promise<string | null> => {
    // Already have a session
    if (student.sessionId) return student.sessionId;

    // Check if student already has one from their side
    const sessRes = await fetch(`/api/sessions?studentId=${student.id}`);
    if (sessRes.ok) {
      const sessData = await sessRes.json();
      const existing = sessData.sessions?.[0];
      if (existing?.id) {
        const newSessionId = existing.id;
        setSelectedSession(prev => prev ? { ...prev, sessionId: newSessionId } : prev);
        setSessions(prev => prev.map(s => s.id === student.id ? { ...s, sessionId: newSessionId } : s));
        return newSessionId;
      }
    }

    // Create a new session
    const createRes = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        counsellorId: user?.id || "counsellor",
        riskLevel: student.riskLevel || "Minimal",
        notes: "Session created from counsellor chat.",
        studentName: student.name,
      }),
    });
    if (createRes.ok) {
      const createData = await createRes.json();
      const newSessionId = createData.session?.id;
      if (newSessionId) {
        setSelectedSession(prev => prev ? { ...prev, sessionId: newSessionId } : prev);
        setSessions(prev => prev.map(s => s.id === student.id ? { ...s, sessionId: newSessionId } : s));
        return newSessionId;
      }
    }
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedSession || !user?.id) return;
    setSending(true);

    const sessionId = await ensureSession(selectedSession);
    if (!sessionId) { setSending(false); return; }

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
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          return exists ? prev : [...prev, data.message];
        });
      }
      setInput("");
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderMessageContent = (content: string) => {
    const voiceMatch = content.match(/🎤 Voice note: (https?:\/\/\S+)/);
    if (voiceMatch) {
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-medium opacity-80">
            <span className="material-symbols-outlined text-[16px]">mic</span>
            Voice Note
          </div>
          <audio controls src={voiceMatch[1]} className="w-full max-w-[220px] h-8" />
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
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (chunks.length === 0 || !selectedSession) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, `voice-note.${recorder.mimeType?.includes("mp4") ? "mp4" : "webm"}`);
        formData.append("userId", user?.id || "counsellor");
        formData.append("type", "audio");

        try {
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const audioUrl = uploadData.url || uploadData.key;
            const sessionId = await ensureSession(selectedSession);
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
                  setMessages(prev => {
                    const exists = prev.some(m => m.id === data.message.id);
                    return exists ? prev : [...prev, data.message];
                  });
                }
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
        ? "No microphone detected."
        : err?.name === "NotAllowedError"
        ? "Microphone access denied. Check browser settings."
        : "Unable to access microphone.";
      setMicError(msg);
      setTimeout(() => setMicError(null), 5000);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && recording) { mediaRecorder.stop(); setRecording(false); setMediaRecorder(null); }
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
        {t("counsellor.chat.loading")}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-64px)] bg-surface">
      {/* Sidebar — all students, even without sessions */}
      <aside className="hidden sm:flex w-72 border-r border-outline-variant bg-surface-container-low flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="text-sm font-bold text-on-surface">{t("counsellor.chat.conversations")}</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">{sessions.length} student{sessions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] opacity-40 block mb-2">forum</span>
              No students registered yet.
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-on-primary-container">
                        {(session.name || "?").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface truncate">{session.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!session.sessionId && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">New</span>
                    )}
                    <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-semibold", riskColor(session.riskLevel))}>
                      {session.riskLevel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 pl-9">
                  {session.lastActive ? new Date(session.lastActive).toLocaleDateString() : "Just registered"}
                </p>
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-on-surface">{selectedSession.name}</h3>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${studentOnline ? "bg-green-500 animate-pulse" : "bg-on-surface-variant/30"}`} />
                  <span className={`text-[10px] font-medium ${studentOnline ? "text-green-600" : "text-on-surface-variant"}`}>
                    {studentOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-semibold", riskColor(selectedSession.riskLevel))}>
                    {selectedSession.riskLevel} Risk
                  </span>
                  {!studentOnline && studentLastSeen && (
                    <span className="text-[10px] text-on-surface-variant">
                      Last seen: {new Date(studentLastSeen).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic hidden sm:block">Kindly be patient if you do not receive an immediate response.</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-on-surface-variant text-sm mt-20">
                  <span className="material-symbols-outlined text-[40px] opacity-30 block mb-2">chat_bubble_outline</span>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-xs mt-1 opacity-70">Send a message to start the conversation with {selectedSession.name}.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={`${msg.id}-${idx}`}
                    className={clsx(
                      "max-w-[70%] px-4 py-3 rounded-2xl text-sm",
                      msg.sender_role === "counsellor"
                        ? "ml-auto bg-surface-container-high text-on-surface rounded-br-sm border border-outline-variant/30"
                        : "mr-auto bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-bl-sm"
                    )}
                  >
                    {renderMessageContent(msg.content)}
                    <span className={clsx(
                      "text-[10px] mt-1 block text-on-surface-variant",
                      msg.sender_role === "counsellor" ? "text-right" : ""
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
                <div className="mb-3 p-3 bg-error-container/80 text-on-error-container text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">mic_off</span>
                  {micError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={recording ? stopVoiceRecording : startVoiceRecording}
                  className={`px-3 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-1 ${
                    recording ? "bg-error text-on-error animate-pulse" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
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
                  placeholder={recording ? t("counsellor.chat.recording") : `Message ${selectedSession.name}...`}
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
              <p className="text-sm">{t("counsellor.chat.selectConversation")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
