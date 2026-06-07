export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-sm text-foreground leading-relaxed">
      <h1 className="text-3xl font-bold font-heading mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-10">Last updated: June 2026</p>

      <section className="flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. What we collect</h2>
          <p>When you create an account, we receive your name and email address. We store the campaigns, contacts, sending settings, and email sends you create while using MailHQ.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. How we use your data</h2>
          <p>Your data is used solely to provide the MailHQ service — managing your contacts, sending campaigns, and tracking outcomes. We do not sell or share your data with third parties.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Third-party services</h2>
          <p>MailHQ uses the following services to operate:</p>
          <ul className="list-disc list-inside mt-2 flex flex-col gap-1 text-muted-foreground">
            <li>Supabase — database and authentication</li>
            <li>Resend — email delivery</li>
            <li>Anthropic — AI drafting</li>
            <li>Vercel — hosting</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Data retention</h2>
          <p>Your data is retained for as long as your account is active. You can request deletion of your account and all associated data by contacting us.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Contact</h2>
          <p>For any privacy-related questions, contact us at <a href="mailto:privacy@mailhq.app" className="text-orange-500 hover:underline">privacy@mailhq.app</a>.</p>
        </div>
      </section>
    </div>
  );
}
