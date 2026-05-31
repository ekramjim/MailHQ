"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signup(formData);
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
        <p className="text-muted-foreground text-sm mt-1">Create your account</p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label">Name</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Your name"
            className="input"
          />
        </div>

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
            minLength={6}
            className="input"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary py-2.5">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-mint hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
