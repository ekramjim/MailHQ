import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="card p-8 max-w-md w-full flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">v0.1.0</span>
          <h1 className="text-4xl font-medium font-heading">
            MailHQ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personal outreach management — write, send, and track bulk emails with AI.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/signup" className="btn-primary w-full py-2.5 text-center">
            Get Started
          </Link>
          <Link href="/login" className="btn-secondary w-full py-2.5 text-center">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
