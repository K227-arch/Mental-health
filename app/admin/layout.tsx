import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img
          src="/logo.jpeg"
          alt=""
          className="w-64 h-64 md:w-[500px] md:h-[500px] object-contain opacity-[0.04]"
        />
      </div>
      <Navbar variant="admin" />
      <div className="flex flex-1 pt-16 h-full overflow-hidden relative z-10">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-surface/95 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
