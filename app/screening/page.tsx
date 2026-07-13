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
  const [started, setStarted] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hello, welcome. I\u2019m here to support you \u2014 this is a safe, confidential space.\n\nHow have you been feeling emotionally over the last two weeks?",
      time: "",
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
  // Phase: "rapport" = initial greeting, "phq9" = answering questions, "functional" = Q10 impairment, "chat" = free AI conversation
  const [phase, setPhase] = useState<"rapport" | "phq9" | "functional" | "chat">("rapport");
  const [conversationStage, setConversationStage] = useState<"rapport" | "exploration" | "stressors" | "risk" | "intervention">("rapport");
  const [functionalImpairment, setFunctionalImpairment] = useState<number | null>(null);
  const [nlpContextRef, setNlpContextRef] = useState<object | null>(null);
  const [checkingLastScreening, setCheckingLastScreening] = useState(true);
  const [daysUntilNextScreening, setDaysUntilNextScreening] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; date: string; messages: Message[] }[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist in-progress assessment state so student can resume after navigating away
  useEffect(() => {
    // Don't save if still checking or in chat phase (chat is saved separately)
    if (checkingLastScreening || phase === "chat") return;
    try {
      const state = { phase, currentQuestion, answers, messages, conversationStage, done, totalScore, freeTextInputs };
      sessionStorage.setItem("selfcare_assessment_progress", JSON.stringify(state));
    } catch {}
  }, [phase, currentQuestion, answers, messages, conversationStage, done, totalScore, freeTextInputs, checkingLastScreening]);

  // Restore in-progress assessment on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("selfcare_assessment_progress");
      if (!saved) return;
      const state = JSON.parse(saved);
      // Only restore if assessment was in progress (not chat, not completed)
      if (state.phase && state.phase !== "chat" && !state.done && state.messages?.length > 1) {
        setPhase(state.phase);
        setCurrentQuestion(state.currentQuestion || 0);
        setAnswers(state.answers || []);
        setMessages(state.messages);
        setConversationStage(state.conversationStage || "rapport");
        setFreeTextInputs(state.freeTextInputs || []);
        setCheckingLastScreening(false);
      }
    } catch {}
  }, []);

  // Set initial message time on client only (avoids hydration mismatch)
  useEffect(() => {
    setMessages((prev) => prev.map((m) => m.id === "1" && !m.time ? { ...m, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : m));
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("Selfcare_chat_history");
      if (saved) setChatHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Save current conversation to history when it has enough messages
  const saveToHistory = () => {
    if (messages.length < 3 || phase !== "chat") return;
    const firstUserMsg = messages.find((m) => m.role === "user")?.content || "New conversation";
    const title = firstUserMsg.slice(0, 40) + (firstUserMsg.length > 40 ? "..." : "");
    const id = `chat-${Date.now()}`;
    const newEntry = { id, title, date: new Date().toISOString(), messages: messages.slice(-30) };

    setChatHistory((prev) => {
      const updated = [newEntry, ...prev.filter((h) => h.id !== id)].slice(0, 20);
      localStorage.setItem("Selfcare_chat_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Auto-save to history periodically
  useEffect(() => {
    if (phase !== "chat" || messages.length < 4) return;
    const timeout = setTimeout(saveToHistory, 5000);
    return () => clearTimeout(timeout);
  }, [messages, phase]);

  const loadHistorySession = (session: { id: string; title: string; date: string; messages: Message[] }) => {
    setMessages(session.messages);
    setPhase("chat");
    setConversationStage("exploration");
    setHistoryOpen(false);
  };

  const startNewChat = () => {
    // Save current conversation first
    saveToHistory();
    setMessages([{
      id: `new-${Date.now()}`,
      role: "ai",
      content: "Starting a new conversation. How are you feeling today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setPhase("chat");
    setConversationStage("rapport");
    setHistoryOpen(false);
  };

  useEffect(() => {
    if (cameraPreviewRef.current && cameraStream) {
      cameraPreviewRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Check if student completed a screening in the last 2 weeks
  // If yes → go directly to chat phase; if no → show rapport + PHQ-9
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { setCheckingLastScreening(false); return; }
        const meData = await meRes.json();
        const userId = meData?.user?.id;
        if (!userId) { setCheckingLastScreening(false); return; }

        // Load saved chat messages from localStorage
        const savedMessages = localStorage.getItem(`Selfcare_chat_messages_${userId}`);
        const savedPhase = localStorage.getItem(`Selfcare_chat_phase_${userId}`);
        const savedStage = localStorage.getItem(`Selfcare_chat_stage_${userId}`);

        // Check localStorage for last screening timestamp (fast check)
        const lastScreeningStr = localStorage.getItem(`Selfcare_last_screening_${userId}`);
        if (lastScreeningStr) {
          const lastDate = new Date(lastScreeningStr);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff < 14) {
            // Less than 2 weeks — go straight to chat
            setDaysUntilNextScreening(14 - daysDiff);
            setPhase("chat");
            setConversationStage((savedStage as any) || "rapport");

            // Restore previous chat messages if available
            if (savedMessages) {
              try {
                const parsed = JSON.parse(savedMessages) as Message[];
                if (parsed.length > 0) {
                  setMessages(parsed);
                  setCheckingLastScreening(false);
                  return;
                }
              } catch {}
            }

            // No saved messages — show welcome back message
            setMessages([{
              id: "1",
              role: "ai",
              content: `Welcome back! Your last check-in was ${daysDiff === 0 ? "today" : daysDiff === 1 ? "yesterday" : `${daysDiff} days ago`}. Your next assessment will be available in ${14 - daysDiff} days.\n\nIn the meantime, I'm here to chat. How are you feeling today?`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }]);
            setCheckingLastScreening(false);
            return;
          }
        }
      } catch {
        // If anything fails, default to normal flow
      }
      setCheckingLastScreening(false);
    })();
  }, []);

  // Persist chat messages to localStorage whenever they change (only in chat phase)
  useEffect(() => {
    if (phase !== "chat") return;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) return;
        const meData = await meRes.json();
        const userId = meData?.user?.id;
        if (!userId) return;
        // Save only last 50 messages to avoid localStorage bloat
        const toSave = messages.slice(-50);
        localStorage.setItem(`Selfcare_chat_messages_${userId}`, JSON.stringify(toSave));
        localStorage.setItem(`Selfcare_chat_phase_${userId}`, phase);
        localStorage.setItem(`Selfcare_chat_stage_${userId}`, conversationStage);
      } catch {}
    })();
  }, [messages, phase, conversationStage]);

  const transitionToPhq9 = () => {
    setPhase("phq9");
    setCurrentQuestion(0);
    setAnswers([]);
    setDone(false);
    setTotalScore(0);
    setNlpAnalysis(null);
    const questions = selectedModel.questions;
    addMessage("ai", `Thank you for sharing. Let\u2019s check in a bit more closely.\n\nOver the last two weeks, how often have you been bothered by:\n\n**${questions[0].text}**\n\nPlease select how often below.`);
  };

  const startAssessment = () => {
    setStarted(true);
    setPhase("phq9");
    setCurrentQuestion(0);
    setAnswers([]);
    setDone(false);
    setTotalScore(0);
    setNlpAnalysis(null);
    const questions = selectedModel.questions;

    // If user typed something, show it first
    if (input.trim()) {
      addMessage("user", input.trim());
      setFreeTextInputs((prev) => [...prev, input.trim()]);
      setInput("");
    }

    // Start PHQ-9 assessment
    addMessage("ai", `${selectedModel.intro}\n\n${questions[0].text}`);
  };

  const getAIResponse = async (userMsg: string) => {
    try {
      const allMessages = [...messages, { id: "temp", role: "user" as const, content: userMsg, time: "" }];
      const res = await fetch("/api/chat-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: userMsg,
          stage: conversationStage,
          nlpContext: nlpContextRef,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        addMessage("ai", data.response);
        // Update stage if server detected a transition
        if (data.stage && data.stage !== conversationStage) {
          setConversationStage(data.stage);
        }
        // Show crisis banner if flagged
        if (data.crisis) {
          addMessage("ai", "🆘 If you are in immediate danger, please call emergency services or go to the nearest emergency room.");
        }
      } else {
        addMessage("ai", "I hear you. Can you tell me more about how this has been affecting you?");
      }
    } catch {
      addMessage("ai", "Thank you for sharing. How has this been impacting your daily life?");
    }
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
        // Store NLP context so chat-ai can use it for stage-aware prompting
        setNlpContextRef({
          nlpSeverity: analysis.nlpSeverity,
          confidence: analysis.confidence,
          riskIndicators: analysis.riskIndicators,
          sentimentBreakdown: analysis.sentimentBreakdown,
          recommendation: analysis.recommendation,
          phq9Score: score,
          assessmentType: selectedModel.id,
        });
        // Only show the recommendation to the student (not full analysis)
        addMessage(
          "ai",
          analysis.recommendation
        );

        // Send full AI analysis to counsellor via notification
        const analysisDetails = [
          `🧠 AI Analysis Complete`,
          `Classification: ${analysis.nlpSeverity} (${(analysis.confidence * 100).toFixed(1)}% confidence)`,
          `Sentiment: ${(analysis.sentimentBreakdown.negative * 100).toFixed(0)}% distress · ${(analysis.sentimentBreakdown.neutral * 100).toFixed(0)}% neutral · ${(analysis.sentimentBreakdown.positive * 100).toFixed(0)}% positive`,
          analysis.riskIndicators.length > 0 ? `Risk Indicators: ${analysis.riskIndicators.join("; ")}` : null,
          `Recommendation: ${analysis.recommendation}`,
        ].filter(Boolean).join("\n");

        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "counsellor-system",
            title: "🧠 AI Analysis Result",
            body: analysisDetails,
            type: analysis.riskIndicators.length > 0 ? "alert" : "info",
            link: "/counsellor",
          }),
        }).catch(() => {});
      }
    } catch (error) {
      console.error("NLP analysis failed:", error);
      addMessage(
        "ai",
        "Note: AI-enhanced analysis is temporarily unavailable, but your responses have been recorded."
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

        // Varied empathetic responses based on answer severity and question number
        const empathyResponses = {
          high: [ // score 2-3 (More than half / Nearly every day)
            "I hear you — that sounds really difficult.",
            "That must be weighing on you. You're not alone in this.",
            "I'm sorry you're going through that. It takes courage to share.",
            "That sounds tough. How long has this been going on?",
            "I appreciate you being honest with me about this.",
          ],
          moderate: [ // score 1 (Several days)
            "I see. Let's keep exploring how you've been feeling.",
            "Got it — even occasional struggles matter.",
            "Thanks for sharing. Every feeling is valid.",
            "I understand. Let's continue checking in.",
          ],
          low: [ // score 0 (Not at all)
            "That's good to hear.",
            "Glad that hasn't been bothering you.",
            "That's positive — let's keep going.",
            "Good. Let's check on a few more things.",
          ],
        };

        const category = optionIndex >= 2 ? "high" : optionIndex === 1 ? "moderate" : "low";
        const responses = empathyResponses[category];
        const empathy = responses[currentQuestion % responses.length];

        addMessage(
          "ai",
          `${empathy}\n\nOver the last two weeks, how often have you been bothered by:\n\n**${nextQ.text}**`
        );
        setCurrentQuestion((prev) => prev + 1);
      } else {
        // All scored questions done — check if PHQ-9 to show Q10 (functional impairment)
        if (selectedModel.id === "phq9") {
          // Check Q9 (index 8) for self-harm flag
          const q9Score = newAnswers[8] ?? 0;
          if (q9Score >= 1) {
            // Auto-flag for immediate follow-up
            fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: "counsellor-system",
                title: "⚠️ Question 9 Flagged — Immediate Follow-up Required",
                body: `A student answered Question 9 (thoughts of self-harm) with score ${q9Score}/3. Immediate review is required.`,
                type: "critical",
                link: "/counsellor",
              }),
            }).catch(() => {});
          }

          // Show Question 10: Functional Impairment
          setPhase("functional");
          addMessage(
            "ai",
            `I appreciate your honesty throughout this check-in.\n\nOne last question — if you checked off any problems above, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?`
          );
        } else {
          // Non-PHQ-9: complete immediately
          completeAssessment(newAnswers);
        }
      }
    }, 500);
  };

  const completeAssessment = (finalAnswers: number[]) => {
    // Clear assessment progress since it's complete
    try { sessionStorage.removeItem("selfcare_assessment_progress"); } catch {}
    const score = finalAnswers.reduce((a, b) => a + b, 0);
    setTotalScore(score);
    setDone(true);
    const severity = selectedModel.getSeverity(score);
    addMessage(
      "ai",
      `Thank you for completing the assessment.\n\nYou're doing great by checking in. Based on your responses, here's what I noticed: **${severity.label}**.\n\n${
        score >= selectedModel.maxScore * 0.7
          ? "I want you to know that help is available. Your counselor will be notified securely. Please consider reaching out to crisis support if you need immediate help."
          : score >= selectedModel.maxScore * 0.5
          ? "Your wellbeing matters. I recommend scheduling a session with a counselor to discuss what you're experiencing."
          : "You're doing okay, but keep checking in. Small steps make a big difference."
      }`
    );
    saveScreeningResult(finalAnswers, score, severity.label);

    // Save screening completion date so next visit goes to chat directly
    try {
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
        const uid = d?.user?.id;
        if (uid) localStorage.setItem(`Selfcare_last_screening_${uid}`, new Date().toISOString());
      });
    } catch {}

    runNlpAnalysis(finalAnswers, score).then(() => {
      setTimeout(() => {
        // Clear assessment messages and start fresh chat
        setMessages([{
          id: `chat-start-${Date.now()}`,
          role: "ai",
          content: "Your check-in is complete. I'm now here to chat — tell me more about what's on your mind, or let's explore what you've been experiencing. What emotions have been most present for you recently? 💚",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        setPhase("chat");
        setConversationStage("exploration");
      }, 2000);
    });
  };

  const handleFunctionalSelect = (optionIndex: number) => {
    const options = ["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"];
    addMessage("user", options[optionIndex]);
    setFunctionalImpairment(optionIndex);

    // Send functional impairment to counsellor
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "counsellor-system",
        title: "📋 Functional Impairment (Q10)",
        body: `Student reported: "${options[optionIndex]}" for functional impairment.`,
        type: optionIndex >= 2 ? "alert" : "info",
        link: "/counsellor",
      }),
    }).catch(() => {});

    // Now complete the assessment
    setTimeout(() => {
      completeAssessment(answers);
    }, 500);
  };

  const handleTextSubmit = () => {
    if (!input.trim()) return;
    addMessage("user", input);
    setFreeTextInputs((prev) => [...prev, input]);
    const userMsg = input;
    setInput("");

    if (phase === "rapport") {
      // Stage 1 complete — student has responded to rapport question
      // Transition to PHQ-9 after a brief acknowledgment
      setTimeout(() => {
        transitionToPhq9();
      }, 600);
    } else if (phase === "chat") {
      // In chat phase, get AI response
      getAIResponse(userMsg);
    } else if (phase === "phq9") {
      // During PHQ-9, free text is treated as additional context.
      // Acknowledge it and gently remind them to select an option.
      setTimeout(() => {
        if (!done && currentQuestion < selectedModel.questions.length) {
          addMessage("ai", `I hear you — that's important context. Please select one of the options below to indicate how often you've experienced this.`);
        }
      }, 500);
    }
  };

  // Generate dynamic suggestion chips based on last AI message
  const getAIChatSuggestions = (): string[] => {
    const lastAiMsg = [...messages].reverse().find((m) => m.role === "ai")?.content?.toLowerCase() || "";

    if (lastAiMsg.includes("sleep")) {
      return ["I can't sleep", "I sleep too much", "Sleep is fine", "It varies"];
    }
    if (lastAiMsg.includes("energy") || lastAiMsg.includes("tired")) {
      return ["Always tired", "Low energy", "It comes and goes", "I feel okay"];
    }
    if (lastAiMsg.includes("appetite") || lastAiMsg.includes("eating")) {
      return ["Not eating much", "Eating too much", "No change", "I skip meals"];
    }
    if (lastAiMsg.includes("concentrat") || lastAiMsg.includes("focus")) {
      return ["Can't focus at all", "Sometimes", "Only in class", "It's fine"];
    }
    if (lastAiMsg.includes("interest") || lastAiMsg.includes("enjoy") || lastAiMsg.includes("pleasure")) {
      return ["Lost all interest", "Some things", "Not really", "I still enjoy things"];
    }
    if (lastAiMsg.includes("worth") || lastAiMsg.includes("failure") || lastAiMsg.includes("letting")) {
      return ["I feel worthless", "Sometimes", "Not really", "I'm working on it"];
    }
    if (lastAiMsg.includes("counsellor") || lastAiMsg.includes("professional") || lastAiMsg.includes("connect")) {
      return ["Yes please", "Maybe later", "Tell me more", "I'll think about it"];
    }
    if (lastAiMsg.includes("how long") || lastAiMsg.includes("how often")) {
      return ["A few days", "About a week", "More than 2 weeks", "A long time"];
    }
    if (lastAiMsg.includes("what") || lastAiMsg.includes("tell me")) {
      return ["Academic stress", "Money problems", "Relationships", "Everything at once"];
    }
    // Default suggestions
    return ["I need help", "Tell me more", "I feel stressed", "I'm okay for now"];
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
      {/* Navbar */}
      <Navbar variant="student" />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <StudentSidebar />

        {/* Chat History Sidebar — like ChatGPT */}
        {historyOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setHistoryOpen(false)} />
            <aside className="fixed md:relative left-0 top-16 bottom-0 z-40 w-72 bg-surface-container-lowest border-r border-outline-variant flex flex-col shadow-xl md:shadow-none animate-slide-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <h3 className="text-sm font-semibold text-on-surface">Chat History</h3>
                <button onClick={() => setHistoryOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-10 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-[32px] block mb-2 opacity-30">chat_bubble_outline</span>
                    <p className="text-xs">No previous chats yet</p>
                  </div>
                ) : (
                  chatHistory.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadHistorySession(session)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-container transition-colors group"
                    >
                      <p className="text-sm text-on-surface truncate font-medium">{session.title}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {new Date(session.date).toLocaleDateString()} · {session.messages.length} messages
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden pb-16 md:pb-0" style={{ height: "calc(100svh - 64px)" }}>
          {/* History toggle button */}
          <div className="flex items-center gap-2 px-3 md:px-6 py-2 border-b border-outline-variant/30 shrink-0">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              History
            </button>
          </div>

          <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col px-3 md:px-6 min-h-0">

            {/* Chat interface - PHQ-9 then AI chat */}
            {checkingLastScreening ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span className="text-sm">Loading your check-in...</span>
                </div>
              </div>
            ) : started && (
              <>
                {/* Next screening indicator */}
                {daysUntilNextScreening !== null && phase === "chat" && (
                  <div className="flex justify-center py-2">
                    <span className="text-xs bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-full text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                      Next assessment in {daysUntilNextScreening} day{daysUntilNextScreening !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden min-h-0 relative">
          {/* Logo watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <img src="/logo.jpeg" alt="" className="w-48 h-48 md:w-64 md:h-64 object-contain opacity-[0.15]" />
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 relative z-10">
            <div className="flex justify-center">
              <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                Daily Check-in
              </span>
            </div>
            {/* Stage indicator — shown during AI chat phase */}
            {(phase === "chat" || phase === "rapport") && (
              <div className="flex justify-center">
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                  conversationStage === "risk"
                    ? "bg-error-container text-on-error-container"
                    : conversationStage === "intervention"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-primary-container/50 text-on-primary-container"
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {conversationStage === "rapport" ? "waving_hand"
                      : conversationStage === "exploration" ? "explore"
                      : conversationStage === "stressors" ? "search"
                      : conversationStage === "risk" ? "warning"
                      : "volunteer_activism"}
                  </span>
                  {{
                    rapport: "Building rapport",
                    exploration: "Exploring your feelings",
                    stressors: "Understanding stressors",
                    risk: "Safety check-in",
                    intervention: "Planning next steps",
                  }[conversationStage]}
                </span>
              </div>
            )}

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
                  {msg.time && (
                    <div className={`text-xs mt-1 opacity-60 ${msg.role === "user" ? "text-right" : ""}`}>
                      {msg.time}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Result - shown briefly then hidden when chat starts */}
            {done && severity && phase !== "chat" && (
              <div className="self-center my-4 animate-fade-in">
                <div className={`px-6 py-4 rounded-2xl border text-center ${severity.bg} border-outline-variant/30`}>
                  <span className="material-symbols-outlined text-primary text-[40px] mb-2">check_circle</span>
                  <div className={`text-sm font-bold ${severity.color}`}>{severity.label}</div>
                  <div className="text-xs text-on-surface-variant mt-1">Assessment Complete</div>
                </div>

                {/* NLP analysis results are sent to counsellor only — not shown to student */}

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
            {/* Answer options - dynamic per phase */}
            {phase === "rapport" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {["I've been struggling", "Feeling okay", "Not great lately", "I need someone to talk to"].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(sug);
                      setTimeout(() => {
                        setInput("");
                        addMessage("user", sug);
                        setFreeTextInputs((prev) => [...prev, sug]);
                        setTimeout(() => transitionToPhq9(), 600);
                      }, 400);
                    }}
                    className="px-3.5 py-2 bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container border border-outline-variant/50 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
            {phase === "phq9" && !done && currentQuestion < selectedModel.questions.length && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {selectedModel.questions[currentQuestion].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(opt);
                      setTimeout(() => { setInput(""); handleOptionSelect(i); }, 400);
                    }}
                    className="px-3.5 py-2 bg-surface-container-low hover:bg-secondary-container hover:text-on-secondary-container border border-outline-variant/50 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {phase === "functional" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(opt);
                      setTimeout(() => { setInput(""); handleFunctionalSelect(i); }, 400);
                    }}
                    className="px-3.5 py-2 bg-surface-container-low hover:bg-secondary-container hover:text-on-secondary-container border border-outline-variant/50 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {phase === "chat" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {getAIChatSuggestions().map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      addMessage("user", sug);
                      setFreeTextInputs((prev) => [...prev, sug]);
                      getAIResponse(sug);
                    }}
                    className="px-3.5 py-2 bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container border border-outline-variant/50 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Text input */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => { if (phase === "chat") setInput(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && phase === "chat") {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  placeholder={phase === "chat" ? "Type your message..." : "Select an option above..."}
                  rows={1}
                  disabled={phase !== "chat"}
                  className={`w-full border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-xl py-3 px-4 text-on-surface text-sm resize-none min-h-[48px] max-h-[120px] ${phase !== "chat" ? "bg-surface-container opacity-60 cursor-not-allowed" : "bg-surface-container-low"}`}
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
              </>
            )}
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
