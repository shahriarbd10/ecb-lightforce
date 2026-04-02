"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Failed to send password reset email.");
        return;
      }

      setMessage(data?.message || "If the account exists, reset link is sent.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-page">
      <div className="mx-auto max-w-xl">
        <section className="glass-panel p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="mt-2 text-white/75">Enter your registered email and we will send a secure reset link.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block space-y-1">
              <span className="text-sm text-white/80">Registered Email</span>
              <input className="input" name="email" type="email" required />
            </label>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-4 text-sm text-white/70">
            Remembered your password?{" "}
            <Link href="/login" className="text-pitch-300 underline">
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
