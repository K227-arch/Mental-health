import type { Metadata } from "next";
import "./globals.css";
import PushProvider from "./components/PushProvider";
import BubbleBackground from "./components/BubbleBackground";

export const metadata: Metadata = {
  title: "MindCare AI — Student Wellness System",
  description:
    "AI-powered mental health support and wellness management for university students.",
  keywords: "mental health, student wellness, AI screening, PHQ-9, university support",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        {/* Rising bubble background — fixed, behind all content */}
        <BubbleBackground />
        {/* Push notification SW + realtime crisis alerts for counsellors */}
        <PushProvider />
        {children}
      </body>
    </html>
  );
}
