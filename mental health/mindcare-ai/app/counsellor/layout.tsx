import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@insforge/sdk/ssr";
import Navbar from "../components/Navbar";
import CounsellorSidebar from "../components/CounsellorSidebar";

const ADMIN_EMAIL = "keithtwesigye74@gmail.com";

export default async function CounsellorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const client = createServerClient({
    cookies: cookieStore,
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });

  const { data, error } = await client.auth.getCurrentUser();
  const user = data?.user;

  if (error || !user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

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
