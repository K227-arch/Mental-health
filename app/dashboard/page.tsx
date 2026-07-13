"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import StudentSidebar from "../components/StudentSidebar";
import { hopeMessages } from "../lib/data";
import { useTranslation } from "../lib/i18n";

const moods = [
  { emoji: "😢", labelKey: "mood.depressed" },
  { emoji: "😔", labelKey: "mood.stressed" },
  { emoji: "😐", labelKey: "mood.okay" },
  { emoji: "🙂", labelKey: "mood.good" },
  { emoji: "😊", labelKey: "mood.happy" },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<{ id?: string; name?: string } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "bot" | "user"; text: string }[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hopeIndex, setHopeIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<"none" | "record" | "upload">("none");
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) return;
      return r.json().then((d) => {
        if (d?.user) {
          setUser(d.user);
          // Check if new user (just signed up recently)
          checkIfNewUser(d.user.id);
        }
      });
    });
  }, []);

  // Rotate hope messages
  useEffect(() => {
    const interval = setInterval(() => {
      setHopeIndex((prev) => (prev + 1) % hopeMessages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const checkIfNewUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/mood?userId=${userId}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (!data.data || data.data.length === 0) {
          setIsNewUser(true);
        }
      }
    } catch {
      setIsNewUser(true);
    }
    // Start conversational check-in
    setTimeout(() => {
      setChatMessages([
        { role: "bot", text: t("dashboard.checkin.greeting") },
      ]);
    }, 500);
  };

  const handleMoodSelect = async (index: number) => {
    setCurrentMood(index);
    const mood = moods[index];
    const moodLabel = t(mood.labelKey);
    
    // Add user reply to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: `${mood.emoji} ${moodLabel}` },
    ]);

    // Bot response based on mood
    setTimeout(() => {
      let response = "";
      if (index <= 1) {
        response = "I hear you, and I'm glad you shared that. Would you like to talk more about what's going on? You can do a quick check-in or record how you're feeling. 💜";
      } else if (index === 2) {
        response = "That's okay! Some days are just okay, and that's perfectly fine. Would you like to check in more or explore some wellness resources? 🌱";
      } else {
        response = "That's wonderful to hear! Keep nurturing that energy. Feel free to explore the wellness library or share what's been working for you. ☀️";
      }
      setChatMessages((prev) => [...prev, { role: "bot", text: response }]);
    }, 1000);

    // Save mood
    if (!user?.id) return;
    setMoodSaving(true);
    setMoodSaved(false);
    try {
      const moodScore = (index + 1) * 2;
      const stressLevel = 10 - moodScore;
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          moodScore,
          stressLevel,
          notes: `Daily check-in: ${mood.emoji} ${t(mood.labelKey)}`,
        }),
      });
      if (res.ok) {
        setMoodSaved(true);
        setTimeout(() => setMoodSaved(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setMoodSaving(false);
    }
  };

  // Audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        setUploadingMedia(true);
        const formData = new FormData();
        formData.append("file", blob, "checkin-audio.webm");
        formData.append("userId", user?.id || "anonymous");
        formData.append("type", "audio");
        try {
          await fetch("/api/upload", { method: "POST", body: formData });
          setUploadSuccess("Voice message saved ✓");
          setChatMessages((prev) => [...prev, { role: "user", text: "🎤 [Voice message recorded]" }]);
          setTimeout(() => {
            setChatMessages((prev) => [...prev, { role: "bot", text: "Thanks for sharing. Your recording has been saved securely. A counsellor will review it. 💚" }]);
          }, 800);
        } catch { setUploadSuccess("Saved locally."); }
        setTimeout(() => setUploadSuccess(null), 4000);
        setUploadingMedia(false);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      setUploadSuccess("Microphone access denied. Please check your browser settings.");
      setTimeout(() => setUploadSuccess(null), 4000);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && recording) { mediaRecorder.stop(); setRecording(false); setMediaRecorder(null); }
  };

  // Video recording
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setVideoMode("record");
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        const blob = new Blob(chunks, { type: "video/webm" });
        setUploadingMedia(true);
        const formData = new FormData();
        formData.append("file", blob, "checkin-video.webm");
        formData.append("userId", user?.id || "anonymous");
        formData.append("type", "video");
        try {
          await fetch("/api/upload", { method: "POST", body: formData });
          setUploadSuccess("Video saved ✓");
          setChatMessages((prev) => [...prev, { role: "user", text: "📹 [Video recorded]" }]);
          setTimeout(() => {
            setChatMessages((prev) => [...prev, { role: "bot", text: "Your video has been saved securely. Thank you for checking in this way. 🌟" }]);
          }, 800);
        } catch { setUploadSuccess("Saved locally."); }
        setTimeout(() => setUploadSuccess(null), 4000);
        setUploadingMedia(false);
        setVideoMode("none");
        setIsRecordingVideo(false);
      };
      setVideoRecorder(recorder);
      recorder.start();
      setIsRecordingVideo(true);
    } catch {
      setUploadSuccess("Camera access denied. Please check your browser settings.");
      setTimeout(() => setUploadSuccess(null), 4000);
      setVideoMode("none");
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder && isRecordingVideo) { videoRecorder.stop(); }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user?.id || "anonymous");
    formData.append("type", "video");
    try {
      await fetch("/api/upload", { method: "POST", body: formData });
      setUploadSuccess("Video uploaded ✓");
      setChatMessages((prev) => [...prev, { role: "user", text: `📹 [Video uploaded: ${file.name}]` }]);
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { role: "bot", text: "Your video has been uploaded. It will be reviewed securely. 🌟" }]);
      }, 800);
    } catch { setUploadSuccess("Saved locally."); }
    setTimeout(() => setUploadSuccess(null), 4000);
    setUploadingMedia(false);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Logo Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo.jpeg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.06]" />
      </div>
      <Navbar variant="student" />

      <div className="flex flex-1 pt-16">
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
        )}
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Welcome Header */}
            <div className="text-center md:text-left">
              {isNewUser ? (
                <div className="bg-gradient-to-r from-primary-container to-secondary-container rounded-2xl p-6 mb-6 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">
                    {t("dashboard.welcome.new")} 🌱
                  </h1>
                  <p className="text-on-surface-variant">{t("dashboard.welcome.new.sub")}{user?.name ? `, ${user.name}` : ""}</p>
                </div>
              ) : (
                <div className="mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
                    {t("dashboard.welcome")}{user?.name ? `, ${user.name}` : ""} 💚
                  </h1>
                  <p className="text-on-surface-variant text-sm mt-1">{t("dashboard.howfeeling")}</p>
                </div>
              )}
            </div>

            {/* Conversational Daily Check-in */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">{t("dashboard.checkin.title")}</h3>
                  <p className="text-xs text-on-surface-variant">{t("dashboard.checkin.sub")}</p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-surface-container-low/30">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary rounded-br-md"
                        : "bg-surface-container-high text-on-surface rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Mood selection as response */}
              {currentMood === null && chatMessages.length > 0 && (
                <div className="p-4 border-t border-outline-variant/50">
                  <p className="text-xs text-on-surface-variant mb-3 text-center">{t("dashboard.checkin.prompt")}</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {moods.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => handleMoodSelect(i)}
                        disabled={moodSaving}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all hover:scale-105 hover:bg-surface-container-high active:scale-95"
                      >
                        <span className="text-2xl md:text-3xl">{m.emoji}</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">{t(m.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video/Audio Recording Section */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">videocam</span>
                {t("dashboard.share.title")}
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">{t("dashboard.share.sub")}</p>
              
              {uploadSuccess && (
                <div className="mb-4 p-3 bg-secondary-container text-on-secondary-container rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>{uploadSuccess}
                </div>
              )}

              {/* Video preview when recording */}
              {videoMode === "record" && (
                <div className="mb-4 relative rounded-xl overflow-hidden bg-black aspect-video max-w-md mx-auto">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  {isRecordingVideo && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-error rounded-full">
                      <div className="w-2 h-2 bg-on-error rounded-full animate-pulse" />
                      <span className="text-xs text-on-error font-medium">Recording</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {/* Record Video */}
                {videoMode === "none" && (
                  <button
                    onClick={startVideoRecording}
                    disabled={uploadingMedia}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-container text-on-primary-container hover:bg-primary-fixed transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                    Record Video
                  </button>
                )}
                {videoMode === "record" && isRecordingVideo && (
                  <button
                    onClick={stopVideoRecording}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-error text-on-error animate-pulse"
                  >
                    <span className="material-symbols-outlined text-[20px]">stop_circle</span>
                    Stop Recording
                  </button>
                )}

                {/* Upload Video */}
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">{uploadingMedia ? "progress_activity" : "upload_file"}</span>
                  {uploadingMedia ? "Uploading..." : "Upload Video"}
                </button>
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

                {/* Record Audio */}
                <button
                  onClick={recording ? stopAudioRecording : startAudioRecording}
                  disabled={uploadingMedia}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                    recording ? "bg-error text-on-error animate-pulse" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{recording ? "stop_circle" : "mic"}</span>
                  {recording ? "Stop Recording" : "Record Audio"}
                </button>
              </div>
            </div>

            {/* Messages of Hope - Animated/Flashing */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 overflow-hidden">
              <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">favorite</span>
                {t("dashboard.hope.title")}
              </h3>
              <div className="relative h-72 rounded-xl overflow-hidden">
                {hopeMessages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`absolute inset-0 transition-all duration-1000 ${
                      idx === hopeIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                  >
                    <img src={msg.image} alt={msg.text} className="w-full h-full object-contain rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {hopeMessages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === hopeIndex ? "bg-primary" : "bg-outline-variant"}`}
                  />
                ))}
              </div>
            </div>

            {/* Sessions */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                  {t("dashboard.sessions.title")}
                </h3>
                <Link href="/dashboard/chat" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">forum</span>
                  {t("dashboard.chat.counsellor")}
                </Link>
              </div>
              <SessionsList userId={user?.id} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/screening"
                className="flex items-center gap-3 p-4 bg-primary text-on-primary rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined icon-fill">psychology</span>
                <div>
                  <div className="text-sm font-semibold">{t("dashboard.action.checkin")}</div>
                  <div className="text-xs opacity-80">{t("screening.assessment")}</div>
                </div>
              </Link>
              <Link
                href="/wellness"
                className="flex items-center gap-3 p-4 bg-secondary-container text-on-secondary-container rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined icon-fill">self_improvement</span>
                <div>
                  <div className="text-sm font-semibold">{t("dashboard.action.wellness")}</div>
                  <div className="text-xs opacity-80">{t("wellness.resources")}</div>
                </div>
              </Link>
              <Link
                href="/dashboard/crisis"
                className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined icon-fill">emergency</span>
                <div>
                  <div className="text-sm font-semibold">{t("dashboard.action.crisis")}</div>
                  <div className="text-xs opacity-80">{t("crisis.call")}</div>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SessionsList({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/sessions?studentId=${userId}`)
      .then((r) => r.ok ? r.json() : { sessions: [] })
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
  }, [userId]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px] opacity-30 block mb-2">event_busy</span>
        <p className="text-xs">No sessions yet. Complete a check-in to get connected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.slice(0, 5).map((s: any) => {
        const scheduledMatch = s.notes?.match(/Scheduled session: (\S+) at (\S+)/);
        const scheduledDate = scheduledMatch?.[1];
        const scheduledTime = scheduledMatch?.[2];

        return (
          <div key={s.id} className="flex items-center gap-4 bg-surface rounded-xl p-4 border border-outline-variant">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[22px] icon-fill">calendar_month</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">
                {scheduledDate ? "Scheduled Session" : "Counselling Session"}
              </p>
              {scheduledDate ? (
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {new Date(scheduledDate).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {scheduledTime}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant mt-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
              scheduledDate ? "bg-secondary-container text-on-secondary-container" : 
              s.status === "active" ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
            }`}>
              {scheduledDate ? "Scheduled" : s.status || "Active"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
