"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { insforge } from "@/lib/insforge";

// Generate slots for next 7 days, 9am-5pm, 30-min intervals
function generateSlots() {
  const slots: { date: string; time: string; label: string; iso: string }[] = [];
  const now = new Date();

  for (let d = 1; d <= 7; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);

    // Skip weekends
    if (day.getDay() === 0 || day.getDay() === 6) continue;

    const dateLabel = day.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
    const dateKey = day.toISOString().split("T")[0];

    for (let h = 9; h < 17; h++) {
      for (const m of [0, 30]) {
        const t = `${h.toString().padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
        const ampm = h < 12 ? "AM" : "PM";
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const label = `${h12}:${m === 0 ? "00" : "30"} ${ampm}`;
        const iso = new Date(`${dateKey}T${t}:00`).toISOString();
        slots.push({ date: dateKey, time: t, label, iso });
      }
    }
  }
  return slots;
}

// Group slots by date
function groupByDate(slots: ReturnType<typeof generateSlots>) {
  const map: Record<string, typeof slots> = {};
  for (const s of slots) {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  }
  return map;
}

function ScheduleContent() {
  const router = useRouter();
  const params = useSearchParams();
  const studentId = params.get("student") || "";
  const sessionId = params.get("session") || "";

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"student" | "counsellor">("student");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [note, setNote] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<{ iso: string; label: string; date: string } | null>(null);
  const [activeDate, setActiveDate] = useState<string>("");

  const slots = generateSlots();
  const grouped = groupByDate(slots);
  const dates = Object.keys(grouped);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user) return;
      setUserId(data.user.id);

      const { data: prof } = await insforge.database
        .from("student_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      setUserRole((prof as any)?.role === "counsellor" ? "counsellor" : "student");
    });
    if (dates.length > 0) setActiveDate(dates[0]);
  }, []);

  const handleBook = async () => {
    if (!selected || !userId) return;
    setBooking(true);

    const slot = slots.find(s => s.iso === selected);
    if (!slot) { setBooking(false); return; }

    // Write the appointment to the DB as a session note/update
    const targetStudent = userRole === "counsellor" ? studentId : userId;
    const targetCounsellor = userRole === "counsellor" ? userId : "counsellor";

    if (sessionId) {
      // Update existing session with scheduled time
      await insforge.database
        .from("counsellor_sessions")
        .update({
          notes: `Session scheduled for ${slot.label} on ${new Date(slot.iso).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}. ${note ? `Note: ${note}` : ""}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } else {
      // Create new session with scheduled info
      await insforge.database.from("counsellor_sessions").insert([{
        student_id: targetStudent || userId,
        counsellor_id: targetCounsellor,
        status: "scheduled",
        risk_level: "Minimal",
        notes: `Scheduled for ${slot.label} on ${new Date(slot.iso).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}. ${note ? `Note: ${note}` : ""}`,
        student_name: userRole === "counsellor" ? (studentId || "Student") : "Student",
      }]);
    }

    // Notify the other party
    if (userRole === "counsellor" && studentId) {
      await insforge.database.from("notifications").insert([{
        user_id: studentId,
        title: "Session Scheduled",
        body: `Your counsellor has booked a session for ${slot.label} on ${new Date(slot.iso).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}.`,
        type: "info",
        link: "/schedule",
      }]);
    } else {
      await insforge.database.from("notifications").insert([{
        user_id: "counsellor",
        title: "Session Request",
        body: `A student has requested a session at ${slot.label} on ${new Date(slot.iso).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}.`,
        type: "info",
        link: "/counsellor",
      }]);
    }

    setBookedDetails({ iso: slot.iso, label: slot.label, date: slot.date });
    setBooked(true);
    setBooking(false);
  };

  if (booked && bookedDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Navbar variant={userRole} />
        <main className="flex-1 pt-16 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined icon-fill text-secondary text-[36px]">event_available</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Session Booked</h2>
            <p className="text-on-surface-variant text-sm mb-4">
              {new Date(bookedDetails.iso).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="bg-primary-container/30 border border-primary-fixed-dim rounded-xl p-4 mb-6">
              <p className="text-xl font-black text-primary">{bookedDetails.label}</p>
              <p className="text-xs text-on-surface-variant mt-1">30-minute session · Online</p>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              {userRole === "counsellor"
                ? "The student has been notified via their notification panel."
                : "Your counsellor has been notified and will confirm shortly."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href={userRole === "counsellor" ? "/counsellor" : "/dashboard"}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90">
                Go to Dashboard
              </Link>
              <Link href="/messages"
                className="px-5 py-2.5 border border-outline-variant text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors">
                Open Chat
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar variant={userRole} />
      <main className="flex-1 pt-16 px-4 md:px-20 py-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link href={userRole === "counsellor" ? "/counsellor" : "/dashboard"}
                className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </Link>
              <h1 className="text-3xl font-bold text-on-surface">Schedule a Session</h1>
            </div>
            <p className="text-sm text-on-surface-variant ml-8">
              {userRole === "counsellor"
                ? `Booking for ${studentId || "student"} · 30-minute sessions`
                : "Request a session with your counsellor · 30-minute slots"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Next 7 working days
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Date selector */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Select Date</h3>
            <div className="flex flex-col gap-2">
              {dates.map(date => (
                <button key={date} onClick={() => setActiveDate(date)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    activeDate === date
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary hover:bg-primary-container/20"
                  }`}>
                  <span>{new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeDate === date ? "bg-on-primary/20" : "bg-surface-container text-on-surface-variant"}`}>
                    {grouped[date].length} slots
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-on-surface mb-3">
              {activeDate
                ? `Available times — ${new Date(activeDate + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}`
                : "Select a date"}
            </h3>

            {activeDate && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                {grouped[activeDate].map(slot => (
                  <button key={slot.iso} onClick={() => { setSelected(slot.iso); setSelectedLabel(`${slot.label} · ${new Date(slot.date + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}`); }}
                    className={`py-3 px-2 rounded-xl border text-sm font-semibold transition-all ${
                      selected === slot.iso
                        ? "bg-primary text-on-primary border-primary shadow-md scale-105"
                        : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary hover:bg-primary-container/20"
                    }`}>
                    {slot.label}
                  </button>
                ))}
              </div>
            )}

            {/* Selected slot preview + note */}
            {selected && (
              <div className="bg-primary-container/20 border border-primary-fixed-dim rounded-2xl p-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined icon-fill text-primary text-[28px]">event</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{selectedLabel}</p>
                    <p className="text-xs text-on-surface-variant">30-minute session · Online / In-person</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={userRole === "counsellor" ? "e.g. Follow-up on PHQ-9 results, review safety plan…" : "e.g. I'd like to discuss my anxiety, exams are coming up…"}
                    rows={2}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button onClick={handleBook} disabled={booking}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                  {booking ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                      Booking…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense>
      <ScheduleContent />
    </Suspense>
  );
}
