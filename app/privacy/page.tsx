import Link from "next/link";
import Footer from "../components/Footer";

const sections = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide when using Selfcare Hub, including screening responses, mood entries, and wellness check-in data. This may include your name, student ID, faculty, year of study, and self-reported mental health information. We also collect usage data such as feature interactions, session duration, and engagement patterns to improve our services. All screening and mood data is collected with your explicit consent and is anonymized where possible to protect your identity.",
  },
  {
    title: "How We Use Your Information",
    content:
      "Your information is used to provide personalized mental health support, including AI-powered screening analysis, mood tracking, wellness recommendations, and crisis detection. Aggregated, de-identified data may be used for research to improve student mental health outcomes. We do not share your personal information with third parties without your consent, except as required by law or in emergency situations where there is a risk of serious harm.",
  },
  {
    title: "Data Protection",
    content:
      "We implement industry-standard security measures to protect your data, including encryption in transit (TLS 1.3) and at rest (AES-256). Access to your data is restricted to authorized personnel only. Our infrastructure is hosted on secure, SOC 2-compliant servers. While we take every precaution, no system is completely immune to security breaches. We regularly audit our systems and update our practices to maintain the highest standards of data protection.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data at any time. You can request a copy of the data we hold about you, ask us to correct inaccurate information, or request deletion of your account and associated data. You may also withdraw consent for data processing at any time. To exercise these rights, contact our Data Protection Officer using the details below. We will respond to your request within 30 days.",
  },
  {
    title: "Contact",
    content:
      "If you have questions about this privacy policy or how we handle your data, please contact our Privacy Team at privacy@mindcareai.app or write to: Selfcare Hub Privacy, University Wellness Center, Kampala, Uganda. For immediate concerns about your data or account, you can also reach out through the in-app support system.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-20 h-16 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.jpeg" alt="Selfcare Hub" className="w-8 h-8 object-contain rounded-lg" />
          <span className="hidden sm:block font-black text-2xl text-primary">Selfcare Hub</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Home
        </Link>
      </nav>

      <main className="relative z-10 flex-1 pt-24 pb-12 px-6 md:px-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container text-sm font-semibold rounded-full mb-4">
              <span className="material-symbols-outlined text-[18px]">shield</span>
              Privacy Policy
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              Your privacy matters
            </h1>
            <p className="text-on-surface-variant text-sm">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section
                key={section.title}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm"
              >
                <h2 className="text-xl font-bold text-on-surface mb-3">
                  {section.title}
                </h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <p className="text-xs text-on-surface-variant/60 mt-8 text-center">
            This privacy policy is part of the Selfcare Hub Student Wellness System.
            By using our platform, you agree to the terms outlined here.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
