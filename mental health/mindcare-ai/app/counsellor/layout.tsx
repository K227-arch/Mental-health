import Navbar from "../components/Navbar";
import CounsellorSidebar from "../components/CounsellorSidebar";

export default function CounsellorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative">
      {/* Logo Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo.jpeg" alt="" className="w-[500px] h-[500px] object-contain opacity-[0.06]" />
      </div>
      <Navbar variant="counsellor" />
      <div className="flex flex-1 pt-16 h-full overflow-hidden relative z-10">
        <CounsellorSidebar />
        <main className="flex-1 overflow-y-auto bg-surface/95 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
