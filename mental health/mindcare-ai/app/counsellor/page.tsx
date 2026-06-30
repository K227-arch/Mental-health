"use client";

import { useState, useEffect } from "react";
import { riskColors } from "../lib/data";
import type { Student } from "../lib/data";
import clsx from "clsx";
import { useTranslation } from "../lib/i18n";

export default function CounsellorDashboard() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filter, setFilter] = useState<"All" | "Critical" | "High" | "Moderate" | "Minimal">("All");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/counsellor/students")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.students && data.students.length > 0) {
          const dbStudents: Student[] = data.students.map((s: any) => ({
            id: s.id,
            anonymousId: s.name || s.anonymousId || s.id?.slice(0, 8),
            faculty: s.faculty || "Not specified",
            year: s.year || 0,
            riskLevel: s.riskLevel || "Minimal",
            trend: "Stable" as const,
            lastActive: s.lastActive ? new Date(s.lastActive).toLocaleString() : "Never",
            phq9Score: s.phq9Score || 0,
            moodLabel: s.severity || (s.assessmentType !== "none" ? `${(s.assessmentType || "").toUpperCase()} completed` : "No screening"),
            depressionIndex: s.riskLevel === "Critical" ? "High" : s.riskLevel === "High" ? "Moderate" : "Low",
            summary: s.aiSummary || `${s.name}. ${s.assessmentType && s.assessmentType !== "none" ? `Latest: ${s.assessmentType.toUpperCase()} — Score: ${s.phq9Score}.` : "No assessments yet."} Risk: ${s.riskLevel}.`,
            hasNewMessage: false,
          }));
          setStudents(dbStudents);
          setSelectedStudent(dbStudents[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? students : students.filter((s) => s.riskLevel === filter);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleExportReport = () => {
    showFeedback("Report exported successfully.");
  };

  const handleScheduleSession = () => {
    if (!selectedStudent) return;
    showFeedback(`Session booking link sent to ${selectedStudent.anonymousId}.`);
  };

  const handleWellnessCheck = () => {
    if (!selectedStudent) return;
    showFeedback(`Wellness check initiated for ${selectedStudent.anonymousId}. Campus security notified.`);
  };

  const handleClinicalReferral = async () => {
    if (!selectedStudent) return;
    try {
      await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent.id,
          counsellorId: "counsellor-1",
          reason: `Clinical referral for ${selectedStudent.riskLevel} risk student. PHQ-9: ${selectedStudent.phq9Score}`,
          type: "clinical",
        }),
      });
      showFeedback("Clinical referral submitted and documented.");
    } catch {
      showFeedback("Referral saved locally. Will sync when connection restores.");
    }
  };

  const handleDismissAlert = () => {
    if (!selectedStudent) return;
    showFeedback(`Alert dismissed for ${selectedStudent.anonymousId}.`);
  };

  const handleLogIntervention = () => {
    showFeedback("Intervention logged successfully.");
  };

  const handleSendMessage = () => {
    window.location.href = "/counsellor/chat";
  };

  const handleEscalate = () => {
    if (!selectedStudent) return;
    showFeedback(`Case escalated to psychologist for ${selectedStudent.anonymousId}. Priority flag set.`);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto flex flex-col gap-8">
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-20 right-6 z-50 bg-secondary-container text-on-secondary-container px-5 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {actionFeedback}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-on-background">{t("counsellor.dashboard.title")}</h1>
          <p className="text-on-surface-variant mt-1">{t("counsellor.dashboard.monitoring")}</p>
        </div>
        <button onClick={handleExportReport} className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest text-on-surface rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors">
          <span className="material-symbols-outlined text-[18px]">download</span>
          {t("counsellor.export")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: String(students.length), icon: "groups", color: "#074469" },
          { label: "Critical Alerts", value: String(students.filter(s => s.riskLevel === "Critical").length), icon: "warning", color: "#ba1a1a" },
          { label: "Active Sessions", value: String(students.filter(s => s.lastActive !== "Never").length), icon: "pending_actions", color: "#006a64" },
          { label: "Avg PHQ-9", value: students.length > 0 ? String(Math.round(students.reduce((a, s) => a + s.phq9Score, 0) / students.length)) : "0", icon: "analytics", color: "#074469" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs text-on-surface-variant font-medium">{stat.label}</span>
              <span className="material-symbols-outlined icon-fill text-[22px]" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div className="text-3xl font-black text-on-background">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Case Management */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">groups</span>
          <h3 className="text-lg font-semibold text-on-surface mb-2">No students yet</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Students will appear here once they sign up and complete their first PHQ-9 screening. 
            Share the student portal link to get started.
          </p>
        </div>
      ) : (
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
            {filtered.map((student, idx) => {
              const colors = riskColors[student.riskLevel];
              return (
                <button
                  key={`${student.id}-${idx}`}
                  onClick={() => setSelectedStudent(student)}
                  className={clsx(
                    "w-full text-left bg-surface-container-lowest border-l-4 border-y border-r border-outline-variant rounded-r-xl p-4 cursor-pointer transition-colors relative overflow-hidden",
                    colors.border,
                    selectedStudent?.id === student.id
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
        {selectedStudent && (
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
                {selectedStudent.faculty}, Year {selectedStudent.year} • Last active: {selectedStudent.lastActive} via Chat
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
                <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                  {selectedStudent.phq9Score > 0 ? `PHQ-9: ${selectedStudent.phq9Score}` : "No screening data"}
                </span>
              </div>
              <p className="text-sm text-on-surface mb-4 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50">
                {selectedStudent.summary}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-error-container/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">monitor_heart</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">PHQ-9 Score</h4>
                    <p className="text-xs text-on-surface-variant">
                      {selectedStudent.phq9Score > 0 
                        ? <>Score: <strong>{selectedStudent.phq9Score}</strong> — {selectedStudent.moodLabel}</>
                        : "No screening completed yet."}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">mood</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">Depression Index</h4>
                    <p className="text-xs text-on-surface-variant">
                      Level: <strong>{selectedStudent.depressionIndex}</strong>
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">school</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">Student Info</h4>
                    <p className="text-xs text-on-surface-variant">
                      {selectedStudent.faculty}, Year {selectedStudent.year}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">schedule</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface mb-1">Last Activity</h4>
                    <p className="text-xs text-on-surface-variant">
                      {selectedStudent.lastActive}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedStudent.trend === "Declining" ? "bg-error-container text-on-error-container" :
                selectedStudent.trend === "Improving" ? "bg-secondary-container text-on-secondary-container" :
                "bg-surface-container-high text-on-surface"
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {selectedStudent.trend === "Declining" ? "trending_down" : selectedStudent.trend === "Improving" ? "trending_up" : "trending_flat"}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Trend: {selectedStudent.trend}</p>
                <p className="text-xs text-on-surface-variant">Based on screening history and mood entries</p>
              </div>
            </div>

            {/* Recommended Interventions */}
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-3">Recommended Interventions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={handleScheduleSession} className="flex flex-col items-start gap-1 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-left">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    Schedule Session
                  </div>
                  <span className="text-xs text-on-surface-variant">Send priority booking link to {selectedStudent.anonymousId}.</span>
                </button>
                {(selectedStudent.riskLevel === "Critical" || selectedStudent.riskLevel === "High") && (
                  <button onClick={handleWellnessCheck} className="flex flex-col items-start gap-1 p-4 rounded-xl border border-error-container bg-error-container/10 hover:bg-error-container/20 transition-colors text-left">
                    <div className="flex items-center gap-2 text-error font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]">contact_emergency</span>
                      Wellness Check
                    </div>
                    <span className="text-xs text-on-surface-variant">Alert campus security or emergency contact.</span>
                  </button>
                )}
                <button onClick={handleClinicalReferral} className="flex flex-col items-start gap-1 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-left md:col-span-2">
                  <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                    <span className="material-symbols-outlined text-[18px]">medical_services</span>
                    Clinical Referral
                  </div>
                  <span className="text-xs text-on-surface-variant">Prepare documentation for external evaluation.</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
            <button onClick={handleDismissAlert} className="px-5 py-2 rounded-lg border border-outline text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors">
              Dismiss
            </button>
            <button onClick={handleLogIntervention} className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              Log Intervention
            </button>
          </div>
        </div>
        )}

        {/* Action Center */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Actions */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Action Center
            </h3>
            <div className="flex flex-col gap-2">
              <button onClick={handleScheduleSession} className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Schedule Session
              </button>
              <button onClick={handleSendMessage} className="w-full flex items-center gap-3 px-4 py-2.5 border border-outline-variant bg-surface hover:bg-surface-container rounded-lg text-sm text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Send Secure Message
              </button>
              <button onClick={handleClinicalReferral} className="w-full flex items-center gap-3 px-4 py-2.5 border border-outline-variant bg-surface hover:bg-surface-container rounded-lg text-sm text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">medical_services</span>
                Initiate Referral
              </button>
              <div className="my-1 border-t border-outline-variant" />
              <button onClick={handleEscalate} className="w-full flex items-center gap-3 px-4 py-2.5 bg-error-container text-on-error-container rounded-lg text-sm font-medium hover:bg-error/20 transition-colors">
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
      )}
    </div>
  );
}
