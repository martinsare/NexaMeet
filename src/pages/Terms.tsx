import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Link } from "react-router-dom";

const LAST_UPDATED = "July 1, 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using NexaMeet ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all visitors, users, and others who access the Service.

NexaMeet reserves the right to update or modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms. We will notify registered users of material changes via email or an in-app notice.`,
  },
  {
    title: "2. Description of Service",
    body: `NexaMeet provides an adaptive video conferencing platform with AI-assisted note-taking, live transcription, and meeting management tools. Features available to you depend on the plan you have subscribed to (Starter, Pro, or Business).

NexaMeet may update, modify, suspend, or discontinue any part of the Service at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuance.`,
  },
  {
    title: "3. User Accounts",
    body: `You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

You agree to notify NexaMeet immediately of any unauthorized use of your account. NexaMeet is not liable for any loss arising from unauthorized access to your account. You may not transfer your account to another person without our prior written consent.`,
  },
  {
    title: "4. Acceptable Use",
    body: `You agree not to use the Service to:
• Conduct, facilitate, or promote any unlawful activity.
• Harass, threaten, impersonate, or intimidate others.
• Transmit spam, malware, viruses, or any harmful code.
• Attempt to gain unauthorized access to any part of the Service or its related systems.
• Record, store, or distribute meeting content without the consent of all participants (where required by law).
• Violate any applicable local, national, or international law or regulation.

NexaMeet reserves the right to suspend or terminate accounts that violate these restrictions without notice or refund.`,
  },
  {
    title: "5. Meeting Recordings & Transcripts",
    body: `When you use NexaMeet's recording and transcription features, you are responsible for obtaining any legally required consent from meeting participants in your jurisdiction. NexaMeet provides tools to notify participants of recording (e.g., banners and notification sounds) but compliance with local recording-consent laws is solely your responsibility.

Recordings and transcripts are stored on NexaMeet's servers and are accessible to the host and any participants the host grants access to. You retain ownership of your meeting content; you grant NexaMeet a limited license to process, store, and transmit it solely to deliver the Service.`,
  },
  {
    title: "6. Intellectual Property",
    body: `The Service and its original content (excluding user-generated content), features, and functionality are and will remain the exclusive property of NexaMeet and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of NexaMeet.

You retain ownership of all content you create, upload, or transmit through the Service. By submitting content, you grant NexaMeet a non-exclusive, worldwide, royalty-free license to use, reproduce, and display that content solely as necessary to provide the Service.`,
  },
  {
    title: "7. Payments and Subscriptions",
    body: `Paid plans (Pro, Business) are billed on a monthly or annual basis depending on your selection. All fees are non-refundable except as expressly set forth in these Terms or required by applicable law.

Subscriptions auto-renew at the end of each billing period. You may cancel at any time; cancellation takes effect at the end of the current billing period and you retain access until then. NexaMeet may change pricing with 30 days' advance notice. Continued use of the Service after a price change constitutes acceptance.`,
  },
  {
    title: "8. Privacy",
    body: `Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using NexaMeet, you consent to the data practices described in the Privacy Policy.`,
  },
  {
    title: "9. Disclaimers",
    body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

NexaMeet does not warrant that the Service will be uninterrupted, error-free, or free of harmful components. We do not warrant that AI-generated summaries, transcripts, or action items will be accurate or complete — always review AI output before relying on it.`,
  },
  {
    title: "10. Limitation of Liability",
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEXAMEET AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.

IN NO EVENT SHALL NEXAMEET'S TOTAL LIABILITY TO YOU EXCEED THE AMOUNTS YOU PAID TO NEXAMEET IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.`,
  },
  {
    title: "11. Governing Law",
    body: `These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved exclusively in the state or federal courts located in Delaware.`,
  },
  {
    title: "12. Contact",
    body: `If you have questions about these Terms, please contact us at:

NexaMeet, Inc.
Legal Department
legal@nexameet.dev`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <div className="mx-auto max-w-3xl px-6 py-20">
        {/* Header */}
        <div className="mb-12 border-b border-border pb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Legal</p>
          <h1 className="font-display text-4xl font-semibold text-text">Terms of Service</h1>
          <p className="mt-3 text-sm text-text-muted">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-text-muted leading-relaxed">
            Please read these Terms of Service carefully before using NexaMeet. By accessing or using our
            platform, you agree to be bound by these terms. Also see our{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-4 hover:text-text transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.title} className="scroll-mt-24">
              <h2 className="font-display text-lg font-semibold text-text">{s.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-border pt-8 text-sm text-text-muted">
          <Link to="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/docs" className="hover:text-text transition-colors">Documentation</Link>
          <span>·</span>
          <a href="mailto:legal@nexameet.dev" className="hover:text-text transition-colors">Contact legal</a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
