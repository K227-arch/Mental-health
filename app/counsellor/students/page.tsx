"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { useTranslation } from "../../lib/i18n";

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  faculty: string;
  year: number;
  riskLevel: string;
  lastActive: string;
  phq9Score: number;
  phq9MaxScore: number;
  assessmentType: string;
  severity: string;
  hasVideo: boolean;
  q9Score: number;
  q9Flagged: boolean;
  riskIndicators: string[];
  flaggedMessages: { content: string; date: string }[];
  nlpAnalysis: string | null;
  crisisAlert: string | null;
  stageInfo: string | null;
  recommendation: string;
  totalScreenings: number;
}

const riskBadgeColors: Record<string, string> = {
  Critical: "bg-error-container text-on-error-container",
  High: "bg-secondary-container text-on-secondary-container",
  Moderate: "bg-surface-container-highest text-on-surface",
  Minimal: "bg-surface-container-low text-on-surface-variant border border-outline-variant",
};

export default function StudentsManagementPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  useEffect(() => {
    fetch("/api/counsellor/students")
      .then((r) => r.ok ? r.json() : { students: [] })
      .then((data) => {
        const mapped: StudentRecord[] = (data.students || []).map((s: any) => ({
          id: s.id,
          name: s.name || s.id?.slice(0, 8),
          email: s.email || "",
          faculty: s.faculty || "Not specified",
          year: s.year || 0,
          riskLevel: s.riskLevel || "Minimal",
          lastActive: s.lastActive || "Never",
          phq9Score: s.phq9Score || 0,
          phq9MaxScore: s.phq9MaxScore || 27,
          assessmentType: s.assessmentType || "none",
          severity: s.severity || "No screening",
          hasVideo: false,
          q9Score: s.q9Score || 0,
          q9Flagged: s.q9Flagged || false,
          riskIndicators: s.riskIndicators || [],
          flaggedMessages: s.flaggedMessages || [],
          nlpAnalysis: s.nlpAnalysis || null,
          crisisAlert: s.crisisAlert || null,
          stageInfo: s.stageInfo || null,
          recommendation: s.recommendation || "",
          totalScreenings: s.totalScreenings || 0,
        }));
        setStudents(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.faculty.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === "All" || s.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">{t("counsellor.students.title")}</h1>
          <p className="text-on-surface-variant mt-1">{t("counsellor.students.subtitle")}</p>
        </div>
        <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
          {students.length} student{students.length !== 1 ? "s" : ""} registered
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("counsellor.students.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none"
          />
        </div>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="All">All Risk Levels</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Moderate">Moderate</option>
          <option value="Minimal">Minimal</option>
        </select>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
          Loading students...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">groups</span>
          <p className="text-sm text-on-surface-variant">No students found.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Faculty</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Risk Level</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Assessment</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Score</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Last Active</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className={clsx(
                      "border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer",
                      selectedStudent?.id === student.id && "bg-primary-container/10"
                    )}
                    onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-on-primary-container">{student.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-on-surface">{student.name}</p>
                          {student.email && <p className="text-[10px] text-on-surface-variant">{student.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      {student.faculty}{student.year > 0 ? `` : ""}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold", riskBadgeColors[student.riskLevel] || riskBadgeColors["Minimal"])}>
                        {student.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-on-surface-variant text-xs">
                      {student.assessmentType !== "none" ? student.assessmentType.toUpperCase() : "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-on-surface">
                      {student.phq9Score > 0 ? student.phq9Score : "—"}
                    </td>
                    <td className="py-3 px-4 text-center text-on-surface-variant text-xs">
                      {student.lastActive !== "Never" ? new Date(student.lastActive).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); window.location.href = "/counsellor/chat"; }}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Message"
                        >
                          <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                          title="View file"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">folder_open</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Detail Panel — Full Analysis */}
      {selectedStudent && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm animate-fade-in space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <span className="text-lg font-bold text-on-primary-container">{selectedStudent.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">{selectedStudent.name}</h2>
                <p className="text-sm text-on-surface-variant">{selectedStudent.faculty}{selectedStudent.year > 0 ? `` : ""}</p>
              </div>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
            </button>
          </div>

          {/* PHQ-9 Score + Risk Level + Q9 Flag */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
              <div className="text-xs text-on-surface-variant mb-1">PHQ-9 Score</div>
              <div className="text-2xl font-black text-primary">{selectedStudent.phq9Score}<span className="text-sm font-normal text-on-surface-variant">/{selectedStudent.phq9MaxScore}</span></div>
              <div className="text-xs text-on-surface-variant mt-0.5">{selectedStudent.severity}</div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
              <div className="text-xs text-on-surface-variant mb-1">Risk Level</div>
              <span className={clsx("text-xs px-2.5 py-1 rounded-full uppercase font-semibold", riskBadgeColors[selectedStudent.riskLevel] || riskBadgeColors["Minimal"])}>
                {selectedStudent.riskLevel}
              </span>
            </div>
            <div className={clsx("rounded-xl p-4 border", selectedStudent.q9Flagged ? "bg-error-container/30 border-error/30" : "bg-surface-container-low border-outline-variant/30")}>
              <div className="text-xs text-on-surface-variant mb-1">Question 9 (Self-harm)</div>
              <div className={clsx("text-sm font-semibold", selectedStudent.q9Flagged ? "text-error" : "text-on-surface")}>
                {selectedStudent.q9Flagged ? `⚠️ Score: ${selectedStudent.q9Score}/3 — FLAGGED` : `Score: ${selectedStudent.q9Score}/3 — Clear`}
              </div>
              {selectedStudent.q9Flagged && <div className="text-[10px] text-error mt-1">Immediate follow-up required</div>}
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
              <div className="text-xs text-on-surface-variant mb-1">Total Screenings</div>
              <div className="text-xl font-bold text-on-surface">{selectedStudent.totalScreenings}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">Assessment{selectedStudent.totalScreenings !== 1 ? "s" : ""} completed</div>
            </div>
          </div>

          {/* Risk Indicators — Self-harm, Crisis, Emergency */}
          {selectedStudent.riskIndicators.length > 0 && (
            <div className="bg-error-container/20 border border-error/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-error mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Risk Indicators & Safety Alerts
              </h3>
              <div className="space-y-1.5">
                {selectedStudent.riskIndicators.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="text-error mt-0.5 shrink-0">•</span>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagged Messages */}
          {selectedStudent.flaggedMessages.length > 0 && (
            <div className="bg-error-container/10 border border-error/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[18px]">flag</span>
                Flagged Messages (Crisis Keywords Detected)
              </h3>
              <div className="space-y-2">
                {selectedStudent.flaggedMessages.map((msg, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/30">
                    <p className="text-sm text-on-surface italic">&ldquo;{msg.content}&rdquo;</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{new Date(msg.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NLP Analysis */}
          {selectedStudent.nlpAnalysis && (
            <div className="bg-primary-container/10 border border-primary/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">neurology</span>
                NLP Analysis (AI Module)
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{selectedStudent.nlpAnalysis}</p>
            </div>
          )}

          {/* Crisis Alert from Suicide Detection Engine */}
          {selectedStudent.crisisAlert && (
            <div className="bg-error-container/30 border border-error/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-error mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">emergency</span>
                Suicide Detection Engine Alert
              </h3>
              <p className="text-sm text-on-surface leading-relaxed">{selectedStudent.crisisAlert}</p>
            </div>
          )}

          {/* AI Recommendation */}
          <div className="bg-secondary-container/20 border border-secondary/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">lightbulb</span>
              AI Recommended Action
            </h3>
            <p className="text-sm text-on-surface leading-relaxed">{selectedStudent.recommendation}</p>
          </div>

          {/* Stage Info (Prompt Engineering Engine) */}
          {selectedStudent.stageInfo && (
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
              <h3 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">route</span>
                Conversation Stage (Prompt Engineering)
              </h3>
              <p className="text-sm text-on-surface-variant">{selectedStudent.stageInfo}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { window.location.href = "/counsellor/chat"; }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Send Message
            </button>
            <button
              onClick={() => { window.location.href = "/counsellor/media"; }}
              className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant bg-surface text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
              View Uploads
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
