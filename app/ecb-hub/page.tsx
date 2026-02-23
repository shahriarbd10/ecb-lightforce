"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HubPlayer = {
  id: string;
  slug: string;
  name: string;
  location: string;
  age: number;
  heightCm: number;
  weightKg: number;
  positions: string[];
  availableNow: boolean;
  photos: string[];
  headline: string;
  stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
  };
};

export default function EcbHubPage() {
  const [players, setPlayers] = useState<HubPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (position) p.set("position", position);
    if (availableNow) p.set("availableNow", "true");
    if (minAge) p.set("minAge", minAge);
    if (maxAge) p.set("maxAge", maxAge);
    return p.toString();
  }, [availableNow, maxAge, minAge, position, search]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/players?${query}`, { cache: "no-store" });
        const data = await res.json();
        if (mounted) {
          if (!res.ok) {
            setPlayers([]);
            setError(data?.message || "Could not load players.");
          } else {
            setPlayers(Array.isArray(data) ? data : []);
          }
        }
      } catch {
        if (mounted) {
          setPlayers([]);
          setError("Network error while loading players.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [query]);

  return (
    <main className="container-page">
      <h1 className="text-3xl font-semibold">ECB Hub</h1>
      <p className="mt-2 text-white/75">Find and filter active players from local communities and campuses.</p>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            className="input md:col-span-2"
            placeholder="Search by location/position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="input"
            placeholder="Position (CM)"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="Min age"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="Max age"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
          />
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-white/85">
          <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} />
          Show available now only
        </label>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <p className="text-white/70">Loading players...</p> : null}
        {!loading && error ? <p className="text-red-300">{error}</p> : null}
        {!loading && players.length === 0 ? <p className="text-white/70">No players found with this filter.</p> : null}

        {players.map((player) => (
          <article key={player.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            {player.photos?.[0] ? (
              <img
                src={player.photos[0]}
                alt={`${player.name} profile`}
                className="mb-3 h-40 w-full rounded-xl object-cover"
              />
            ) : null}
            <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">{player.availableNow ? "Available Now" : "Busy"}</p>
            <h2 className="mt-2 text-xl font-semibold">{player.name}</h2>
            <p className="text-sm text-white/70">{player.headline}</p>
            <p className="mt-1 text-sm text-white/75">
              {player.location} · Age {player.age}
            </p>
            <p className="mt-1 text-sm text-white/75">{player.positions.join(", ")}</p>
            <p className="mt-3 text-sm text-white/70">
              Goals: {player.stats?.goals ?? 0} · Assists: {player.stats?.assists ?? 0}
            </p>
            <Link href={`/players/${player.slug}`} className="mt-4 inline-block text-sm text-pitch-300 underline">
              View full profile
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
