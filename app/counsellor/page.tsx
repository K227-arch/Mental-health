"use client";

import { useState } from "react";
import { students, counsellorStats, riskColors } from "../lib/data";
import type { Student } from "../lib/data";
import clsx from "clsx";

export default function CounsellorDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);
  const [filter, setFilter] = useState<"All" | "Critical" | "High" | "Moderate" | "Minimal">("All");

  const filtered = filter === "All" ? students : students.filter((s) => s.riskLevel === filter);

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Decision Support Overview</h1>
          <p className="text-on-surface-variant mt-1">Monitoring {students.length * 10} active anonymized cases.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest text-on-surface rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {counsellorStats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs text-on-surface-variant font-medium">{stat.label}</span>
              <span
                className="material-symbols-outlined icon-fill text-[22px]"
                style={{
                  color:
                    stat.label === "Active Critical Alerts"
                      ? "#ba1a1a"
                      : stat.label === "Pending Interventions"
                      ? "#006a64"
                      : "#074469",
                }}
              >
                {stat.icon}
              </span>
            </div>
            <div className="text-3xl font-black text-on-background">{stat.value}</div>
            <div className={`text-xs flex items-center gap-1 ${stat.trendColor}`}>
              <span className="material-symbols-outlined text-[14px]">{stat.trendIcon}</span>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Case Management */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Case List */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-on-surface">Active Queue</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="text-xs bg-surface border border-outline-variant rounded-lg px-2 py-1.5 text-on-surface-variant outline-none focus:ring-1 focus:ring-primary"
            >
              <option>All</option>
              <option>Critical</option>
              <option>High</option>
              <option>Moderate</option>
              <option>Minimal</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[540px] pr-1">
            {filtered.map((student) => {
              const colors = riskColors[student.riskLevel];
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={clsx(
                    "w-full text-left bg-surface-container-lowest border-l-4 border-y border-r border-outline-variant rounded-r-xl p-4 cursor-pointer transition-colors relative overflow-hidden",
                    colors.border,
                    selectedStudent.id === student.id
                      ? "bg-surface-container-low shadow-md"
                      : "hover:bg-surface-container-low"
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
                    <span className={clsx("text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold", colors.badge)}>
                      {student.riskLevel}
                    </span>
                  </div>
                  <div className={clsx("flex items-center gap-1 mb-2 text-xs", colors.text)}>
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

        {/* Detail Panel */}
        <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-5 border-b border-outline-variant flex justify-between items-start bg-surface-bright">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-on-background">{selectedStudent.anonymousId}</h2>
                <span className={clsx("text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold", riskColors[selectedStudent.riskLevel].badge)}>
                  {selectedStudent.riskLevel} Risk
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">
                {selectedStudent.faculty}, Year {selectedStudent.year} ΓÇó Last active: {selectedStudent.lastActive} via Chat
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" title="History">
                <span className="material-symbols-outlined text-[20px]">history</span>
              </button>
              <button className="p-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" title="More">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 md:p-6 flex-1 overflow-y-auto flex flex-col gap-6">
            {/* AI Risk Interpretation */}
            <div className="bg-primary-fixed/30 border border-primary-fixed-dim rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined icon-fill text-[18px]">psychiatry</span>
                  </div>
                  <h3 className="text-sm font-bold text-on-primary-fixed-variant">AI Risk Interpretation</h3>
                </div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider">Confidence: 92%</span>
              </div>
              <p className="text-sm text-on-surface mb-4 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50">
                {selectedStudent.anonymousId} has been escalated to{" "}
                <strong className={riskColors[selectedStudent.riskLevel].text}>
                  {selectedStudent.riskLevel} Risk
                </strong>{" "}
                based on a confluence of clinical markers, sentiment analysis, and interaction patterns.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-error-container/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">monitor_heart</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">PHQ-9 Score Trend</h4>
                    <p className="text-xs text-on-surface-variant">
                      Proxy score: <strong>{selectedStudent.phq9Score}</strong> ({selectedStudent.moodLabel}). Risk escalation flagged.
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">sentiment_dissatisfied</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">Sentiment Analysis</h4>
                    <p className="text-xs text-on-surface-variant">
                      NLP detected keywords related to stress and difficulty coping.
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">school</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">Academic Stressors</h4>
                    <p className="text-xs text-on-surface-variant">
                      LMS integration indicates missed assignments this week.
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">schedule</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">Erratic Interactions</h4>
                    <p className="text-xs text-on-surface-variant">
                      Primary engagement between 2:00ΓÇô4:30 AM over 3 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flagged Chat Snippets */}
            {selectedStudent.flaggedSnippet && (
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  Flagged Chat Snippets
                </h3>
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3">
                  <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50">
                    <p className="text-sm italic text-on-surface-variant">"{selectedStudent.flaggedSnippet}"</p>
                    <p className="text-[10px] text-outline mt-2 text-right">{selectedStudent.flaggedTime}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Interventions */}
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-3">Recommended Interventions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button className="flex flex-col items-start gap-1 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-left">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    Schedule Urgent Session
                  </div>
                  <span className="text-xs text-on-surface-variant">Send automated priority booking link for today.</span>
                </button>
                {selectedStudent.riskLevel === "Critical" && (
                  <button className="flex flex-col items-start gap-1 p-4 rounded-xl border border-error-container bg-error-container/10 hover:bg-error-container/20 transition-colors text-left">
                    <div className="flex items-center gap-2 text-error font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]">contact_emergency</span>
                      Initiate Wellness Check
                    </div>
                    <span className="text-xs text-on-surface-variant">Alert campus security or emergency contact.</span>
                  </button>
                )}
                <button className="flex flex-col items-start gap-1 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-left md:col-span-2">
                  <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                    <span className="material-symbols-outlined text-[18px]">medical_services</span>
                    Clinical Referral
                  </div>
                  <span className="text-xs text-on-surface-variant">Prepare documentation for external psychiatric evaluation.</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
            <button className="px-5 py-2 rounded-lg border border-outline text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors">
              Dismiss Alert
            </button>
            <button className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              Log Intervention
            </button>
          </div>
        </div>

        {/* Action Center */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Actions */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Action Center
            </h3>
            <div className="flex flex-col gap-2">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Schedule Session
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 border border-outline-variant bg-surface hover:bg-surface-container rounded-lg text-sm text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Send Secure Message
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 border border-outline-variant bg-surface hover:bg-surface-container rounded-lg text-sm text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">medical_services</span>
                Initiate Referral
              </button>
              <div className="my-1 border-t border-outline-variant" />
              <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-error-container text-on-error-container rounded-lg text-sm font-medium hover:bg-error/20 transition-colors">
                <span className="material-symbols-outlined text-[18px]">contact_emergency</span>
                Escalate to Psychologist
              </button>
            </div>
          </div>

          {/* Referral Tracking */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">share</span>
              Referral Tracking
            </h3>
            <div className="flex flex-col gap-3">
              <div className="p-3 border border-outline-variant rounded-lg bg-surface-container-low">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-on-surface">Student Welfare Dept</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] uppercase font-semibold">
                    Completed
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Financial aid review completed Oct 12.</p>
              </div>
              <div className="p-3 border border-outline-variant rounded-lg bg-surface">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-on-surface">External Psychiatric</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded border border-outline text-on-surface-variant text-[9px] uppercase font-semibold">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Referral sent. Waiting for intake confirmation.</p>
              </div>
              <div className="p-3 border border-outline-variant rounded-lg bg-surface">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-on-surface">Academic Advisory</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-error-container text-on-error-container text-[9px] uppercase font-semibold">
                    Urgent
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Grade deferment application required.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}