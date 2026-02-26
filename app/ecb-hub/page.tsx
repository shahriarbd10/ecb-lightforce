"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { BallIcon, BootIcon, WhistleIcon } from "@/components/FootballIcons";

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
  profilePhotoMeta?: { x?: number; y?: number; zoom?: number };
  photos: string[];
  headline: string;
  stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
  };
};

type HubPost = {
  id: string;
  type: "achievement" | "match_update" | "general";
  title: string;
  content: string;
  image?: string;
  createdAt: string;
  author: {
    name: string;
    slug: string;
    profilePhoto?: string;
    profilePhotoMeta?: { x?: number; y?: number; zoom?: number };
  };
};

type PreviewImage = { src: string; title: string; subtitle?: string };

export default function EcbHubPage() {
  const { data: session, status } = useSession();

  const [players, setPlayers] = useState<HubPlayer[]>([]);
  const [posts, setPosts] = useState<HubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [error, setError] = useState("");
  const [timelineError, setTimelineError] = useState("");

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSearch, setCompareSearch] = useState("");
  const [comparePosition, setComparePosition] = useState("");
  const [compareMinAge, setCompareMinAge] = useState("");
  const [compareMaxAge, setCompareMaxAge] = useState("");

  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);

  const [composer, setComposer] = useState({
    type: "general" as "achievement" | "match_update" | "general",
    title: "",
    content: "",
    image: ""
  });
  const [postSaving, setPostSaving] = useState(false);

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

    async function loadPlayers() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/players?${query}`, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;

        if (!res.ok) {
          setPlayers([]);
          setError(data?.message || "Could not load players.");
        } else {
          setPlayers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setPlayers([]);
          setError("Network error while loading players.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPlayers();
    return () => {
      mounted = false;
    };
  }, [query]);

  async function loadTimeline() {
    setTimelineLoading(true);
    setTimelineError("");
    try {
      const res = await fetch("/api/hub/posts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setPosts([]);
        setTimelineError(data?.message || "Could not load timeline.");
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      setPosts([]);
      setTimelineError("Network error while loading timeline.");
    } finally {
      setTimelineLoading(false);
    }
  }

  useEffect(() => {
    loadTimeline();
  }, []);

  useEffect(() => {
    setSelectedPlayerIds((prev) => prev.filter((id) => players.some((p) => p.id === id)).slice(0, 4));
  }, [players]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewImage(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectedPlayers = useMemo(() => {
    const order = new Map(selectedPlayerIds.map((id, idx) => [id, idx]));
    return players
      .filter((player) => selectedPlayerIds.includes(player.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .slice(0, 4);
  }, [players, selectedPlayerIds]);

  const compareCandidates = useMemo(() => {
    return players.filter((player) => {
      if (comparePosition && !player.positions.some((p) => p.toLowerCase() === comparePosition.toLowerCase())) {
        return false;
      }
      if (compareSearch) {
        const q = compareSearch.toLowerCase();
        const hay = `${player.name} ${player.location} ${player.headline} ${(player.positions || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (compareMinAge && player.age < Number(compareMinAge)) return false;
      if (compareMaxAge && player.age > Number(compareMaxAge)) return false;
      return true;
    });
  }, [players, comparePosition, compareSearch, compareMinAge, compareMaxAge]);

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

  function toggleSelection(id: string) {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 4) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  async function uploadPostImage(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setTimelineError("Image must be 10 MB or less.");
      return;
    }

    const signRes = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "ecb-lightforce/hub-posts", purpose: "hub-post" })
    });
    const signData = await signRes.json().catch(() => ({}));
    if (!signRes.ok) throw new Error(signData?.message || "Could not get upload signature.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", String(signData.timestamp));
    formData.append("folder", signData.folder);
    formData.append("public_id", signData.publicId);
    formData.append("signature", signData.signature);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });
    const uploaded = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !uploaded?.secure_url) {
      throw new Error(uploaded?.error?.message || "Image upload failed.");
    }

    setComposer((s) => ({ ...s, image: String(uploaded.secure_url) }));
  }

  async function publishPost() {
    setPostSaving(true);
    setTimelineError("");
    try {
      const res = await fetch("/api/hub/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composer)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTimelineError(data?.message || "Could not publish post.");
        return;
      }
      setComposer({ type: "general", title: "", content: "", image: "" });
      await loadTimeline();
    } finally {
      setPostSaving(false);
    }
  }

  const topPlayers = players.slice(0, 6);
  const canPost = status === "authenticated" && session?.user?.role === "player";

  return (
    <main className="container-page relative pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_20%,rgba(95,141,255,0.24),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(191,82,112,0.14),transparent_32%),linear-gradient(130deg,#060d20_0%,#112957_52%,#070d1f_100%)]" />

      <section className="glass-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pitch-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Elite Player Hub</p>
        <h1 className="mt-2 inline-flex items-center gap-3 text-4xl font-black tracking-tight text-white md:text-6xl">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 md:h-14 md:w-14">
            <BallIcon size={24} className="text-pitch-200 md:h-7 md:w-7" />
          </span>
          Lightforce Hub
        </h1>
        <p className="mt-3 max-w-3xl text-white/75">
          Premium player discovery, side-by-side comparison, and a live timeline where players publish achievements and match updates.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <input className="input md:col-span-2" placeholder="Search player, location, role" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input" placeholder="Position (CM, ST)" value={position} onChange={(e) => setPosition(e.target.value)} />
          <input className="input" type="number" placeholder="Min age" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          <input className="input" type="number" placeholder="Max age" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-white/85">
            <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} />
            Available now only
          </label>
          <div className="flex items-center gap-3">
            <p className="text-xs text-white/60">{players.length} players visible</p>
            <button type="button" className="btn-primary" onClick={() => setCompareOpen((v) => !v)}>
              <WhistleIcon />
              {compareOpen ? "Close Compare" : "Compare Players"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-white">Top Player Cards</h2>
          <p className="text-xs text-white/60">Tap image to preview full photo</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <p className="text-white/70">Loading players...</p> : null}
          {!loading && error ? <p className="text-red-300">{error}</p> : null}
          {!loading && players.length === 0 ? <p className="text-white/70">No players found.</p> : null}

          {topPlayers.map((player, idx) => (
            <motion.article
              key={player.id}
              initial={{ opacity: 0, y: 18, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="group glass-panel relative overflow-hidden p-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(95,141,255,0.22),rgba(13,24,48,0.34)_42%,rgba(7,13,31,0.4))]" />

              <div className="relative border-b border-white/10">
                <div className="aspect-[4/3] overflow-hidden bg-[#0d1a34]">
                  {(player.profilePhoto || player.photos?.[0]) ? (
                    <button
                      type="button"
                      className="h-full w-full"
                      onClick={() =>
                        setPreviewImage({
                          src: player.profilePhoto || player.photos[0],
                          title: player.name,
                          subtitle: player.headline || "Football & Futsal Player"
                        })
                      }
                    >
                      <img
                        src={player.profilePhoto || player.photos[0]}
                        alt={player.name}
                        className={`h-full w-full transition duration-500 group-hover:scale-105 ${imageFitClass(player.profilePhoto || player.photos[0])}`}
                        style={photoStyle(player)}
                      />
                    </button>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/55">No photo</div>
                  )}
                </div>
                <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-pitch-200 backdrop-blur">
                  {player.availableNow ? "Available Now" : "Busy"}
                </div>
              </div>

              <div className="relative p-4">
                <h3 className="text-xl font-semibold text-white">{player.name}</h3>
                <p className="mt-1 text-sm text-white/75">{player.headline || "Football & Futsal Player"}</p>
                <p className="mt-1 text-sm text-white/70">{player.location} | Age {player.age}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(player.positions || []).slice(0, 4).map((pos) => (
                    <span key={`${player.id}-${pos}`} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/90">
                      {pos}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Metric label="Goals" value={String(player.stats?.goals ?? 0)} />
                  <Metric label="Assists" value={String(player.stats?.assists ?? 0)} />
                  <Metric label="Matches" value={String(player.stats?.matches ?? 0)} />
                  <Metric label="CS" value={String(player.stats?.cleanSheets ?? 0)} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-white/60">{player.heightCm} cm | {player.weightKg} kg</p>
                  <Link href={`/players/${player.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-pitch-200 underline underline-offset-4">
                    <BootIcon size={13} />
                    View Profile
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {compareOpen ? (
        <section className="glass-panel mt-8 p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Compare Engine</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Select Players For Comparison</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <input className="input md:col-span-2" placeholder="Search compare list" value={compareSearch} onChange={(e) => setCompareSearch(e.target.value)} />
            <input className="input" placeholder="Position" value={comparePosition} onChange={(e) => setComparePosition(e.target.value)} />
            <input className="input" type="number" placeholder="Min age" value={compareMinAge} onChange={(e) => setCompareMinAge(e.target.value)} />
            <input className="input" type="number" placeholder="Max age" value={compareMaxAge} onChange={(e) => setCompareMaxAge(e.target.value)} />
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {compareCandidates.slice(0, 30).map((player) => {
              const selected = selectedPlayerIds.includes(player.id);
              const disableAdd = !selected && selectedPlayerIds.length >= 4;
              return (
                <label
                  key={`pick-${player.id}`}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 ${selected ? "border-pitch-300/60 bg-pitch-300/10" : "border-white/10 bg-white/5"}`}
                >
                  <span className="text-sm text-white">{player.name} <span className="text-white/60">({player.age})</span></span>
                  <input type="checkbox" checked={selected} disabled={disableAdd} onChange={() => toggleSelection(player.id)} />
                </label>
              );
            })}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="glass-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-white/10 text-xs uppercase tracking-[0.14em] text-white/70">
                    <tr>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Goals</th>
                      <th className="px-4 py-3">Assists</th>
                      <th className="px-4 py-3">Matches</th>
                      <th className="px-4 py-3">Clean Sheets</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-soft p-4">
              <p className="text-sm font-semibold text-white">Stat Graph</p>
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
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="glass-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Live Feed Moved</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Timeline Is Now A Dedicated Page</h2>
          <p className="mt-2 text-white/75">
            Open the full Live Feed page for Facebook-style updates with likes and comments.
          </p>
          <div className="mt-4">
            <Link href="/live-feed" className="btn-primary">
              <BallIcon />
              Open Live Feed
            </Link>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {previewImage ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              className="glass-panel relative w-full max-w-5xl overflow-hidden p-0"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80" onClick={() => setPreviewImage(null)}>
                Close
              </button>
              <img src={previewImage.src} alt={previewImage.title} className="max-h-[78vh] w-full object-contain bg-black/30" />
              <div className="border-t border-white/10 p-4">
                <p className="text-base font-semibold text-white">{previewImage.title}</p>
                {previewImage.subtitle ? <p className="mt-1 text-xs text-pitch-200">{previewImage.subtitle}</p> : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
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

function imageFitClass(url: string) {
  const lower = String(url || "").toLowerCase();
  const isIllustration = lower.includes(".png") || lower.includes(".svg") || lower.includes("illustration");
  return isIllustration ? "object-contain p-2" : "object-cover";
}

function photoStyle(player: HubPlayer) {
  if (!player.profilePhoto) return undefined;
  const x = player.profilePhotoMeta?.x ?? 50;
  const y = player.profilePhotoMeta?.y ?? 50;
  const zoom = player.profilePhotoMeta?.zoom ?? 1;
  return { objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` };
}

function avatarStyle(meta?: { x?: number; y?: number; zoom?: number }) {
  const x = meta?.x ?? 50;
  const y = meta?.y ?? 50;
  const zoom = meta?.zoom ?? 1;
  return { objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` };
}

function formatDateTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
