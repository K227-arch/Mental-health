import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const siteUrl = "https://www.selfcare.ug";
const siteName = "Selfcare Hub";
const siteDescription =
  "AI-powered, confidential mental health support and wellness management for university students. PHQ-9 screening, mood tracking, counsellor connect, and crisis support — available 24/7 in 4 languages.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Selfcare Hub — AI-Powered Student Mental Health Support",
    template: "%s | Selfcare Hub",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "mental health",
    "student wellness",
    "AI mental health screening",
    "PHQ-9 assessment",
    "university counselling",
    "mood tracking",
    "crisis support",
    "student mental health Uganda",
    "confidential counselling",
    "wellness support",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "health",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: "Selfcare Hub — AI-Powered Student Mental Health Support",
    description: siteDescription,
    images: [
      {
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "Selfcare Hub — Student Wellness System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selfcare Hub — AI-Powered Student Mental Health Support",
    description: siteDescription,
    images: ["/logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.jpeg",
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve on iOS — the mobile bottom
  // navigation relies on it to clear the home bar.
  viewportFit: "cover",
};

// Structured data for rich search results (Organization + WebSite).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/logo.jpeg`,
      description: siteDescription,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["en", "sw", "lg", "rny"],
    },
    {
      "@type": "MedicalWebPage",
      name: "Selfcare Hub — Student Mental Health Support",
      url: siteUrl,
      description: siteDescription,
      audience: {
        "@type": "MedicalAudience",
        audienceType: "University students",
      },
      about: {
        "@type": "MedicalCondition",
        name: "Mental health and wellbeing",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
