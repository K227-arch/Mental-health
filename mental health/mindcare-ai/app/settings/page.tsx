"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import StudentSidebar from "../components/StudentSidebar";
import { useTranslation, languages } from "../lib/i18n";

export default function SettingsPage() {
  const { lang, setLang } = useTranslation();
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.user) {
        setUser(d.user);
        setName(d.user.name || "");
        // Fetch profile
        fetch(`/api/profile?userId=${d.user.id}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.profile) {
              setProfile(data.profile);
              setFaculty(data.profile.faculty || "");
              setYear(data.profile.year_of_study || 1);
              if (data.profile.name) setName(data.profile.name);
            }
          });
      }
    });
  }, []);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaved(false);

    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        name,
        faculty,
        yearOfStudy: year,
        languagePreference: lang,
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar variant="student" />
      <div className="flex flex-1 pt-16">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto px-6 md:px-16 max-w-2xl py-10">
        <h1 className="text-3xl font-bold text-on-surface mb-2">Settings</h1>
        <p className="text-on-surface-variant text-sm mb-8">Manage your profile and preferences.</p>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
                />
                <p className="text-xs text-on-surface-variant/60 mt-1">Email cannot be changed.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">Faculty</label>
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="e.g. Computing"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">Year of Study</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">language</span>
              Language
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    lang === l.code
                      ? "bg-primary-container border-primary text-on-primary-container"
                      : "bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="block font-semibold">{l.nativeLabel}</span>
                  <span className="block text-xs opacity-70">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && (
              <span className="text-sm text-secondary font-medium animate-fade-in flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Saved successfully
              </span>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
