"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { insforge } from "@/lib/insforge";

interface Contact { name: string; phone: string; }

interface PlanForm {
  warning_signs: string[];
  coping_strategies: string[];
  support_contacts: Contact[];
  professional_contacts: Contact[];
}

const EMPTY_PLAN: PlanForm = {
  warning_signs: [""],
  coping_strategies: [""],
  support_contacts: [{ name: "", phone: "" }],
  professional_contacts: [{ name: "", phone: "" }],
};

const SUGGESTIONS = {
  warning_signs: [
    "Feeling increasingly hopeless",
    "Withdrawing from friends and family",
    "Difficulty getting out of bed",
    "Trouble concentrating on studies",
    "Increased alcohol/substance use",
    "Giving away possessions",
  ],
  coping_strategies: [
    "Call a trusted friend or family member",
    "Go for a walk in a safe place",
    "Use the MindCare breathing exercise",
    "Listen to calming music",
    "Write in my journal",
    "Watch a comforting show or movie",
    "Practice the 5-4-3-2-1 grounding technique",
  ],
};

export default function SafetyPlanPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_PLAN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user) { setLoading(false); return; }
      setUserId(data.user.id);

      const { data: plan } = await insforge.database
        .from("crisis_safety_plans")
        .select()
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (plan) {
        setPlanId(plan.id);
        setForm({
          warning_signs: (plan.warning_signs as string[])?.length ? plan.warning_signs as string[] : [""],
          coping_strategies: (plan.coping_strategies as string[])?.length ? plan.coping_strategies as string[] : [""],
          support_contacts: (plan.support_contacts as Contact[])?.length ? plan.support_contacts as Contact[] : [{ name: "", phone: "" }],
          professional_contacts: (plan.professional_contacts as Contact[])?.length ? plan.professional_contacts as Contact[] : [{ name: "", phone: "" }],
        });
      }
      setLoading(false);
    });
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const updateStringList = (key: "warning_signs" | "coping_strategies", i: number, val: string) =>
    setForm(f => ({ ...f, [key]: f[key].map((v, idx) => idx === i ? val : v) }));

  const addStringItem = (key: "warning_signs" | "coping_strategies") =>
    setForm(f => ({ ...f, [key]: [...f[key], ""] }));

  const removeStringItem = (key: "warning_signs" | "coping_strategies", i: number) =>
    setForm(f => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const addSuggestion = (key: "warning_signs" | "coping_strategies", text: string) => {
    if (form[key].includes(text)) return;
    setForm(f => {
      const list = [...f[key].filter(v => v.trim())];
      return { ...f, [key]: [...list, text] };
    });
  };

  const updateContact = (key: "support_contacts" | "professional_contacts", i: number, field: keyof Contact, val: string) =>
    setForm(f => ({
      ...f,
      [key]: f[key].map((c, idx) => idx === i ? { ...c, [field]: val } : c),
    }));

  const addContact = (key: "support_contacts" | "professional_contacts") =>
    setForm(f => ({ ...f, [key]: [...f[key], { name: "", phone: "" }] }));

  const removeContact = (key: "support_contacts" | "professional_contacts", i: number) =>
    setForm(f => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    const payload = {
      user_id: userId,
      warning_signs: form.warning_signs.filter(v => v.trim()),
      coping_strategies: form.coping_strategies.filter(v => v.trim()),
      support_contacts: form.support_contacts.filter(c => c.name.trim()),
      professional_contacts: form.professional_contacts.filter(c => c.name.trim()),
      updated_at: new Date().toISOString(),
    };

    if (planId) {
      await insforge.database.from("crisis_safety_plans").update(payload).eq("id", planId);
    } else {
      const { data } = await insforge.database.from("crisis_safety_plans").insert([payload]).select();
      if (data?.[0]) setPlanId(data[0].id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const SECTIONS = [
    { title: "Warning Signs", icon: "warning", desc: "What are the early signs that you're struggling?" },
    { title: "Coping Strategies", icon: "self_improvement", desc: "Things you can do on your own to feel better." },
    { title: "Support Contacts", icon: "people", desc: "Trusted people you can reach out to for help." },
    { title: "Professional Contacts", icon: "local_hospital", desc: "Counsellors, therapists, or crisis lines." },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant="student" />
      <main className="flex-1 pt-16 px-4 md:px-20 py-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/crisis" className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <h1 className="text-3xl font-bold text-on-surface">Personal Safety Plan</h1>
          </div>
          <p className="text-on-surface-variant text-sm ml-8">
            Your safety plan is private and only visible to you and your assigned counsellor.
          </p>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide">
          {SECTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeSection === i
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
              {s.title}
            </button>
          ))}
        </div>

        {/* Section panels */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined icon-fill text-[22px]">{SECTIONS[activeSection].icon}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">{SECTIONS[activeSection].title}</h2>
              <p className="text-xs text-on-surface-variant">{SECTIONS[activeSection].desc}</p>
            </div>
          </div>

          <div className="h-px bg-outline-variant my-4" />

          {/* Warning Signs */}
          {activeSection === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {form.warning_signs.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={v}
                      onChange={e => updateStringList("warning_signs", i, e.target.value)}
                      placeholder={`Warning sign ${i + 1}…`}
                      className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {form.warning_signs.length > 1 && (
                      <button onClick={() => removeStringItem("warning_signs", i)}
                        className="w-9 h-9 rounded-xl bg-error-container/30 text-error hover:bg-error-container flex items-center justify-center transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addStringItem("warning_signs")}
                  className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add another
                </button>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-2 font-medium">Suggestions — tap to add:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.warning_signs.map(s => (
                    <button key={s} onClick={() => addSuggestion("warning_signs", s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.warning_signs.includes(s)
                          ? "bg-primary-container text-on-primary-container border-primary/30"
                          : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
                      }`}>
                      {form.warning_signs.includes(s) ? "✓ " : "+ "}{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Coping Strategies */}
          {activeSection === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {form.coping_strategies.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={v}
                      onChange={e => updateStringList("coping_strategies", i, e.target.value)}
                      placeholder={`Coping strategy ${i + 1}…`}
                      className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {form.coping_strategies.length > 1 && (
                      <button onClick={() => removeStringItem("coping_strategies", i)}
                        className="w-9 h-9 rounded-xl bg-error-container/30 text-error hover:bg-error-container flex items-center justify-center transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addStringItem("coping_strategies")}
                  className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add another
                </button>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-2 font-medium">Suggestions — tap to add:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.coping_strategies.map(s => (
                    <button key={s} onClick={() => addSuggestion("coping_strategies", s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.coping_strategies.includes(s)
                          ? "bg-secondary-container text-on-secondary-container border-secondary/30"
                          : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-secondary hover:text-secondary"
                      }`}>
                      {form.coping_strategies.includes(s) ? "✓ " : "+ "}{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Support Contacts */}
          {activeSection === 2 && (
            <div className="space-y-3">
              {form.support_contacts.map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input type="text" value={c.name} onChange={e => updateContact("support_contacts", i, "name", e.target.value)}
                      placeholder="Name (e.g. Mum)"
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="tel" value={c.phone} onChange={e => updateContact("support_contacts", i, "phone", e.target.value)}
                      placeholder="Phone number"
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  {form.support_contacts.length > 1 && (
                    <button onClick={() => removeContact("support_contacts", i)}
                      className="w-9 h-9 rounded-xl bg-error-container/30 text-error hover:bg-error-container flex items-center justify-center transition-colors shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addContact("support_contacts")}
                className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add contact
              </button>
            </div>
          )}

          {/* Professional Contacts */}
          {activeSection === 3 && (
            <div className="space-y-3">
              {/* Pre-fill with national hotlines */}
              <div className="p-3 bg-secondary-container/20 border border-secondary-fixed-dim rounded-xl mb-2">
                <p className="text-xs font-semibold text-on-surface mb-2">Pre-filled national hotlines:</p>
                <div className="space-y-1">
                  {[
                    { name: "Suicide & Crisis Lifeline", phone: "988" },
                    { name: "MindCare Crisis Line", phone: "0800-HELP" },
                  ].map(h => (
                    <div key={h.phone} className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>{h.name}</span>
                      <span className="font-semibold text-primary">{h.phone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {form.professional_contacts.map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input type="text" value={c.name} onChange={e => updateContact("professional_contacts", i, "name", e.target.value)}
                      placeholder="Name / Service"
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="tel" value={c.phone} onChange={e => updateContact("professional_contacts", i, "phone", e.target.value)}
                      placeholder="Phone / Number"
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  {form.professional_contacts.length > 1 && (
                    <button onClick={() => removeContact("professional_contacts", i)}
                      className="w-9 h-9 rounded-xl bg-error-container/30 text-error hover:bg-error-container flex items-center justify-center transition-colors shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addContact("professional_contacts")}
                className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add professional contact
              </button>
            </div>
          )}
        </div>

        {/* Navigation + Save */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={() => setActiveSection(s => Math.max(0, s - 1))} disabled={activeSection === 0}
              className="flex items-center gap-1 px-4 py-2.5 border border-outline-variant rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>
            {activeSection < 3 && (
              <button onClick={() => setActiveSection(s => Math.min(3, s + 1))}
                className="flex items-center gap-1 px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface hover:bg-surface-container-high transition-colors">
                Next
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>

          <button onClick={handleSave} disabled={saving || !userId}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "hourglass_empty" : "save"}
            </span>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Plan"}
          </button>
        </div>

        {saved && (
          <div className="mt-4 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
            Safety plan saved. You can access it from the Crisis page anytime.
          </div>
        )}
      </main>
    </div>
  );
}
