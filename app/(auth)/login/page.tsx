"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <div className="card p-8 w-full max-w-sm flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium font-heading">MailHQ</h1>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Password
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <SubmitButton />
      </form>

      <p className="text-sm text-muted-foreground">
        New to MailHQ?{" "}
        <Link href="/signup" className="text-orange-500 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-primary w-full py-2.5" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
