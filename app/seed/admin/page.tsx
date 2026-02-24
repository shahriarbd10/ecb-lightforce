"use client";

import { FormEvent, useState } from "react";

export default function SeedAdminPage() {
  const [form, setForm] = useState({
    seederKey: "",
    email: "admin@ecb.com",
    password: "Admin@123456",
    name: "ECB Admin",
    force: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/seed/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.message || "Seed failed.");
      return;
    }
    setMessage(data?.message || "Admin seeded.");
  }

  return (
    <main className="container-page max-w-2xl">
      <h1 className="text-3xl font-bold">Seed Admin (HTML)</h1>
      <p className="mt-2 text-white/75">Create or update admin account from UI.</p>
      <form onSubmit={onSubmit} className="glass-panel mt-6 space-y-3 p-5">
        <input className="input" placeholder="Seeder Key (if configured)" value={form.seederKey} onChange={(e) => setForm((s) => ({ ...s, seederKey: e.target.value }))} />
        <input className="input" placeholder="Admin email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
        <input className="input" placeholder="Admin password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
        <input className="input" placeholder="Admin name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        <label className="inline-flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={form.force} onChange={(e) => setForm((s) => ({ ...s, force: e.target.checked }))} />
          Force update existing admin
        </label>
        <button className="btn-primary" disabled={loading}>
          {loading ? "Seeding..." : "Seed Admin"}
        </button>
      </form>
      {message ? <p className="mt-3 text-pitch-300">{message}</p> : null}
      {error ? <p className="mt-3 text-red-300">{error}</p> : null}
    </main>
  );
}
