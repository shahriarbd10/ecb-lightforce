"use client";

import { FormEvent, useState } from "react";

type MailResult = {
  message?: string;
  target?: string;
  preview?: boolean;
  total?: number;
  sent?: number;
  failed?: number;
  failures?: Array<{ email: string; reason: string }>;
};

export default function AdminUserUpdateMailer() {
  const [testEmail, setTestEmail] = useState("");
  const [bulkLimit, setBulkLimit] = useState("50");
  const [role, setRole] = useState<"player" | "org" | "all">("player");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MailResult | null>(null);

  async function callMailer(payload: Record<string, any>) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/user-update-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not process mailing action.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error while sending request.");
    } finally {
      setLoading(false);
    }
  }

  async function onPreviewBulk(e: FormEvent) {
    e.preventDefault();
    await callMailer({
      preview: true,
      limit: Number(bulkLimit || 50),
      role
    });
  }

  async function onSendBulk() {
    await callMailer({
      limit: Number(bulkLimit || 50),
      role
    });
  }

  async function onSendTest() {
    if (!testEmail.trim()) {
      setError("Enter a test email first.");
      return;
    }
    await callMailer({ testEmail: testEmail.trim() });
  }

  return (
    <section className="mt-6 glass-panel p-5 md:p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">User Engagement Mail</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Send Friendly Feature Update Mail</h2>
      <p className="mt-2 text-sm text-white/75">
        Send a warm, non-technical update email to existing users so they know what they can do on ECB Lightforce.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs text-white/70">Target Role</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as "player" | "org" | "all")}> 
            <option value="player">Players</option>
            <option value="org">Organizations</option>
            <option value="all">All (player + org)</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-white/70">Bulk Limit</span>
          <input
            className="input"
            type="number"
            min={1}
            max={200}
            value={bulkLimit}
            onChange={(e) => setBulkLimit(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-white/70">Test Email</span>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </label>
      </div>

      <form onSubmit={onPreviewBulk} className="mt-4 flex flex-wrap gap-3">
        <button className="btn-muted" type="submit" disabled={loading}>
          {loading ? "Processing..." : "Preview Bulk"}
        </button>
        <button className="btn-primary" type="button" onClick={onSendBulk} disabled={loading}>
          {loading ? "Sending..." : "Send Bulk Mail"}
        </button>
        <button className="btn-muted" type="button" onClick={onSendTest} disabled={loading}>
          {loading ? "Sending..." : "Send Test Mail"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {result ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/85">
          <p>{result.message || "Request completed."}</p>
          {typeof result.total === "number" ? <p className="mt-1">Total: {result.total}</p> : null}
          {typeof result.sent === "number" ? <p>Sent: {result.sent}</p> : null}
          {typeof result.failed === "number" ? <p>Failed: {result.failed}</p> : null}
          {Array.isArray(result.failures) && result.failures.length ? (
            <div className="mt-2">
              <p className="text-xs uppercase tracking-[0.1em] text-white/65">Top failures</p>
              <ul className="mt-1 space-y-1 text-xs text-red-200">
                {result.failures.slice(0, 5).map((f) => (
                  <li key={`${f.email}-${f.reason}`}>{f.email}: {f.reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
