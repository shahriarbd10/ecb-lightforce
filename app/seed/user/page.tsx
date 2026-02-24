"use client";

import { FormEvent, useState } from "react";

export default function SeedUserPage() {
  const [form, setForm] = useState({
    seederKey: "",
    email: "player1@ecb.com",
    password: "Player@123456",
    name: "Player One",
    location: "Dhaka, Bangladesh",
    age: 22,
    heightCm: 170,
    weightKg: 65,
    foot: "right",
    positions: "CM,RW"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const payload = {
      ...form,
      positions: form.positions.split(",").map((p) => p.trim()).filter(Boolean)
    };

    const res = await fetch("/api/seed/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.message || "Seed failed.");
      return;
    }
    setMessage(data?.message || "User seeded.");
  }

  return (
    <main className="container-page max-w-2xl">
      <h1 className="text-3xl font-bold">Seed User (HTML)</h1>
      <p className="mt-2 text-white/75">Create a player account from UI.</p>
      <form onSubmit={onSubmit} className="glass-panel mt-6 space-y-3 p-5">
        <input className="input" placeholder="Seeder Key (if configured)" value={form.seederKey} onChange={(e) => setForm((s) => ({ ...s, seederKey: e.target.value }))} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
        <input className="input" placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" type="number" placeholder="Age" value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: Number(e.target.value) || 22 }))} />
          <input className="input" type="number" placeholder="Height cm" value={form.heightCm} onChange={(e) => setForm((s) => ({ ...s, heightCm: Number(e.target.value) || 170 }))} />
          <input className="input" type="number" placeholder="Weight kg" value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: Number(e.target.value) || 65 }))} />
        </div>
        <select className="input" value={form.foot} onChange={(e) => setForm((s) => ({ ...s, foot: e.target.value }))}>
          <option value="right">Right</option>
          <option value="left">Left</option>
          <option value="both">Both</option>
        </select>
        <input className="input" placeholder="Positions (comma separated)" value={form.positions} onChange={(e) => setForm((s) => ({ ...s, positions: e.target.value }))} />
        <button className="btn-primary" disabled={loading}>
          {loading ? "Seeding..." : "Seed User"}
        </button>
      </form>
      {message ? <p className="mt-3 text-pitch-300">{message}</p> : null}
      {error ? <p className="mt-3 text-red-300">{error}</p> : null}
    </main>
  );
}
