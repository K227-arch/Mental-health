import Link from "next/link";
import Footer from "../components/Footer";

const sections = [
  {
    title: "Acceptance of Terms",
    content:
      "By accessing or using Selfcare Hub, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform. These terms apply to all users, including students, faculty, counsellors, and administrators. Continued use of the platform after any changes to these terms constitutes acceptance of the updated terms.",
  },
  {
    title: "Services",
    content:
      "Selfcare Hub provides AI-powered mental health screening, mood tracking, wellness resources, and crisis support tools for university students. Our services are designed to support — not replace — professional mental health care. The AI screening tool provides preliminary assessments only and should not be used as a diagnostic tool. In case of emergency, please contact emergency services or crisis hotlines directly.",
  },
  {
    title: "User Responsibilities",
    content:
      "Users agree to provide accurate information during screenings and check-ins. You are responsible for maintaining the confidentiality of your account credentials. Misuse of the platform, including submitting false information, attempting to access other users' data, or using the service for unauthorized purposes, may result in account termination. Users at risk of harm should seek immediate professional help rather than relying solely on this platform.",
  },
  {
    title: "Limitation of Liability",
    content:
      "Selfcare Hub and its operators shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the platform. The AI screening tool provides assessments based on self-reported data and may not capture the full complexity of an individual's mental health condition. Always consult qualified mental health professionals for medical decisions. We make no guarantees regarding the availability or reliability of the service.",
  },
  {
    title: "Contact",
    content:
      "For questions about these terms, please contact us at legal@mindcareai.app or write to: Selfcare Hub Legal, University Wellness Center, Kampala, Uganda. For technical support, reach out through the in-app help system or email support@mindcareai.app. We aim to respond to all inquiries within 48 hours.",
  },
];

export default function TermsOfService() {
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
              <span className="material-symbols-outlined text-[18px]">description</span>
              Terms of Service
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">
              How we serve you
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
            These terms govern your use of the Selfcare Hub Student Wellness System.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
