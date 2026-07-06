"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import StudentSidebar from "../components/StudentSidebar";
import { phq9Questions, getPHQ9Severity, assessmentModels } from "../lib/data";
import { useTranslation } from "../lib/i18n";
import type { AssessmentModel } from "../lib/data";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  time: string;
}

interface NlpAnalysis {
  nlpSeverity: string;
  confidence: number;
  sentimentBreakdown: {
    negative: number;
    neutral: number;
    positive: number;
  };
  riskIndicators: string[];
  recommendation: string;
}

const greetings = [
  "Hello. I'm here to support you.",
  "This is a safe, confidential space.",
  "We'll walk through a few questions together.",
];

export default function ScreeningPage() {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState<AssessmentModel>(assessmentModels[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content:
        "Hello. I'm here to support you.\n\nPlease select an assessment model above, then click 'Start Assessment' to begin.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [nlpAnalysis, setNlpAnalysis] = useState<NlpAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [freeTextInputs, setFreeTextInputs] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraRecording, setCameraRecording] = useState(false);
  const [cameraRecorder, setCameraRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (cameraPreviewRef.current && cameraStream) {
      cameraPreviewRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const startAssessment = () => {
    setStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setDone(false);
    setTotalScore(0);
    setNlpAnalysis(null);
    const questions = selectedModel.questions;
    addMessage(
      "ai",
      `📋 **${selectedModel.name}**\n\n${selectedModel.description}\n\n---\n\n${selectedModel.intro}\n\n**Question 1 of ${questions.length}:**\n${questions[0].text}`
    );
  };

  const addMessage = (role: "ai" | "user", content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const saveScreeningResult = async (finalAnswers: number[], score: number, severity: string) => {
    try {
      let userId: string | null = null;
      let userName = "Anonymous Student";

      // Try to get user info from /api/auth/me
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        userId = meData?.user?.id;
        userName = meData?.user?.name || userName;
      }

      // Fallback: try to read from cookie
      if (!userId) {
        try {
          const cookies = document.cookie.split(";").map((c) => c.trim());
          const accessCookie = cookies.find((c) => c.startsWith("insforge_access_token="));
          if (accessCookie) {
            const token = accessCookie.split("=")[1];
            const payload = JSON.parse(atob(token.split(".")[1]));
            userId = payload.sub || payload.user_id;
            userName = payload.name || payload.email?.split("@")[0] || userName;
          }
        } catch { /* can't decode */ }
      }

      if (!userId) return;

      await fetch("/api/screening/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          score,
          severity,
          responses: finalAnswers,
          assessmentType: selectedModel.id,
        }),
      });

      // Always create a counsellor session after completing an assessment
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          counsellorId: "system-assigned",
          riskLevel: score >= 20 ? "Critical" : score >= 15 ? "High" : score >= 10 ? "Moderate" : "Minimal",
          notes: `Auto-assigned from ${selectedModel.shortName} screening. Score: ${score} (${severity}).`,
          studentName: userName,
        }),
      }).catch(() => {});

      // Notify counsellor about completed assessment
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "counsellor-system",
          title: `${selectedModel.shortName} Completed`,
          body: `${userName} completed ${selectedModel.shortName}. Score: ${score} (${severity}).`,
          type: score >= selectedModel.maxScore * 0.5 ? "alert" : "info",
          link: "/counsellor",
        }),
      }).catch(() => {});
    } catch (error) {
      console.error("Failed to save screening result:", error);
    }
  };

  const runNlpAnalysis = async (finalAnswers: number[], score: number) => {
    setAnalyzing(true);
    try {
      const answersPayload = finalAnswers.map((answerIndex, i) => ({
        question: phq9Questions[i].text,
        answer: phq9Questions[i].options[answerIndex],
        score: answerIndex,
      }));

      const response = await fetch("/api/screening/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answersPayload,
          phq9Score: score,
          freeText: freeTextInputs.join(". "),
          assessmentType: selectedModel.id,
          maxScore: selectedModel.maxScore,
        }),
      });

      if (response.ok) {
        const analysis: NlpAnalysis = await response.json();
        setNlpAnalysis(analysis);
        addMessage(
          "ai",
          `🧠 **AI Analysis Complete**\n\nOur NLP model has analyzed your responses:\n\n` +
            `**Classification:** ${analysis.nlpSeverity} (${(analysis.confidence * 100).toFixed(1)}% confidence)\n\n` +
            `**Sentiment:** ${(analysis.sentimentBreakdown.negative * 100).toFixed(0)}% distress · ${(analysis.sentimentBreakdown.neutral * 100).toFixed(0)}% neutral · ${(analysis.sentimentBreakdown.positive * 100).toFixed(0)}% positive\n\n` +
            (analysis.riskIndicators.length > 0
              ? `**Risk Indicators:**\n${analysis.riskIndicators.map((r) => `• ${r}`).join("\n")}\n\n`
              : "") +
            `**Recommendation:** ${analysis.recommendation}`
        );
      }
    } catch (error) {
      console.error("NLP analysis failed:", error);
      addMessage(
        "ai",
        "Note: AI-enhanced analysis is temporarily unavailable, but your PHQ-9 score above remains clinically valid."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (done) return;
    const questions = selectedModel.questions;
    const question = questions[currentQuestion];
    addMessage("user", question.options[optionIndex]);

    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        const nextQ = questions[currentQuestion + 1];
        addMessage(
          "ai",
          `Thank you for sharing that.\n\n**Question ${currentQuestion + 2} of ${questions.length}:**\n${nextQ.text}`
        );
        setCurrentQuestion((prev) => prev + 1);
      } else {
        const score = newAnswers.reduce((a, b) => a + b, 0);
        setTotalScore(score);
        setDone(true);
        const severity = selectedModel.getSeverity(score);
        addMessage(
          "ai",
          `Thank you for completing the ${selectedModel.shortName} assessment.\n\nYour score is **${score}** — indicating **${severity.label}**.\n\n${
            score >= selectedModel.maxScore * 0.7
              ? "I want you to know that help is available. Your counselor will be notified securely. Please consider reaching out to crisis support if you need immediate help."
              : score >= selectedModel.maxScore * 0.5
              ? "Your wellbeing matters. I recommend scheduling a session with a counselor to discuss what you're experiencing."
              : "You're doing okay, but keep checking in. Small steps make a big difference."
          }\n\nRunning AI-powered NLP analysis on your responses... 🔍`
        );
        saveScreeningResult(newAnswers, score, severity.label);
        runNlpAnalysis(newAnswers, score);
      }
    }, 500);
  };

  const handleTextSubmit = () => {
    if (!input.trim()) return;
    addMessage("user", input);
    setFreeTextInputs((prev) => [...prev, input]);
    setInput("");
    setTimeout(() => {
      if (currentQuestion < phq9Questions.length && !done) {
        addMessage("ai", "Thank you. Let's continue with the next question.");
      }
    }, 500);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        addMessage("user", "🎤 [Voice message recorded — transcribing...]");

        // Transcribe
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (res.ok) {
            const { text } = await res.json();
            if (text) {
              addMessage("ai", `📝 Transcription: "${text}"`);
              setFreeTextInputs((prev) => [...prev, text]);
            } else {
              addMessage("ai", "Audio received but couldn't be transcribed. Your response has been noted.");
            }
          } else {
            addMessage("ai", "Voice noted. Transcription service is warming up — your audio is saved.");
          }
        } catch {
          addMessage("ai", "Voice noted. Transcription will be available shortly.");
        }

        // Upload to storage
        const uploadForm = new FormData();
        uploadForm.append("file", blob, "recording.webm");
        uploadForm.append("userId", "anonymous");
        uploadForm.append("type", "audio");
        fetch("/api/upload", { method: "POST", body: uploadForm }).catch(() => {});
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      addMessage("ai", "Microphone access denied. Please allow microphone permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    addMessage("user", `🎥 [Video uploaded: ${file.name}]`);

    // Extract frames and audio for AI analysis
    addMessage("ai", "📊 Analyzing your video... extracting frames and audio for AI processing.");

    try {
      const { frames, audioBlob } = await extractVideoData(file);

      // Upload original video to storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", "anonymous");
      formData.append("type", "video");
      fetch("/api/upload", { method: "POST", body: formData }).catch(() => {});

      // Run AI analysis
      const audioBase64 = audioBlob ? await blobToBase64(audioBlob) : null;

      const analysisRes = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          audio: audioBase64,
        }),
      });

      if (analysisRes.ok) {
        const report = await analysisRes.json();
        let analysisMsg = `🧠 **Video Analysis Complete**\n\n`;

        if (report.emotions && report.emotions.length > 0) {
          analysisMsg += `**Facial Expression Analysis:**\n`;
          analysisMsg += report.emotions.slice(0, 4).map((e: any) => `• ${e.label}: ${(e.score * 100).toFixed(0)}%`).join("\n");
          analysisMsg += `\n\n`;
        }

        if (report.transcript) {
          analysisMsg += `**Speech Transcription:**\n"${report.transcript.slice(0, 200)}${report.transcript.length > 200 ? "..." : ""}"\n\n`;
        }

        if (report.sentiment && (report.sentiment.negative > 0 || report.sentiment.positive > 0)) {
          analysisMsg += `**Sentiment:** ${(report.sentiment.negative * 100).toFixed(0)}% negative · ${(report.sentiment.neutral * 100).toFixed(0)}% neutral · ${(report.sentiment.positive * 100).toFixed(0)}% positive\n\n`;
        }

        if (report.riskIndicators && report.riskIndicators.length > 0) {
          analysisMsg += `**Risk Indicators:**\n${report.riskIndicators.map((r: string) => `⚠️ ${r}`).join("\n")}\n\n`;
        }

        analysisMsg += `**Summary:** ${report.summary || "Analysis complete."}`;
        addMessage("ai", analysisMsg);
      } else {
        addMessage("ai", "Video uploaded successfully. Your counsellor will review it. AI analysis is warming up — results may be available shortly.");
      }
    } catch {
      addMessage("ai", "Video uploaded to your counsellor. AI analysis will be processed in the background.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const extractVideoData = (file: File): Promise<{ frames: string[]; audioBlob: Blob | null }> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.src = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const frames: string[] = [];
        const timestamps = [0.2, 0.4, 0.6, 0.8, 1.0].map((t) => t * duration);
        let extracted = 0;

        canvas.width = 224;
        canvas.height = 224;

        const captureFrame = () => {
          if (extracted >= timestamps.length) {
            URL.revokeObjectURL(video.src);
            // Try to extract audio
            try {
              // For audio, we just send the whole file as audio (browser can't easily split)
              resolve({ frames, audioBlob: file });
            } catch {
              resolve({ frames, audioBlob: null });
            }
            return;
          }

          video.currentTime = timestamps[extracted];
        };

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, 224, 224);
            frames.push(canvas.toDataURL("image/jpeg", 0.8));
          }
          extracted++;
          captureFrame();
        };

        captureFrame();
      };

      video.onerror = () => resolve({ frames: [], audioBlob: null });
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      };
      reader.readAsDataURL(blob);
    });
  };

  const openVideoCapture = () => {
    setShowVideoModal(true);
  };

  const startCameraRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream);

      let mimeType = "video/webm";
      if (!MediaRecorder.isTypeSupported("video/webm")) mimeType = "video/mp4";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
        const blob = new Blob(chunks, { type: recorder.mimeType });
        const file = new File([blob], "camera-recording.webm", { type: recorder.mimeType });
        setShowVideoModal(false);
        // Process like a regular video upload
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleVideoUpload(fakeEvent);
      };
      setCameraRecorder(recorder);
      recorder.start();
      setCameraRecording(true);
    } catch {
      addMessage("ai", "Camera access denied. Please allow camera permissions or upload a video file instead.");
      setShowVideoModal(false);
    }
  };

  const stopCameraRecording = () => {
    if (cameraRecorder && cameraRecording) {
      cameraRecorder.stop();
      setCameraRecording(false);
      setCameraRecorder(null);
    }
  };

  const severity = done ? selectedModel.getSeverity(totalScore) : null;
  const progress = ((currentQuestion + (done ? 1 : 0)) / selectedModel.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
      {/* Logo Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo.jpeg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.04]" />
      </div>

      {/* Navbar */}
      <Navbar variant="student" />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <StudentSidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
          <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col px-4 md:px-6 pb-8 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center justify-center py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface text-center mb-1">{t("screening.checkinTitle")}</h1>
          <p className="text-on-surface-variant text-sm text-center max-w-md mb-4">
            {t("screening.checkinSubtitle")}
          </p>

          {/* Model Selector */}
          <div className="relative w-full max-w-md mb-4">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                {selectedModel.shortName} — {selectedModel.name.replace(selectedModel.shortName + " ", "")}
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{modelDropdownOpen ? "expand_less" : "expand_more"}</span>
            </button>
            {modelDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-20 overflow-hidden animate-fade-in">
                {assessmentModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                      setModelDropdownOpen(false);
                      if (started) {
                        setStarted(false);
                        setMessages([{ id: "1", role: "ai", content: "Assessment model changed. Click 'Start Assessment' to begin the new assessment.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
                        setCurrentQuestion(0);
                        setAnswers([]);
                        setDone(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors ${
                      selectedModel.id === model.id ? "bg-primary-container/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-on-surface">{model.shortName}</span>
                        <span className="text-xs text-on-surface-variant ml-2">{model.name.replace(model.shortName + " ", "")}</span>
                      </div>
                      {selectedModel.id === model.id && <span className="material-symbols-outlined text-primary text-[16px]">check</span>}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{model.description.slice(0, 80)}...</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start Button */}
          {!started && (
            <button
              onClick={startAssessment}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 mb-4"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              {t("screening.startAssessment")}
            </button>
          )}

          {/* Progress */}
          {started && (
            <>
              <div className="w-full max-w-md bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between w-full max-w-md mt-1">
                <span className="text-xs text-on-surface-variant">
                  Question {Math.min(currentQuestion + 1, selectedModel.questions.length)} of {selectedModel.questions.length}
                </span>
                <span className="text-xs text-primary font-semibold">{selectedModel.shortName} Assessment</span>
              </div>
            </>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden" style={{ minHeight: 0 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
            <div className="flex justify-center">
              <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                Today, {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {messages.map((msg, idx) => (
              <div
                key={`${msg.id}-${idx}`}
                className={`flex items-end gap-3 max-w-[85%] animate-fade-in ${
                  msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
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
                  {msg.content}
                  <div className={`text-xs mt-1 opacity-60 ${msg.role === "user" ? "text-right" : ""}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {/* Options (current question) */}
            {started && !done && currentQuestion < selectedModel.questions.length && (
              <div className="self-start max-w-[85%] ml-11 animate-fade-in">
                <div className="flex flex-col gap-2">
                  {selectedModel.questions[currentQuestion].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(i)}
                      className="text-left px-4 py-2.5 bg-surface-container-low hover:bg-secondary-container hover:text-on-secondary-container border border-outline-variant/50 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result - no scores shown to student */}
            {done && severity && (
              <div className="self-center my-4 animate-fade-in">
                <div className={`px-6 py-4 rounded-2xl border text-center ${severity.bg} border-outline-variant/30`}>
                  <span className="material-symbols-outlined text-primary text-[40px] mb-2">check_circle</span>
                  <div className={`text-sm font-bold ${severity.color}`}>{severity.label}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Assessment Complete</div>
                </div>

                {/* NLP Analysis Results */}
                {analyzing && (
                  <div className="mt-4 px-6 py-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-primary animate-spin text-[20px]">progress_activity</span>
                      <span className="text-sm text-on-surface-variant">Running NLP analysis...</span>
                    </div>
                  </div>
                )}

                {nlpAnalysis && (
                  <div className="mt-4 px-5 py-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest text-left space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">neurology</span>
                      <span className="text-sm font-bold text-on-surface">AI-Powered Analysis</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container-low rounded-xl p-3">
                        <div className="text-xs text-on-surface-variant">NLP Classification</div>
                        <div className="text-sm font-semibold text-on-surface mt-0.5">{nlpAnalysis.nlpSeverity}</div>
                        <div className="text-xs text-on-surface-variant">{(nlpAnalysis.confidence * 100).toFixed(1)}% confidence</div>
                      </div>
                      <div className="bg-surface-container-low rounded-xl p-3">
                        <div className="text-xs text-on-surface-variant">Sentiment</div>
                        <div className="flex gap-1 mt-1">
                          <div className="flex-1 bg-error/20 rounded h-2" style={{ flex: nlpAnalysis.sentimentBreakdown.negative }} />
                          <div className="flex-1 bg-outline/20 rounded h-2" style={{ flex: nlpAnalysis.sentimentBreakdown.neutral }} />
                          <div className="flex-1 bg-secondary/20 rounded h-2" style={{ flex: nlpAnalysis.sentimentBreakdown.positive }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                          <span>Distress</span>
                          <span>Positive</span>
                        </div>
                      </div>
                    </div>

                    {nlpAnalysis.riskIndicators.length > 0 && (
                      <div className="bg-error-container/50 rounded-xl p-3">
                        <div className="text-xs font-semibold text-error mb-1">Risk Indicators</div>
                        {nlpAnalysis.riskIndicators.map((indicator, i) => (
                          <div key={i} className="text-xs text-on-error-container flex items-start gap-1">
                            <span className="text-error mt-0.5">•</span>
                            {indicator}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-primary-container/30 rounded-xl p-3">
                      <div className="text-xs font-semibold text-primary mb-1">AI Recommendation</div>
                      <div className="text-xs text-on-surface leading-relaxed">{nlpAnalysis.recommendation}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
                  <Link
                    href="/wellness"
                    className="px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity text-center"
                  >
                    Explore Wellness Resources
                  </Link>
                  {totalScore >= 15 && (
                    <Link
                      href="/crisis"
                      className="px-5 py-2.5 bg-error text-on-error text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity text-center"
                    >
                      Get Crisis Support
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col gap-3">
            {/* Emoji picker */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs text-on-surface-variant whitespace-nowrap mr-1">Quick feel:</span>
              {["😔", "😐", "🙂", "😰", "😤", "😢", "😊"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInput((prev) => prev + emoji);
                  }}
                  className="px-2.5 py-1.5 bg-surface-container-low hover:bg-secondary-container rounded-full text-lg transition-colors shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Text input */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  placeholder="Type your response or select an option above..."
                  rows={1}
                  className="w-full bg-surface-container-low border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-xl py-3 px-4 text-on-surface text-sm resize-none min-h-[48px] max-h-[120px]"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
              </div>
              <div className="flex gap-1 mb-0.5">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    recording
                      ? "bg-error text-on-error animate-pulse"
                      : "bg-surface-container-highest text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container"
                  }`}
                  title={recording ? "Stop recording" : "Record voice message"}
                >
                  <span className="material-symbols-outlined text-[20px]">{recording ? "stop" : "mic"}</span>
                </button>
                <button
                  onClick={openVideoCapture}
                  disabled={uploadingVideo}
                  className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Record or upload video"
                >
                  <span className="material-symbols-outlined text-[20px]">{uploadingVideo ? "progress_activity" : "videocam"}</span>
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
                <button
                  onClick={handleTextSubmit}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-surface-tint flex items-center justify-center transition-colors shadow-md ml-1"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ marginLeft: "2px" }}>send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
          </div>
        </main>
      </div>

      {/* Video Capture Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">videocam</span>
              Video Check-in
            </h2>
            <p className="text-xs text-on-surface-variant mb-5">
              Record a video or upload one. AI will analyze your facial expressions, speech, and tone.
            </p>

            {/* Camera Preview */}
            {cameraStream && (
              <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video relative">
                <video ref={cameraPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {cameraRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-error/90 text-on-error px-2 py-1 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 bg-on-error rounded-full animate-pulse" />
                    Recording
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!cameraRecording ? (
                <>
                  <button
                    onClick={startCameraRecording}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                    Record Live Video
                  </button>
                  <button
                    onClick={() => { setShowVideoModal(false); videoInputRef.current?.click(); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-outline-variant bg-surface hover:bg-surface-container rounded-xl text-sm font-medium text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">upload_file</span>
                    Upload Video from Device
                  </button>
                </>
              ) : (
                <button
                  onClick={stopCameraRecording}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[20px]">stop_circle</span>
                  Stop Recording & Analyze
                </button>
              )}

              {!cameraRecording && (
                <button
                  onClick={() => { setShowVideoModal(false); if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); } }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
