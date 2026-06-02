export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-sm text-foreground leading-relaxed">
      <h1 className="text-3xl font-bold font-heading mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-10">Last updated: June 2026</p>

      <section className="flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance</h2>
          <p>By using MailHQ, you agree to these terms. If you do not agree, do not use the service.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Use of the service</h2>
          <p>MailHQ is a tool for sending cold outreach emails. You agree to use it responsibly and in compliance with applicable laws, including anti-spam regulations (CAN-SPAM, GDPR, etc.).</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Prohibited use</h2>
          <p>You may not use MailHQ to send spam, harassing messages, or any content that violates applicable laws. We reserve the right to suspend accounts that violate this policy.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Limitation of liability</h2>
          <p>MailHQ is provided as-is. We are not liable for any damages arising from your use of the service, including issues with email deliverability or data loss.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Changes</h2>
          <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Contact</h2>
          <p>Questions? Reach us at <a href="mailto:mailhq2026@gmail.com" className="text-orange-500 hover:underline">mailhq2026@gmail.com</a>.</p>
        </div>
      </section>
    </div>
  );
}
