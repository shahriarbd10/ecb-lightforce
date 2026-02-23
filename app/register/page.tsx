"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const defaultPositions = ["GK", "CB", "LB", "RB", "CM", "DM", "AM", "LW", "RW", "ST"];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["CM"]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    age: "",
    heightCm: "",
    weightKg: "",
    foot: "right"
  });

  function togglePosition(position: string) {
    setSelectedPositions((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, positions: selectedPositions })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          process.env.NODE_ENV === "development" && data?.error
            ? `${data?.message || "Registration failed."} ${data.error}`
            : data?.message || "Registration failed."
        );
        return;
      }

      router.push("/login");
    } catch {
      setError("Network error: could not reach server. Confirm dev server is running and reload the page.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-page max-w-2xl">
      <h1 className="text-3xl font-semibold">Join ECB Lightforce</h1>
      <p className="mt-2 text-white/75">Register as a player and get listed in ECB Hub for exposure.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-white/80">Full Name</span>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Email</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Password</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Location</span>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
              placeholder="Dhaka, Bangladesh"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Age</span>
            <input
              className="input"
              type="number"
              min={8}
              max={60}
              value={form.age}
              onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Height (cm)</span>
            <input
              className="input"
              type="number"
              min={100}
              max={250}
              value={form.heightCm}
              onChange={(e) => setForm((s) => ({ ...s, heightCm: e.target.value }))}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Weight (kg)</span>
            <input
              className="input"
              type="number"
              min={30}
              max={200}
              value={form.weightKg}
              onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Preferred Foot</span>
            <select
              className="input"
              value={form.foot}
              onChange={(e) => setForm((s) => ({ ...s, foot: e.target.value }))}
              required
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="both">Both</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-white/80">Positions</p>
          <div className="flex flex-wrap gap-2">
            {defaultPositions.map((position) => {
              const active = selectedPositions.includes(position);
              return (
                <button
                  type="button"
                  key={position}
                  onClick={() => togglePosition(position)}
                  className={active ? "btn-primary" : "btn-muted"}
                >
                  {position}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button className="btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Create Player Account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/70">
        Already registered?{" "}
        <Link href="/login" className="text-pitch-300 underline">
          Login here
        </Link>
      </p>
    </main>
  );
}
