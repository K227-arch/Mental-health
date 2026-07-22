"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";

const ADMIN_EMAIL = "keithtwesigye74@gmail.com";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, counsellors: 0, criticalAlerts: 0, pendingTasks: 0 });
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d?.user) { router.push("/auth/sign-in"); return; }
      // Allow admin role OR the designated admin email
      if (d.user.role !== "administrator" && d.user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }
      setUser(d.user);
      loadData();
      setLoading(false);
    });
  }, []);

  const loadData = async () => {
    // Load students count
    const studentsRes = await fetch("/api/counsellor/students");
    if (studentsRes.ok) {
      const data = await studentsRes.json();
      const students = data.students || [];
      const criticalCount = students.filter((s: any) => s.riskLevel === "Critical").length;
      setCounsellors(students.filter((s: any) => s.role === "counsellor"));
      setStats({
        students: students.filter((s: any) => s.role !== "counsellor").length,
        counsellors: students.filter((s: any) => s.role === "counsellor").length,
        criticalAlerts: criticalCount,
        pendingTasks: criticalCount + students.filter((s: any) => s.q9Flagged).length,
      });
    }
    // Load notifications (pending tasks)
    const notifRes = await fetch("/api/notifications?userId=counsellor-system");
    if (notifRes.ok) {
      const data = await notifRes.json();
      setNotifications((data.notifications || []).slice(0, 10));
    }
  };

  const sendAlertToCounsellors = async (message: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "counsellor-system",
        title: "🔔 Admin Alert",
        body: message,
        type: "alert",
        link: "/counsellor",
      }),
    });
    alert("Alert sent to all counsellors.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
        Loading Admin Portal...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Admin Overview</h1>
          <p className="text-on-surface-variant mt-1">Welcome, {user?.name || "Administrator"}. Here's the platform status.</p>
        </div>
        <span className="text-xs bg-error-container text-on-error-container px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
          Admin Access
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.students, icon: "groups", color: "text-primary" },
          { label: "Counsellors", value: stats.counsellors, icon: "support_agent", color: "text-secondary" },
          { label: "Critical Alerts", value: stats.criticalAlerts, icon: "warning", color: "text-error" },
          { label: "Pending Tasks", value: stats.pendingTasks, icon: "pending_actions", color: "text-on-surface" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
              <span className="text-xs text-on-surface-variant font-medium">{s.label}</span>
            </div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-error-container/20 border border-error/20 rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">notifications_active</span>
            Alert Mental Health Professionals
          </h3>
          <p className="text-xs text-on-surface-variant mb-3">Send a system-wide alert to all counsellors about pending tasks.</p>
          <button
            onClick={() => sendAlertToCounsellors(`Admin alert: ${stats.pendingTasks} pending tasks require attention. Please review your student caseload.`)}
            className="w-full px-4 py-2.5 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Send Alert to Counsellors
          </button>
        </div>

        <div className="bg-primary-container/20 border border-primary/20 rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">monitoring</span>
            Platform Analytics
          </h3>
          <p className="text-xs text-on-surface-variant mb-3">View full system analytics and export reports.</p>
          <Link href="/admin/analytics" className="block w-full text-center px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            View Analytics
          </Link>
        </div>

        <div className="bg-secondary-container/20 border border-secondary/20 rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">support_agent</span>
            Manage Counsellors
          </h3>
          <p className="text-xs text-on-surface-variant mb-3">Oversee counsellor caseloads and availability.</p>
          <Link href="/admin/counsellors" className="block w-full text-center px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            View Counsellors
          </Link>
        </div>
      </div>

      {/* Pending Notifications */}
      {notifications.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">warning</span>
            Recent System Alerts & Pending Tasks
          </h3>
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border ${n.type === "critical" || n.type === "alert" ? "bg-error-container/10 border-error/20" : "bg-surface-container border-outline-variant/30"}`}>
                <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${n.type === "critical" || n.type === "alert" ? "text-error" : "text-primary"}`}>
                  {n.type === "critical" ? "emergency" : n.type === "alert" ? "warning" : "info"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{n.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {n.link && (
                  <Link href={n.link} className="text-xs text-primary font-medium shrink-0 hover:underline">View</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigate to counsellor view */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
        <h3 className="text-sm font-bold text-on-surface mb-2">Counsellor Dashboard Access</h3>
        <p className="text-xs text-on-surface-variant mb-3">As admin, you can also view the full counsellor portal for oversight.</p>
        <Link href="/counsellor" className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline">
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          Open Counsellor Dashboard
        </Link>
      </div>
    </div>
  );
}
