"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      setError("Missing reset token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not reset password.");
        return;
      }

      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="container-page">
        <div className="mx-auto max-w-xl">
          <section className="glass-panel p-6 md:p-8">
            <h1 className="text-3xl font-bold text-white">Invalid Reset Link</h1>
            <p className="mt-2 text-white/75">Reset token is missing or malformed.</p>
            <p className="mt-4 text-sm text-white/70">
              <Link href="/forgot-password" className="text-pitch-300 underline">
                Request a new reset link
              </Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="container-page">
      <div className="mx-auto max-w-xl">
        <section className="glass-panel p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-white/75">Set a new password for your ECB Lightforce account.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block space-y-1">
              <span className="text-sm text-white/80">New Password</span>
              <input
                className="input"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-white/80">Confirm Password</span>
              <input
                className="input"
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function ResetPasswordFallback() {
  return (
    <main className="container-page">
      <div className="mx-auto max-w-xl">
        <section className="glass-panel p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-white/75">Preparing secure reset form...</p>
        </section>
      </div>
    </main>
  );
}
