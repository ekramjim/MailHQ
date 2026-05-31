"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 w-full max-w-sm flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">
          Mail<span className="text-mint">HQ</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Password</label>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="input"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary py-2.5">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="font-medium text-mint hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
