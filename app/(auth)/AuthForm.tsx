"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, {});
  const isSignup = mode === "signup";

  return (
    <form action={action} className="card space-y-4 p-6 sm:p-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">{isSignup ? "Let's start small" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isSignup ? "Free forever. No card needed." : "Your three things are waiting — no pressure."}
        </p>
      </div>

      {next && <input type="hidden" name="next" value={next} />}

      {isSignup && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">What should we call you?</span>
          <input name="name" className="input" autoComplete="given-name" defaultValue={state.name} required maxLength={60} />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input name="email" type="email" className="input" autoComplete="email" defaultValue={state.email} required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          className="input"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          {state.error}
        </p>
      )}

      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "One sec…" : isSignup ? "Create my account" : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>Already have an account? <Link className="font-medium text-accent underline-offset-2 hover:underline" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Log in</Link></>
        ) : (
          <>New here? <Link className="font-medium text-accent underline-offset-2 hover:underline" href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link></>
        )}
      </p>
    </form>
  );
}
