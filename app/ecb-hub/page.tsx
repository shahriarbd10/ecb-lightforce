"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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
  profilePhoto?: string;
  photos: string[];
  headline: string;
  stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
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
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

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

  useEffect(() => {
    setSelectedPlayerIds((prev) => {
      const existing = prev.filter((id) => players.some((p) => p.id === id));
      if (existing.length) return existing.slice(0, 4);
      return players.slice(0, 4).map((p) => p.id);
    });
  }, [players]);

  const selectedPlayers = useMemo(() => {
    const order = new Map(selectedPlayerIds.map((id, idx) => [id, idx]));
    return players
      .filter((player) => selectedPlayerIds.includes(player.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .slice(0, 4);
  }, [players, selectedPlayerIds]);

  const maxMetric = useMemo(() => {
    if (!selectedPlayers.length) return 1;
    const values = selectedPlayers.flatMap((p) => [
      p.stats?.goals ?? 0,
      p.stats?.assists ?? 0,
      p.stats?.matches ?? 0,
      p.stats?.cleanSheets ?? 0
    ]);
    return Math.max(1, ...values);
  }, [selectedPlayers]);

  const commonPositions = useMemo(() => {
    const freq = new Map<string, number>();
    selectedPlayers.forEach((player) => {
      player.positions.forEach((pos) => {
        freq.set(pos, (freq.get(pos) || 0) + 1);
      });
    });
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [selectedPlayers]);

  function toggleSelection(id: string) {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  return (
    <main className="container-page relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(26,219,101,0.18),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.1),transparent_28%)]" />

      <section className="glass-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-pitch-300/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Lightforce Discovery</p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">Lightforce Hub</h1>
        <p className="mt-3 max-w-3xl text-white/75">
          Explore verified player profiles from local grounds, schools, colleges, and universities. Filter quickly and scout confidently.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <input
            className="input md:col-span-2"
            placeholder="Search by location, headline, position"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="input"
            placeholder="Position (CM, ST, GK)"
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-white/85">
            <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} />
            Show available now only
          </label>
          <p className="text-xs text-white/60">{players.length} profiles visible</p>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-white/70">Loading player profiles...</p> : null}
        {!loading && error ? <p className="text-red-300">{error}</p> : null}
        {!loading && players.length === 0 ? <p className="text-white/70">No players found with this filter.</p> : null}

        {players.map((player, idx) => (
          <motion.article
            key={player.id}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            className={`group glass-panel relative overflow-hidden p-0 ${selectedPlayerIds.includes(player.id) ? "ring-2 ring-pitch-300/70" : ""}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_8%,rgba(255,255,255,0.13),transparent_30%),linear-gradient(170deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />

            <div className="relative overflow-hidden border-b border-white/10">
              <div className="aspect-[4/3] w-full bg-black/20">
                {player.profilePhoto || player.photos?.[0] ? (
                  <img
                    src={player.profilePhoto || player.photos[0]}
                    alt={`${player.name} profile`}
                    className={`h-full w-full transition duration-500 group-hover:scale-105 ${imageFitClass(player.profilePhoto || player.photos[0])}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-white/55">No photo</div>
                )}
              </div>

              <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-pitch-200 backdrop-blur">
                {player.availableNow ? "Available Now" : "Busy"}
              </div>
            </div>

            <div className="relative p-4">
              <h2 className="text-xl font-semibold text-white">{player.name}</h2>
              <p className="mt-1 text-sm text-white/70">{player.headline || "Football & Futsal Player"}</p>
              <p className="mt-2 text-sm text-white/75">{player.location} | Age {player.age}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(player.positions || []).slice(0, 4).map((pos) => (
                  <span key={`${player.id}-${pos}`} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/85">
                    {pos}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Metric label="Goals" value={String(player.stats?.goals ?? 0)} />
                <Metric label="Assists" value={String(player.stats?.assists ?? 0)} />
                <Metric label="Matches" value={String(player.stats?.matches ?? 0)} />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-white/60">{player.heightCm} cm | {player.weightKg} kg</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelection(player.id)}
                    className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-white/85"
                  >
                    {selectedPlayerIds.includes(player.id) ? "Selected" : "Compare"}
                  </button>
                  <Link href={`/players/${player.slug}`} className="text-sm font-medium text-pitch-200 underline underline-offset-4">
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <div className="glass-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Comparison Studio</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Player Comparison Table And Graphs</h2>
          <p className="mt-2 text-sm text-white/70">
            Select up to 4 players from cards above. Compare common stats and positional profile side by side.
          </p>
        </div>

        {selectedPlayers.length === 0 ? (
          <div className="glass-panel p-5 text-sm text-white/70">Select players to start comparison.</div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-white/10 text-xs uppercase tracking-[0.14em] text-white/70">
                    <tr>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Goals</th>
                      <th className="px-4 py-3">Assists</th>
                      <th className="px-4 py-3">Matches</th>
                      <th className="px-4 py-3">Clean Sheets</th>
                      <th className="px-4 py-3">Positions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlayers.map((player) => (
                      <tr key={`cmp-${player.id}`} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium text-white">{player.name}</td>
                        <td className="px-4 py-3 text-white/85">{player.stats?.goals ?? 0}</td>
                        <td className="px-4 py-3 text-white/85">{player.stats?.assists ?? 0}</td>
                        <td className="px-4 py-3 text-white/85">{player.stats?.matches ?? 0}</td>
                        <td className="px-4 py-3 text-white/85">{player.stats?.cleanSheets ?? 0}</td>
                        <td className="px-4 py-3 text-white/80">{(player.positions || []).join(", ") || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-panel p-4">
                <p className="text-sm font-semibold text-white">Stats Visualization</p>
                <div className="mt-3 space-y-4">
                  {selectedPlayers.map((player) => (
                    <div key={`bars-${player.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="mb-2 text-sm font-medium text-white">{player.name}</p>
                      <Bar label="Goals" value={player.stats?.goals ?? 0} max={maxMetric} />
                      <Bar label="Assists" value={player.stats?.assists ?? 0} max={maxMetric} />
                      <Bar label="Matches" value={player.stats?.matches ?? 0} max={maxMetric} />
                      <Bar label="Clean Sheets" value={player.stats?.cleanSheets ?? 0} max={maxMetric} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-4">
                <p className="text-sm font-semibold text-white">Common Positions</p>
                <div className="mt-3 space-y-2">
                  {commonPositions.length === 0 ? (
                    <p className="text-sm text-white/65">No shared position tags yet.</p>
                  ) : (
                    commonPositions.map(([pos, count]) => (
                      <div key={`pos-${pos}`} className="flex items-center gap-3">
                        <p className="w-16 text-xs text-white/75">{pos}</p>
                        <div className="h-2 flex-1 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-pitch-300"
                            style={{ width: `${Math.max(8, (count / selectedPlayers.length) * 100)}%` }}
                          />
                        </div>
                        <p className="w-8 text-right text-xs text-white/80">{count}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs text-white/75">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-pitch-300 transition-all" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-2 text-center">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function imageFitClass(url: string) {
  const lower = String(url || "").toLowerCase();
  const isIllustration = lower.includes(".png") || lower.includes(".svg") || lower.includes("illustration");
  return isIllustration ? "object-contain p-2" : "object-cover";
}
