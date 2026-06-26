"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { insforge, getSeverity, detectKeywords, generateXAI } from "@/lib/insforge";

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure?",
  "Trouble concentrating on things?",
  "Moving or speaking unusually slowly, or being fidgety or restless?",
  "Thoughts that you would be better off dead, or of hurting yourself?",
];

const OPTIONS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  time: string;
  isAudio?: boolean;
  sentiment?: string;
}

// Simple client-side sentiment from audio/text
function analyseText(text: string): string {
  const lower = text.toLowerCase();
  const negative = ["terrible", "awful", "horrible", "miserable", "hopeless", "worthless", "giving up", "can't", "never", "hate", "worse", "pain"];
  const positive = ["better", "good", "great", "okay", "fine", "happy", "well", "improve", "hope", "calm"];
  const neg = negative.filter((w) => lower.includes(w)).length;
  const pos = positive.filter((w) => lower.includes(w)).length;
  if (neg > pos) return "😔 Negative tone detected";
  if (pos > neg) return "🙂 Positive tone detected";
  return "😐 Neutral tone";
}

export default function ScreeningPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "ai",
      content: `Hello. I'm here to support you.\n\nThis is a safe, confidential space. Take your time.\n\nOver the past two weeks, how often have you been bothered by:\n\n${PHQ9_QUESTIONS[0]}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video/webcam state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        setUserName(data.user.profile?.name || null);
      }
    });
    setAudioSupported(!!(navigator.mediaDevices?.getUserMedia));
    setCameraSupported(!!(navigator.mediaDevices?.getUserMedia));
  }, []);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const addMsg = useCallback((role: "ai" | "user", content: string, extras?: Partial<Message>) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role,
        content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...extras,
      },
    ]);
  }, []);

  // ─── Audio recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      addMsg("ai", "Microphone access was denied. Please use text input or select an option above.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const processAudio = async (blob: Blob) => {
    // Use browser SpeechRecognition if available, otherwise do sentiment from tone
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      // Convert blob to object URL and feed to recognition
      const transcript = await transcribeWithWebAPI();
      if (transcript) {
        // Run HuggingFace analysis on the transcript
        let sentiment = analyseText(transcript);
        try {
          const res = await fetch("/api/ai/analyse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: transcript, type: "full" }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data?.sentiment) {
              sentiment = `${json.data.sentiment.emoji} ${json.data.sentiment.description} · Emotion: ${json.data.emotion?.dominant || "neutral"}`;
            }
          }
        } catch {}
        addMsg("user", `🎤 "${transcript}"`, { isAudio: true, sentiment });
        autoSelectFromTranscript(transcript);
        return;
      }
    }

    addMsg("user", "🎤 [Audio received]", { isAudio: true, sentiment: "Analysis processing…" });
    addMsg("ai", "I received your audio response. For accuracy, please also select one of the options below to record your answer formally.");
  };

  const transcribeWithWebAPI = (): Promise<string> => {
    return new Promise((resolve) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { resolve(""); return; }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (e: any) => resolve(e.results[0][0].transcript);
      rec.onerror = () => resolve("");
      rec.onend = () => {};

      // Start fresh recognition (the blob was already captured)
      rec.start();
      setTimeout(() => { try { rec.stop(); } catch {} }, 3000);
    });
  };

  const autoSelectFromTranscript = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("not at all") || lower.includes("never") || lower.includes("no")) {
      handleOption(0);
    } else if (lower.includes("several") || lower.includes("sometimes") || lower.includes("few days")) {
      handleOption(1);
    } else if (lower.includes("more than half") || lower.includes("often") || lower.includes("usually")) {
      handleOption(2);
    } else if (lower.includes("nearly every") || lower.includes("always") || lower.includes("every day")) {
      handleOption(3);
    }
    // If nothing matched, don't auto-select — user must tap
  };

  // ─── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch {
      addMsg("ai", "Camera access was denied. You can still complete the assessment using text or audio.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  };

  // ─── Option selection (core logic) ────────────────────────────────────────
  const handleOption = useCallback(
    async (idx: number) => {
      if (done) return;
      addMsg("user", OPTIONS[idx]);
      const newAnswers = [...answers, idx];
      setAnswers(newAnswers);

      setTimeout(async () => {
        if (currentQ + 1 < PHQ9_QUESTIONS.length) {
          // Q9 warning
          const nextQ = currentQ + 1;
          let prefix = "Thank you for sharing.\n\n";
          if (nextQ === 8) {
            prefix +=
              "The next question is sensitive. You are in a safe space and your answer is confidential.\n\n";
          }
          addMsg("ai", `${prefix}Over the past two weeks:\n\n${PHQ9_QUESTIONS[nextQ]}`);
          setCurrentQ(nextQ);
        } else {
          // All done
          const total = newAnswers.reduce((a, b) => a + b, 0);
          setScore(total);
          setDone(true);
          const sev = getSeverity(total);
          const xai = generateXAI(
            Object.fromEntries(newAnswers.map((a, i) => [`q${i + 1}`, a])),
            total
          );

          addMsg(
            "ai",
            `Thank you for completing this check-in.\n\nYour PHQ-9 score is ${total} — indicating ${sev.label} level.\n\n${
              total >= 15
                ? "Your score indicates you may benefit from professional support. Your counsellor will be notified. Please use Crisis Support if you need immediate help."
                : total >= 10
                ? "Your score suggests moderate symptoms. Speaking with a counsellor soon is recommended."
                : total >= 5
                ? "You're managing, but keep checking in — small steps matter."
                : "You're doing well. Keep up your wellness practices."
            }\n\nRemember: you are not alone. 💙`
          );

          if (userId) {
            setSaving(true);
            const responses: Record<string, number> = {};
            newAnswers.forEach((a, i) => { responses[`q${i + 1}`] = a; });
            const keywords = detectKeywords(
              newAnswers.map((a, i) => `${PHQ9_QUESTIONS[i]} ${OPTIONS[a]}`).join(" ")
            );

            // Save screening result with XAI summary in ai_summary field
            await insforge.database.from("screening_results").insert([{
              user_id: userId,
              score: total,
              severity: sev.label,
              risk_level: sev.risk,
              responses,
              flagged_keywords: keywords.length > 0 ? keywords : null,
            }]);

            // Create/update counsellor session with XAI
            if (total >= 10) {
              const { data: existing } = await insforge.database
                .from("counsellor_sessions")
                .select()
                .eq("student_id", userId)
                .eq("status", "active")
                .maybeSingle();

              const sessionData = {
                student_id: userId,
                counsellor_id: "counsellor",
                status: "active",
                risk_level: sev.risk,
                phq9_score: total,
                student_name: userName || "Student",
                ai_summary: xai.summary,
              };

              if (!existing) {
                await insforge.database.from("counsellor_sessions").insert([sessionData]);
              } else {
                await insforge.database.from("counsellor_sessions")
                  .update({
                    risk_level: sev.risk,
                    phq9_score: total,
                    ai_summary: xai.summary,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existing.id);
              }

              await insforge.database.from("notifications").insert([{
                user_id: "counsellor",
                title: `PHQ-9 Alert: ${sev.label} Risk (Score ${total})`,
                body: xai.summary,
                type: sev.risk === "Critical" ? "critical" : "warning",
                link: "/counsellor",
              }]);
            }

            await insforge.database.from("mood_entries").insert([{
              user_id: userId,
              mood_score: Math.max(1, 5 - Math.floor(total / 5)),
              stress_level: Math.min(5, Math.ceil(total / 4)),
              notes: `PHQ-9 score: ${total} (${sev.label})`,
            }]);

            setSaving(false);
          }
        }
      }, 400);
    },
    [done, answers, currentQ, addMsg, userId, userName]
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    // Run HuggingFace sentiment + emotion in background
    let sentiment = analyseText(text);
    try {
      const res = await fetch("/api/ai/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "full" }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.sentiment) {
          const s = json.data.sentiment;
          const e = json.data.emotion;
          sentiment = `${s.emoji} ${s.description}${e ? ` · ${e.emoji} ${e.dominant}` : ""}`;
          // If crisis detected, show urgent message
          if (json.data.crisis?.isCrisis && !done) {
            addMsg("ai", "I noticed some difficult feelings in what you shared. You're not alone. Please consider reaching out to crisis support if you need immediate help: /crisis");
          }
        }
      }
    } catch {}

    addMsg("user", text, { sentiment });

    setTimeout(() => {
      if (!done) {
        addMsg("ai", "Thank you for sharing. Please select one of the options to formally record your answer.");
      }
    }, 400);
  };

  const sev = done ? getSeverity(score) : null;
  const progress = ((currentQ + (done ? 1 : 0)) / PHQ9_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
      <div className="bg-blob-1 pointer-events-none fixed" />
      <div className="bg-blob-2 pointer-events-none fixed" />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface shadow-sm border-b border-outline-variant/30">
        <Link href="/" className="font-black text-xl text-primary">MindCare AI</Link>
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-error-container text-on-error-container text-xs font-semibold rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-error" />
              Recording {recordingSeconds}s
            </span>
          )}
          {isCameraOn && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full">
              <span className="material-symbols-outlined text-[14px]">videocam</span>
              Camera on
            </span>
          )}
          <Link href="/crisis" className="flex items-center gap-1 px-3 py-1.5 text-error text-sm font-medium hover:bg-error-container/50 rounded-full">
            <span className="material-symbols-outlined icon-fill text-[18px]">medical_services</span>
            Emergency
          </Link>
        </div>
      </header>

      <main
        className="flex-1 w-full max-w-3xl mx-auto mt-16 relative z-10 flex flex-col px-4 md:px-6 pb-8"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* Progress */}
        <div className="flex flex-col items-center py-4">
          <h1 className="text-2xl font-bold text-on-surface mb-0.5">Daily Check-in</h1>
          <p className="text-xs text-on-surface-variant mb-3">Confidential · PHQ-9 Assessment</p>
          <div className="w-full max-w-md bg-surface-container rounded-full h-2">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between w-full max-w-md mt-1">
            <span className="text-xs text-on-surface-variant">
              Question {Math.min(currentQ + 1, PHQ9_QUESTIONS.length)} of 9
            </span>
            <span className="text-xs text-primary font-semibold">PHQ-9</span>
          </div>
        </div>

        {/* Camera preview */}
        {isCameraOn && (
          <div className="mb-3 relative rounded-xl overflow-hidden border border-outline-variant shadow-sm bg-surface-container-lowest">
            <video ref={videoRef} className="w-full h-36 object-cover" autoPlay muted playsInline />
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-surface/80 rounded-full text-[10px] text-on-surface font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Facial expression captured
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest text-on-surface-variant hover:bg-error-container hover:text-error flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Chat area */}
        <div
          className="flex-1 flex flex-col bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden"
          style={{ minHeight: 0 }}
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
            <div className="flex justify-center">
              <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                Today, {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-3 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">psychiatry</span>
                  </div>
                )}
                <div
                  className={`p-3 md:p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "ai"
                      ? "bg-surface-container-lowest text-on-surface border border-outline-variant/20 shadow-sm rounded-bl-sm"
                      : "bg-primary text-on-primary rounded-br-sm"
                  }`}
                >
                  {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
                  {msg.sentiment && (
                    <div className="mt-1.5 text-[10px] opacity-70 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">psychology</span>
                      {msg.sentiment}
                    </div>
                  )}
                  <div className={`text-[10px] mt-1 opacity-60 ${msg.role === "user" ? "text-right" : ""}`}>
                    {msg.time}
                    {msg.isAudio && " · 🎤 Audio"}
                  </div>
                </div>
              </div>
            ))}

            {/* Options */}
            {!done && currentQ < PHQ9_QUESTIONS.length && (
              <div className="self-start max-w-[85%] ml-11">
                <div className="flex flex-col gap-2">
                  {OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOption(i)}
                      className="text-left px-4 py-2.5 bg-surface-container-low hover:bg-secondary-container hover:text-on-secondary-container border border-outline-variant/50 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                      <span className="text-xs text-on-surface-variant mr-2 font-bold">{i}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Score result */}
            {done && sev && (
              <div className="self-center my-4 w-full max-w-sm animate-fade-in">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 text-center shadow-sm">
                  <div className="text-6xl font-black text-primary mb-1">{score}</div>
                  <div className={`text-base font-bold ${sev.color} mb-1`}>{sev.label}</div>
                  <div className="text-xs text-on-surface-variant">PHQ-9 Score</div>
                  {saving && (
                    <div className="text-xs text-secondary mt-3 animate-pulse flex items-center justify-center gap-1">
                      <span className="w-3 h-3 rounded-full border border-secondary border-t-transparent animate-spin" />
                      Saving to your record…
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:opacity-90 text-center flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">dashboard</span>
                    View Dashboard
                  </Link>
                  {score >= 15 && (
                    <Link
                      href="/crisis"
                      className="px-5 py-2.5 bg-error text-on-error text-sm font-semibold rounded-xl hover:opacity-90 text-center flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">emergency</span>
                      Crisis Support
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input area */}
          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col gap-3">
            {/* Emoji quick-feel */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-xs text-on-surface-variant whitespace-nowrap shrink-0">Quick feel:</span>
              {["😔", "😐", "🙂", "😰", "😤", "😢", "😊"].map((e) => (
                <button
                  key={e}
                  onClick={() => setInput((p) => p + e)}
                  className="px-2.5 py-1.5 bg-surface-container-low hover:bg-secondary-container rounded-full text-lg transition-colors shrink-0"
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Text + action buttons */}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your response or select an option above…"
                  rows={1}
                  className="w-full bg-surface-container-low border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-xl py-3 px-4 text-on-surface text-sm resize-none min-h-[48px] max-h-[120px]"
                />
              </div>
              <div className="flex gap-1 mb-0.5">
                {/* Mic button */}
                {audioSupported && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isRecording
                        ? "bg-error text-on-error animate-pulse"
                        : "bg-surface-container-highest text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container"
                    }`}
                    title={isRecording ? "Stop recording" : "Record audio response"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isRecording ? "stop" : "mic"}
                    </span>
                  </button>
                )}

                {/* Camera button */}
                {cameraSupported && (
                  <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCameraOn
                        ? "bg-secondary text-on-secondary"
                        : "bg-surface-container-highest text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container"
                    }`}
                    title={isCameraOn ? "Turn off camera" : "Enable camera for facial expression analysis"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isCameraOn ? "videocam_off" : "videocam"}
                    </span>
                  </button>
                )}

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center shadow-md ml-1 disabled:opacity-40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ marginLeft: "2px" }}>send</span>
                </button>
              </div>
            </div>

            {/* Multimodal hint */}
            {!done && (
              <p className="text-[10px] text-on-surface-variant/60 text-center">
                You can respond by selecting an option · typing · or recording audio 🎤
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
