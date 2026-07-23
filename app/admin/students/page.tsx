"use client";
import { useState, useEffect } from "react";
import clsx from "clsx";

const riskColors: Record<string, string> = {
  Critical: "bg-error-container text-on-error-container",
  High: "bg-secondary-container text-on-secondary-container",
  Moderate: "bg-surface-container-highest text-on-surface",
  Minimal: "bg-surface-container-low text-on-surface-variant border border-outline-variant",
};

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/counsellor/students").then(r => r.ok ? r.json() : { students: [] }).then(d => {
      setStudents((d.students || []).filter((s: any) => s.role !== "counsellor" && s.role !== "administrator"));
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const match = s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.faculty?.toLowerCase().includes(q);
    return match && (filterRisk === "All" || s.riskLevel === filterRisk);
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">All Students</h1>
          <p className="text-on-surface-variant mt-1">Platform-wide student overview.</p>
        </div>
        <span className="text-xs bg-surface-container px-3 py-1.5 rounded-full">{students.length} student{students.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or faculty..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 outline-none" />
        </div>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30">
          <option value="All">All Risk Levels</option>
          <option>Critical</option><option>High</option><option>Moderate</option><option>Minimal</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span> Loading...
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Faculty</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Risk</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">PHQ-9</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Q9 Flag</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant text-sm">No students found.</td></tr>
                ) : filtered.map((s: any) => (
                  <tr key={s.id} onClick={() => setSelected(selected?.id === s.id ? null : s)}
                    className={clsx("border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer", selected?.id === s.id && "bg-primary-container/10")}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-on-primary-container">{(s.name || "?").slice(0,2).toUpperCase()}</span>
                        </div>
                        <div><p className="font-medium text-on-surface">{s.name}</p><p className="text-[10px] text-on-surface-variant">{s.email}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{s.faculty || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold", riskColors[s.riskLevel] || riskColors["Minimal"])}>{s.riskLevel}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{s.phq9Score > 0 ? `${s.phq9Score}/27` : "—"}</td>
                    <td className="py-3 px-4 text-center">{s.q9Flagged ? <span className="text-error text-xs font-bold">⚠️ FLAGGED</span> : <span className="text-on-surface-variant text-xs">—</span>}</td>
                    <td className="py-3 px-4 text-center text-on-surface-variant text-xs">{s.lastActive !== "Never" ? new Date(s.lastActive).toLocaleDateString() : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-surface-container"><span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "PHQ-9 Score", value: `${selected.phq9Score}/27` },
              { label: "Risk Level", value: selected.riskLevel },
              { label: "Severity", value: selected.severity },
              { label: "Q9 Flagged", value: selected.q9Flagged ? "Yes ⚠️" : "No" },
            ].map(item => (
              <div key={item.label} className="bg-surface-container-low rounded-xl p-3">
                <p className="text-xs text-on-surface-variant mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-on-surface">{item.value}</p>
              </div>
            ))}
          </div>
          {selected.riskIndicators?.length > 0 && (
            <div className="bg-error-container/20 border border-error/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-error mb-2">Risk Indicators</p>
              {selected.riskIndicators.map((r: string, i: number) => <p key={i} className="text-xs text-on-surface">• {r}</p>)}
            </div>
          )}
          {selected.recommendation && (
            <div className="bg-secondary-container/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-on-surface mb-1">AI Recommendation</p>
              <p className="text-xs text-on-surface-variant">{selected.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
