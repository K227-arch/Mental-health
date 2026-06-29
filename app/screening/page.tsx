"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { phq9Questions, getPHQ9Severity } from "../lib/data";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content:
        "Hello. I'm here to support you.\n\nOver the last two weeks, how often have you been bothered by the following problem?\n\n" +
        phq9Questions[0].text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [nlpAnalysis, setNlpAnalysis] = useState<NlpAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [freeTextInputs, setFreeTextInputs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "ai" | "user", content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role,
        content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
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
        }),
      });

      if (response.ok) {
        const analysis: NlpAnalysis = await response.json();
        setNlpAnalysis(analysis);
        addMessage(
          "ai",
          `≡ƒºá **AI Analysis Complete**\n\nOur NLP model has analyzed your responses:\n\n` +
            `**Classification:** ${analysis.nlpSeverity} (${(analysis.confidence * 100).toFixed(1)}% confidence)\n\n` +
            `**Sentiment:** ${(analysis.sentimentBreakdown.negative * 100).toFixed(0)}% distress ┬╖ ${(analysis.sentimentBreakdown.neutral * 100).toFixed(0)}% neutral ┬╖ ${(analysis.sentimentBreakdown.positive * 100).toFixed(0)}% positive\n\n` +
            (analysis.riskIndicators.length > 0
              ? `**Risk Indicators:**\n${analysis.riskIndicators.map((r) => `ΓÇó ${r}`).join("\n")}\n\n`
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
    const question = phq9Questions[currentQuestion];
    addMessage("user", question.options[optionIndex]);

    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion + 1 < phq9Questions.length) {
        const nextQ = phq9Questions[currentQuestion + 1];
        addMessage(
          "ai",
          `Thank you for sharing that.\n\nOver the last two weeks, how often have you been bothered by:\n\n${nextQ.text}`
        );
        setCurrentQuestion((prev) => prev + 1);
      } else {
        const score = newAnswers.reduce((a, b) => a + b, 0);
        setTotalScore(score);
        setDone(true);
        const severity = getPHQ9Severity(score);
        addMessage(
          "ai",
          `Thank you for completing the check-in.\n\nBased on your responses, your PHQ-9 score is **${score}** ΓÇö indicating **${severity.label}** level.\n\n${
            score >= 15
              ? "I want you to know that help is available. Your counselor will be notified securely. Please consider reaching out to crisis support if you need immediate help."
              : score >= 10
              ? "Your wellbeing matters. I recommend scheduling a session with a counselor to discuss what you're experiencing."
              : "You're doing okay, but keep checking in. Small steps make a big difference."
          }\n\nRunning AI-powered NLP analysis on your responses... ≡ƒöì`
        );
        // Trigger NLP analysis
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

  const severity = done ? getPHQ9Severity(totalScore) : null;
  const progress = ((currentQuestion + (done ? 1 : 0)) / phq9Questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
      <div className="bg-blob-1" />
      <div className="bg-blob-2" />

      {/* Top Nav */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface shadow-sm border-b border-outline-variant/30">
        <Link href="/" className="font-black text-xl text-primary">MindCare AI</Link>
        <div className="flex items-center gap-2">
          <Link
            href="/crisis"
            className="flex items-center gap-1 px-3 py-1.5 text-error text-sm font-medium hover:bg-error-container/50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined icon-fill text-[18px]">medical_services</span>
            Emergency Help
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto mt-16 relative z-10 flex flex-col px-4 md:px-6 pb-8" style={{ height: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div className="flex flex-col items-center justify-center py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface text-center mb-1">Daily Check-in</h1>
          <p className="text-on-surface-variant text-sm text-center max-w-md mb-4">
            Take a moment for yourself. We'll walk through a few questions to understand how you're feeling.
          </p>
          {/* Progress */}
          <div className="w-full max-w-md bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between w-full max-w-md mt-1">
            <span className="text-xs text-on-surface-variant">
              Question {Math.min(currentQuestion + 1, phq9Questions.length)} of {phq9Questions.length}
            </span>
            <span className="text-xs text-primary font-semibold">PHQ-9 Assessment</span>
          </div>
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

            {messages.map((msg) => (
              <div
                key={msg.id}
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
            {!done && currentQuestion < phq9Questions.length && (
              <div className="self-start max-w-[85%] ml-11 animate-fade-in">
                <div className="flex flex-col gap-2">
                  {phq9Questions[currentQuestion].options.map((opt, i) => (
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

            {/* Score result */}
            {done && severity && (
              <div className="self-center my-4 animate-fade-in">
                <div className={`px-6 py-4 rounded-2xl border text-center ${severity.bg} border-outline-variant/30`}>
                  <div className="text-4xl font-black text-primary mb-1">{totalScore}</div>
                  <div className={`text-sm font-bold ${severity.color}`}>{severity.label}</div>
                  <div className="text-xs text-on-surface-variant mt-1">PHQ-9 Score</div>
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
                            <span className="text-error mt-0.5">ΓÇó</span>
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
                    href="/dashboard"
                    className="px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity text-center"
                  >
                    View Dashboard
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
              {["≡ƒÿö", "≡ƒÿÉ", "≡ƒÖé", "≡ƒÿ░", "≡ƒÿñ", "≡ƒÿó", "≡ƒÿè"].map((emoji) => (
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
                  className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container flex items-center justify-center transition-colors"
                  title="Record Audio"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container flex items-center justify-center transition-colors"
                  title="Upload Video"
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                </button>
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
      </main>
    </div>
  );
}