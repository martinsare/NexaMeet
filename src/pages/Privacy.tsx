import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Link } from "react-router-dom";

const LAST_UPDATED = "July 1, 2026";

const sections = [
  {
    title: "1. Who We Are",
    body: `NexaMeet, Inc. ("NexaMeet", "we", "our", "us") operates the NexaMeet video conferencing platform at nexameet.dev and via our web application. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our Service.

If you have questions about this policy, contact us at privacy@nexameet.dev.`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect the following categories of information:

Account data — name, email address, and password (hashed) when you register; profile photo and job title if you choose to provide them.

Meeting data — meeting titles, participant lists, start/end times, duration, and any recordings or transcripts you generate. This data is stored only when you use these features.

AI-generated content — transcripts, summaries, decisions, and action items produced by our AI assistant. These are tied to your meeting and accessible only to authorized participants.

Usage data — pages visited, features used, clicks, device type, browser, operating system, and IP address — collected via server logs and analytics tools.

Payment data — billing name, address, and last-four digits of card. Full card numbers are processed by our payment provider (Stripe) and never stored on NexaMeet servers.

Communications — support tickets, emails, or chat messages you send to us.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use your information to:
• Create and maintain your account and manage authentication.
• Deliver, operate, and improve the Service, including AI note-taking features.
• Process payments and manage subscriptions.
• Send transactional emails (meeting reminders, receipts, security alerts).
• Send product updates and marketing communications (you can opt out at any time).
• Investigate and prevent fraud, abuse, or security incidents.
• Comply with legal obligations and enforce our Terms of Service.
• Aggregate and analyze usage patterns (in anonymous form) to improve the platform.`,
  },
  {
    title: "4. AI Transcription & Data Processing",
    body: `When you enable AI notes or live transcription, audio from your meeting is processed by our AI pipeline. This processing occurs on secure servers and the resulting transcript and summary are stored encrypted, associated with your meeting record.

We do not use the content of your meetings to train AI models without your explicit opt-in consent. You can delete transcripts and summaries at any time from your meeting history. Deletion is permanent and cannot be undone.`,
  },
  {
    title: "5. Sharing & Disclosure",
    body: `We do not sell your personal data. We may share your information with:

Service providers — third-party vendors who help us deliver the Service (cloud hosting, payment processing, email delivery, analytics). These providers are contractually bound to protect your data and may not use it for their own purposes.

Meeting participants — your name, avatar, and video/audio are visible to other participants in meetings you join or host. Transcripts are shared with all participants the host grants access to.

Legal authorities — when required by law, court order, or to protect NexaMeet's rights, property, or safety.

Business transfers — in the event of a merger, acquisition, or sale of assets, your data may be transferred. We will notify affected users before data is subject to a different privacy policy.`,
  },
  {
    title: "6. Data Retention",
    body: `We retain your account data for as long as your account is active, plus 90 days after deletion to allow account recovery. Meeting recordings and transcripts are retained until you delete them or close your account. Usage logs are retained for 12 months. Payment records are retained for 7 years as required by financial regulations.

After retention periods expire, data is securely deleted or anonymized.`,
  },
  {
    title: "7. Security",
    body: `We implement industry-standard security measures including:
• TLS encryption for all data in transit.
• AES-256 encryption for sensitive data at rest.
• Role-based access controls limiting employee access to your data.
• Regular security audits and penetration testing.
• SOC 2 Type II compliance (in progress).

No system is completely secure. If you discover a security vulnerability, please report it to security@nexameet.dev.`,
  },
  {
    title: "8. Cookies & Tracking",
    body: `We use cookies and similar technologies to:
• Keep you logged in across sessions (authentication cookies).
• Remember your preferences (functional cookies).
• Understand how you use the Service (analytics cookies — opt-out available in account settings).

We do not use third-party advertising cookies. You can disable cookies in your browser settings, but some features of the Service may not function correctly without them.`,
  },
  {
    title: "9. Your Rights",
    body: `Depending on your location, you may have the following rights regarding your personal data:

Access — request a copy of the personal data we hold about you.
Correction — request that we correct inaccurate data.
Deletion — request that we delete your data ("right to be forgotten").
Portability — request your data in a machine-readable format.
Objection — object to certain processing, including marketing.
Restriction — request that we limit processing in certain circumstances.

To exercise these rights, email privacy@nexameet.dev. We will respond within 30 days (or as required by applicable law). We may need to verify your identity before processing the request.`,
  },
  {
    title: "10. Children's Privacy",
    body: `NexaMeet is not intended for children under 16. We do not knowingly collect personal data from children under 16. If you believe we have inadvertently collected such data, please contact us immediately at privacy@nexameet.dev and we will delete it promptly.`,
  },
  {
    title: "11. International Transfers",
    body: `NexaMeet is based in the United States. If you are accessing the Service from outside the US, your data may be transferred to and processed in the US, which may have different data protection laws than your country.

For users in the European Economic Area (EEA) or United Kingdom, we rely on Standard Contractual Clauses (SCCs) and other appropriate safeguards for international data transfers.`,
  },
  {
    title: "12. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will post the revised policy on this page with an updated "Last updated" date. For material changes, we will notify you via email or an in-app banner at least 14 days before the change takes effect.`,
  },
  {
    title: "13. Contact Us",
    body: `For privacy inquiries, data requests, or to report a concern:

NexaMeet, Inc.
Privacy Team
privacy@nexameet.dev

For security concerns: security@nexameet.dev
For legal matters: legal@nexameet.dev`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-void-900">
      <Nav />

      <div className="mx-auto max-w-3xl px-6 py-20">
        {/* Header */}
        <div className="mb-12 border-b border-surface-border pb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-void-500">Legal</p>
          <h1 className="font-display text-4xl font-semibold text-white">Privacy Policy</h1>
          <p className="mt-3 text-sm text-void-400">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-void-300 leading-relaxed">
            Your privacy matters to us. This policy explains exactly what data we collect, why we collect it,
            and how you can control it. Also see our{" "}
            <Link to="/terms" className="text-signal-300 underline underline-offset-4 hover:text-white transition-colors">
              Terms of Service
            </Link>
            .
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.title} className="scroll-mt-24">
              <h2 className="font-display text-lg font-semibold text-white">{s.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-void-300">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-surface-border pt-8 text-sm text-void-400">
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <span>·</span>
          <a href="mailto:privacy@nexameet.dev" className="hover:text-white transition-colors">Contact privacy team</a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
