"use client";

import { useState } from "react";
import { students, riskColors } from "../../lib/data";
import type { Student } from "../../lib/data";
import clsx from "clsx";

interface ChatMsg {
  id: string;
  role: "counsellor" | "student";
  content: string;
  timestamp: string;
}

const mockChats: Record<string, ChatMsg[]> = {
  "1": [
    { id: "c1", role: "student", content: "I just don't see the point in trying for these midterms anymore. Everything feels too heavy to carry.", timestamp: "03:15 AM" },
    { id: "c2", role: "counsellor", content: "I hear you, and I'm glad you reached out. Can you tell me more about what's been feeling heavy?", timestamp: "03:16 AM" },
    { id: "c3", role: "student", content: "It's like every assignment is piling up and I can't breathe. I've been skipping classes.", timestamp: "03:18 AM" },
    { id: "c4", role: "counsellor", content: "That sounds incredibly tough. You're not alone. Would you be open to scheduling a brief session today?", timestamp: "03:20 AM" },
  ],
  "2": [
    { id: "d1", role: "student", content: "I've been struggling to get out of bed. Everything feels pointless lately.", timestamp: "11:40 PM" },
    { id: "d2", role: "counsellor", content: "Thank you for sharing that. Lack of motivation can be a sign of depression. How has your sleep been?", timestamp: "11:42 PM" },
    { id: "d3", role: "student", content: "I'm sleeping but I wake up exhausted. Like I haven't rested at all.", timestamp: "11:45 PM" },
  ],
  "3": [
    { id: "e1", role: "student", content: "Exams are coming up and I'm feeling overwhelmed by all the pressure.", timestamp: "09:20 AM" },
    { id: "e2", role: "counsellor", content: "Exam stress is very common. Have you tried breaking your study sessions into smaller chunks?", timestamp: "09:22 AM" },
    { id: "e3", role: "student", content: "I haven't. I just try to do everything at once and nothing sticks.", timestamp: "09:25 AM" },
    { id: "e4", role: "counsellor", content: "Let's work on a study schedule together. I'll share some techniques that might help.", timestamp: "09:27 AM" },
  ],
  "4": [
    { id: "f1", role: "student", content: "Hi! Just checking in for the weekly update. Everything has been going well.", timestamp: "02:00 PM" },
    { id: "f2", role: "counsellor", content: "Great to hear! Any particular wins this week you'd like to share?", timestamp: "02:02 PM" },
  ],
};

export default function CounsellorChat() {
  const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);
  const [messages, setMessages] = useState<ChatMsg[]>(mockChats[students[0].id] || []);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setMessages(mockChats[student.id] || []);
  }

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg: ChatMsg = {
      id: `m${Date.now()}`,
      role: "counsellor",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  }

  const colors = riskColors[selectedStudent.riskLevel];

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto h-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background">Counselling Chat</h1>
        <p className="text-on-surface-variant mt-1">Real-time messaging with anonymized students.</p>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 relative">
        {/* Sidebar toggle (mobile) */}
        <button
          className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle student list"
        >
          <span className="material-symbols-outlined icon-fill">{sidebarOpen ? "close" : "forum"}</span>
        </button>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Student List */}
        <div className={`w-72 shrink-0 flex flex-col gap-3 ${
          sidebarOpen ? "fixed left-0 top-16 z-40 bg-surface h-[calc(100vh-64px)] p-4 shadow-2xl animate-slide-in" : "hidden"
        } md:flex`}>
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">forum</span>
            Active Conversations
          </h3>
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
            {students.map((student) => {
              const c = riskColors[student.riskLevel];
              return (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className={clsx(
                    "w-full text-left bg-surface-container-lowest border-l-4 border-y border-r border-outline-variant rounded-r-xl p-4 cursor-pointer transition-colors relative overflow-hidden",
                    c.border,
                    selectedStudent.id === student.id ? "bg-surface-container-low shadow-md" : "hover:bg-surface-container-low"
                  )}
                >
                  {student.riskLevel === "Critical" && (
                    <div className="absolute top-0 right-0 w-14 h-14 bg-error-container/20 rounded-bl-full -mr-3 -mt-3" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-bold text-on-background block">{student.anonymousId}</span>
                      <span className="text-xs text-on-surface-variant">{student.faculty}, Yr {student.year}</span>
                    </div>
                    <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold", c.badge)}>
                      {student.riskLevel}
                    </span>
                  </div>
                  <div className={clsx("flex items-center gap-1 mb-2 text-xs", c.text)}>
                    <span className="material-symbols-outlined text-[14px]">
                      {student.trend === "Declining" ? "trending_up" : student.trend === "Improving" ? "trending_down" : "trending_flat"}
                    </span>
                    <span className="uppercase tracking-wider">{student.trend}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">{student.summary}</p>
                  <div className="text-xs text-outline flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {student.lastActive}
                    </span>
                    {student.hasNewMessage && (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <span className="material-symbols-outlined text-[12px]">mark_chat_unread</span>
                        1 New
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant flex items-center gap-3 bg-surface-bright">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined icon-fill">person</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-on-background">{selectedStudent.anonymousId}</h2>
                <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold", colors.badge)}>
                  {selectedStudent.riskLevel}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">{selectedStudent.faculty}, Yr {selectedStudent.year} &middot; PHQ-9: {selectedStudent.phq9Score}</p>
            </div>
            <button className="p-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" title="History">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  No messages yet. Start the conversation.
                </span>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.role === "counsellor";
              return (
                <div key={msg.id} className={clsx("flex", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={clsx(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      isMe
                        ? "bg-secondary text-on-secondary rounded-br-[4px]"
                        : "bg-surface-container-high text-on-surface rounded-bl-[4px]"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={clsx("text-[10px] mt-1", isMe ? "text-on-secondary/60" : "text-outline")}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-bright">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-3">
              <button type="button" className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" title="Attach">
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-background outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/60"
              />
              <button type="submit" disabled={!input.trim()} className="p-2.5 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
