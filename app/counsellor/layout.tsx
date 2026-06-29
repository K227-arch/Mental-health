import Navbar from "../components/Navbar";
import CounsellorSidebar from "../components/CounsellorSidebar";

export default function CounsellorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Navbar variant="counsellor" />
      <div className="flex flex-1 pt-16 h-full overflow-hidden">
        <CounsellorSidebar />
        <main className="flex-1 overflow-y-auto bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}