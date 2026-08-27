import type { Metadata } from "next";

// Sign-in / sign-up / verification screens — no SEO value, keep out of indexes.
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
