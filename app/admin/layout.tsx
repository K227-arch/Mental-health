import Navbar from "../components/Navbar";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo.jpeg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.04]" />
      </div>
      <Navbar variant="counsellor" />
      <div className="flex flex-1 pt-16 h-full overflow-hidden relative z-10">
        {/* Admin Sidebar */}
        <aside className="hidden md:flex flex-col h-full p-3 border-r border-outline-variant bg-surface-container-low w-64 shrink-0">
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <img src="/logo.jpeg" alt="Selfcare Hub" className="w-10 h-10 object-contain rounded-lg shrink-0" />
            <div>
              <h2 className="text-sm font-black text-primary leading-tight">Admin Portal</h2>
              <p className="text-xs text-on-surface-variant">System Administrator</p>
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-1">
            {[
              { href: "/admin", label: "Overview", icon: "admin_panel_settings" },
              { href: "/admin/counsellors", label: "Counsellors", icon: "support_agent" },
              { href: "/admin/students", label: "All Students", icon: "groups" },
              { href: "/admin/alerts", label: "Pending Alerts", icon: "notifications_active" },
              { href: "/admin/analytics", label: "Analytics", icon: "monitoring" },
              { href: "/admin/reports", label: "Reports", icon: "description" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto bg-surface/95 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
