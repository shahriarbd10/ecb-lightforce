"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const cb = url.searchParams.get("callbackUrl");
    if (cb) setCallbackUrl(normalizeCallbackPath(cb));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl
      });

      setLoading(false);
      if (!result || result.error) {
        setError("Login failed. Check email/password, and ensure NEXTAUTH_URL matches this port.");
        return;
      }

      const safePath = normalizeCallbackPath(callbackUrl);
      window.location.assign(`${window.location.origin}${safePath}`);
    } catch {
      setLoading(false);
      setError("Network/auth error. Restart server and verify NEXTAUTH_URL uses current port.");
    }
  }

  return (
    <main className="container-page">
      <div className="mx-auto max-w-3xl">
        <section className="glass-panel relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-pitch-300/25 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">ECB Player Access</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Login To Your Football Dashboard</h1>
          <p className="mt-3 text-white/75">
            Track performance, update availability, and stay visible in ECB Hub.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block space-y-1">
              <span className="text-sm text-white/80">Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-white/80">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-sm text-white/70">
            New player?{" "}
            <Link href="/register" className="text-pitch-300 underline">
              Create account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function normalizeCallbackPath(input: string) {
  try {
    const parsed = new URL(input, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/dashboard";
  } catch {
    return input.startsWith("/") ? input : "/dashboard";
  }
}
