"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminPlayer = {
  id: string;
  userId: string;
  name: string;
  email: string;
  slug: string;
  location: string;
  age: number;
  positions: string[];
  availableNow: boolean;
};

const defaultPositions = ["GK", "CB", "LB", "RB", "CM", "DM", "AM", "LW", "RW", "ST"];

const initialForm = {
  name: "",
  email: "",
  password: "",
  location: "",
  age: "",
  heightCm: "",
  weightKg: "",
  foot: "right",
  headline: ""
};

export default function AdminPlayerManager() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["CM"]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPlayers() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/players", { cache: "no-store" });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      setPlayers([]);
      setError(data?.message || "Could not load players.");
    } else {
      setPlayers(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  function togglePosition(position: string) {
    setSelectedPositions((prev) => (prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, positions: selectedPositions })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data?.message || "Could not create player.");
      return;
    }

    setNotice("Player added successfully.");
    setForm(initialForm);
    setSelectedPositions(["CM"]);
    await loadPlayers();
  }

  async function onDelete(player: AdminPlayer) {
    const ok = window.confirm(`Delete player ${player.name}? This removes account and profile permanently.`);
    if (!ok) return;

    const res = await fetch(`/api/admin/players/${player.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || "Could not delete player.");
      return;
    }

    setNotice(`Deleted ${player.name}.`);
    await loadPlayers();
  }

  return (
    <section className="mt-6 space-y-5">
      <div className="glass-panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">Player Management</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Add Or Delete Players</h2>
        <p className="mt-2 text-sm text-white/70">Admin-only actions. Deleting removes both user account and profile.</p>
      </div>

      <form onSubmit={onCreate} className="glass-panel grid gap-3 p-5 md:grid-cols-2 md:p-6">
        <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
        <input className="input" placeholder="Headline (optional)" value={form.headline} onChange={(e) => setForm((s) => ({ ...s, headline: e.target.value }))} />
        <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} required />
        <input className="input" placeholder="Age" type="number" min={8} max={60} value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))} required />
        <input className="input" placeholder="Height cm" type="number" min={100} max={250} value={form.heightCm} onChange={(e) => setForm((s) => ({ ...s, heightCm: e.target.value }))} required />
        <input className="input" placeholder="Weight kg" type="number" min={30} max={200} value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} required />
        <select className="input" value={form.foot} onChange={(e) => setForm((s) => ({ ...s, foot: e.target.value }))}>
          <option value="right">Right</option>
          <option value="left">Left</option>
          <option value="both">Both</option>
        </select>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm text-white/80">Positions</p>
          <div className="flex flex-wrap gap-2">
            {defaultPositions.map((pos) => (
              <button key={pos} type="button" onClick={() => togglePosition(pos)} className={selectedPositions.includes(pos) ? "btn-primary" : "btn-muted"}>
                {pos}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary md:col-span-2" disabled={saving}>
          {saving ? "Adding player..." : "Add Player"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {notice ? <p className="text-sm text-pitch-200">{notice}</p> : null}

      <div className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-semibold text-white">Existing Players</h3>
        {loading ? <p className="mt-3 text-white/70">Loading players...</p> : null}
        {!loading && players.length === 0 ? <p className="mt-3 text-white/70">No players found.</p> : null}
        <div className="mt-3 space-y-2">
          {players.map((player) => (
            <div key={player.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="font-medium text-white">{player.name}</p>
                <p className="text-xs text-white/70">{player.email} | {player.location} | Age {player.age}</p>
              </div>
              <button type="button" className="btn-muted" onClick={() => onDelete(player)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
