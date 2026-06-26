"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { insforge } from "@/lib/insforge";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "rny", label: "Runyankore", flag: "🇺🇬" },
  { code: "lg", label: "Luganda", flag: "🇺🇬" },
  { code: "sw", label: "Swahili", flag: "🇹🇿" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [profile, setProfile] = useState({
    name: "", faculty: "", year_of_study: "",
    language_preference: "en", anonymous_id: "", anonymous_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user) { router.push("/auth/sign-in"); return; }
      setUser({ id: data.user.id, email: data.user.email, name: data.user.profile?.name || undefined });

      const { data: prof } = await insforge.database
        .from("student_profiles").select().eq("id", data.user.id).maybeSingle();

      if (prof) {
        setProfile({
          name: (prof as any).name || data.user.profile?.name || "",
          faculty: (prof as any).faculty || "",
          year_of_study: (prof as any).year_of_study?.toString() || "",
          language_preference: (prof as any).language_preference || "en",
          anonymous_id: (prof as any).anonymous_id || "",
          anonymous_mode: (prof as any).anonymous_mode ?? false,
        });
      } else {
        setProfile(p => ({ ...p, name: data.user?.profile?.name || "" }));
      }
      setLoading(false);
    });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError("");

    const { error: authErr } = await insforge.auth.setProfile({ name: profile.name });
    if (authErr) { setError("Failed to update display name."); setSaving(false); return; }

    // Try insert first, fall back to update
    const payload = {
      id: user.id, name: profile.name, email: user.email,
      faculty: profile.faculty || null,
      year_of_study: profile.year_of_study ? parseInt(profile.year_of_study) : null,
      language_preference: profile.language_preference,
      anonymous_mode: profile.anonymous_mode,
      updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await insforge.database.from("student_profiles").insert([payload]);
    if (insertErr) {
      await insforge.database.from("student_profiles").update({
        name: payload.name, faculty: payload.faculty, year_of_study: payload.year_of_study,
        language_preference: payload.language_preference, anonymous_mode: payload.anonymous_mode,
        updated_at: payload.updated_at,
      }).eq("id", user.id);
    }

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // Persist language preference for the session
    if (typeof window !== "undefined") {
      localStorage.setItem("mindcare_lang", profile.language_preference);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/auth/sign-in");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This will permanently delete your account and all data.")) return;
    await insforge.auth.signOut();
    router.push("/");
  };

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
      <main className="flex-1 pt-16 px-4 md:px-20 py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-on-surface mb-1">Profile & Settings</h1>
            <p className="text-on-surface-variant text-sm">Manage your account, preferences, and privacy.</p>
          </div>

          {/* Avatar / Identity card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-container to-secondary-container text-primary flex items-center justify-center text-2xl font-black">
                {profile.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "?"}
              </div>
              {profile.anonymous_mode && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-on-surface">
                {profile.anonymous_mode ? profile.anonymous_id || "Anonymous Student" : (profile.name || user?.email)}
              </h2>
              <p className="text-sm text-on-surface-variant">{user?.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.anonymous_id && (
                  <span className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full border border-outline-variant">
                    {profile.anonymous_id}
                  </span>
                )}
                {profile.faculty && (
                  <span className="text-xs bg-primary-container text-on-primary-container px-2.5 py-1 rounded-full">
                    {profile.faculty} {profile.year_of_study ? `· Year ${profile.year_of_study}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-semibold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              Personal Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Jane Doe"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Faculty / Department</label>
                <input type="text" value={profile.faculty} onChange={e => setProfile(p => ({ ...p, faculty: e.target.value }))}
                  placeholder="Engineering"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Year of Study</label>
                <input type="number" min="1" max="7" value={profile.year_of_study} onChange={e => setProfile(p => ({ ...p, year_of_study: e.target.value }))}
                  placeholder="2"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">language</span>
                Preferred Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(l => (
                  <button key={l.code} type="button" onClick={() => setProfile(p => ({ ...p, language_preference: l.code }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      profile.language_preference === l.code
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-container-low border-outline-variant text-on-surface hover:border-primary hover:bg-primary-container/20"
                    }`}>
                    <span className="text-base">{l.flag}</span>
                    {l.label}
                    {profile.language_preference === l.code && (
                      <span className="material-symbols-outlined icon-fill text-[16px] ml-auto">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                AI responses and PHQ-9 questions will be adapted to your language preference.
              </p>
            </div>

            {error && <p className="text-sm text-error bg-error-container px-3 py-2 rounded-lg">{error}</p>}

            {saved && (
              <div className="flex items-center gap-2 text-sm text-secondary bg-secondary-container px-3 py-2 rounded-xl animate-fade-in">
                <span className="material-symbols-outlined icon-fill text-[18px]">check_circle</span>
                Profile saved successfully.
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{saving ? "hourglass_empty" : "save"}</span>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>

          {/* Privacy & Data */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">security</span>
              Privacy & Data
            </h3>

            {/* Anonymous Mode — FUNCTIONAL toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-on-surface">Anonymous Mode</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {profile.anonymous_mode
                    ? `Active — counsellors see you as "${profile.anonymous_id || "Anonymous"}"`
                    : "Your name is visible to your assigned counsellor."}
                </p>
              </div>
              <button
                onClick={() => setProfile(p => ({ ...p, anonymous_mode: !p.anonymous_mode }))}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  profile.anonymous_mode ? "bg-secondary" : "bg-outline-variant"
                }`}
                aria-label="Toggle anonymous mode"
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform ${
                  profile.anonymous_mode ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {profile.anonymous_mode && (
              <div className="bg-secondary-container/30 border border-secondary-fixed-dim rounded-xl p-3 animate-fade-in">
                <p className="text-xs font-semibold text-on-surface flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-secondary text-[14px]">visibility_off</span>
                  Anonymous mode is ON
                </p>
                <p className="text-xs text-on-surface-variant">
                  Your identity in counsellor reports and case queues will be shown as <strong>{profile.anonymous_id || "Anonymous Student"}</strong>. Save your profile to apply.
                </p>
              </div>
            )}

            {/* Data retention */}
            <div className="flex items-center justify-between py-2 border-t border-outline-variant/30">
              <div>
                <p className="text-sm font-medium text-on-surface">Data Retention</p>
                <p className="text-xs text-on-surface-variant">Your data is retained for 12 months per university policy.</p>
              </div>
              <a href="/privacy" className="text-xs text-primary font-semibold hover:underline">View Policy</a>
            </div>

            {/* Download data stub */}
            <div className="flex items-center justify-between py-2 border-t border-outline-variant/30">
              <div>
                <p className="text-sm font-medium text-on-surface">Download My Data</p>
                <p className="text-xs text-on-surface-variant">Export all your screening results and mood entries.</p>
              </div>
              <button
                onClick={async () => {
                  if (!user) return;
                  const [moods, screenings] = await Promise.all([
                    insforge.database.from("mood_entries").select().eq("user_id", user.id),
                    insforge.database.from("screening_results").select().eq("user_id", user.id),
                  ]);
                  const blob = new Blob([JSON.stringify({ moods: moods.data, screenings: screenings.data }, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "mindcare-data.json"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Export
              </button>
            </div>
          </div>

          {/* OAuth connections */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">link</span>
              Connected Accounts
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { provider: "google", label: "Google", icon: "https://www.google.com/favicon.ico" },
                { provider: "github", label: "GitHub", icon: "https://github.com/favicon.ico" },
              ].map(p => (
                <div key={p.provider} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <img src={p.icon} alt={p.label} className="w-5 h-5 rounded-sm" />
                    <span className="text-sm font-medium text-on-surface">{p.label}</span>
                  </div>
                  <button
                    onClick={() => insforge.auth.signInWithOAuth(p.provider as "google" | "github", {
                      redirectTo: `${window.location.origin}/dashboard`,
                    })}
                    className="text-xs text-primary font-semibold hover:underline border border-primary/30 px-3 py-1 rounded-lg hover:bg-primary-container/20 transition-colors"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-error-container/10 border border-error-container rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-on-surface border-b border-error-container/30 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
              Account
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">Sign Out</p>
                <p className="text-xs text-on-surface-variant">Sign out on this device.</p>
              </div>
              <button onClick={handleSignOut} disabled={signingOut}
                className="flex items-center gap-2 px-4 py-2 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">logout</span>
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-error-container/30 pt-4">
              <div>
                <p className="text-sm font-medium text-error">Delete Account</p>
                <p className="text-xs text-on-surface-variant">Permanently delete all your data. This cannot be undone.</p>
              </div>
              <button onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-4 py-2 border border-error text-error rounded-xl text-sm font-semibold hover:bg-error-container/30 transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
