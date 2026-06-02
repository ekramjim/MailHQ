export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-orange-500 p-12 text-white">
        <div className="text-2xl font-bold font-heading">MailHQ</div>

        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold font-heading leading-tight">
            Cold outreach,<br />done right.
          </h1>
          <p className="text-orange-100 text-lg leading-relaxed">
            Send personalised email campaigns to your contacts, track replies, and close more deals — all in one place.
          </p>

          <div className="flex flex-col gap-4 mt-2">
            {[
              { title: "AI-personalised emails", desc: "Auto-draft unique emails for every contact in seconds." },
              { title: "Campaign tracking", desc: "See who replied, who's interested, and who booked a meeting." },
              { title: "Simple contact management", desc: "Import your list and start sending in minutes." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-white shrink-0" />
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-orange-100 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-orange-200 text-sm">Built for founders, sales teams, and anyone who sends cold email.</p>
      </div>

      {/* Right — auth card */}
      <div className="flex flex-1 items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
