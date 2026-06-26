"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { insforge } from "@/lib/insforge";

export default function NewSessionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    student_id: "", student_name: "", faculty: "", year: "", risk_level: "Minimal", notes: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id.trim()) { setError("Student ID is required."); return; }
    setCreating(true); setError("");

    // Check for existing active session
    const { data: existing } = await insforge.database
      .from("counsellor_sessions")
      .select()
      .eq("student_id", form.student_id.trim())
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      setError("This student already has an active session.");
      setCreating(false);
      return;
    }

    const { data, error: err } = await insforge.database.from("counsellor_sessions").insert([{
      student_id: form.student_id.trim(),
      counsellor_id: "counsellor",
      status: "active",
      risk_level: form.risk_level,
      notes: form.notes || null,
      student_name: form.student_name.trim() || form.student_id.trim(),
    }]).select();

    if (err || !data?.[0]) { setError("Failed to create session."); setCreating(false); return; }

    // Notify student
    await insforge.database.from("notifications").insert([{
      user_id: form.student_id.trim(),
      title: "Counsellor session started",
      body: "Your assigned counsellor has opened a new support session with you.",
      type: "info",
      link: "/messages",
    }]);

    router.push(`/counsellor?session=${data[0].id}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/counsellor" className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">New Session</h1>
          <p className="text-sm text-on-surface-variant">Start a support session for a student</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Student ID <span className="text-error">*</span>
          </label>
          <input type="text" required value={form.student_id} onChange={e => set("student_id", e.target.value)}
            placeholder="e.g. usr_abc123 or student@university.edu"
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-on-surface-variant mt-1">Enter the student&apos;s InsForge user ID or email address.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">Display Name (shown in queue)</label>
          <input type="text" value={form.student_name} onChange={e => set("student_name", e.target.value)}
            placeholder="e.g. Student #4521 or leave blank"
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Faculty</label>
            <input type="text" value={form.faculty} onChange={e => set("faculty", e.target.value)}
              placeholder="Engineering"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Initial Risk Level</label>
            <select value={form.risk_level} onChange={e => set("risk_level", e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
              {["Minimal", "Moderate", "High", "Critical"].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">Opening Notes (optional)</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Referral reason, initial observations, context…"
            rows={3}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/counsellor" className="flex-1 flex items-center justify-center px-4 py-3 border border-outline-variant rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={creating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">{creating ? "hourglass_empty" : "add"}</span>
            {creating ? "Creating…" : "Create Session"}
          </button>
        </div>
      </form>
    </div>
  );
}
