import { notFound } from "next/navigation";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import "@/lib/models/User";
import PlayerAchievementsGallery from "@/components/PlayerAchievementsGallery";

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();

  const player = await PlayerProfile.findOne({ slug }).populate("user", "name role").lean();
  if (!player || (player as any).user?.role !== "player") return notFound();

  const p: any = player;

  return (
    <main className="container-page">
      <section className="glass-panel relative overflow-hidden p-5 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pitch-300/20 blur-3xl" />
        <div className="grid gap-6 md:grid-cols-[230px_1fr] md:items-center">
          {(p.profilePhoto || (p.photos || [])[0]) ? (
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="h-56 w-full md:h-60 md:w-[230px]">
                <img
                  src={p.profilePhoto || p.photos[0]}
                  alt={`${p.user?.name || "Player"} profile`}
                  className={`h-full w-full ${imageFitClass(p.profilePhoto || p.photos[0])}`}
                  style={mainPhotoStyle(p)}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/60">
              No profile photo
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">{p.availableNow ? "Available Now" : "Not Available"}</p>
            <h1 className="mt-2 text-4xl font-bold text-white md:text-5xl">{p.user?.name || "Player"}</h1>
            <p className="mt-2 text-white/80">{p.headline || "Football & Futsal Player"}</p>
            <p className="mt-1 text-white/70">{p.location || "Location not set"}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(p.positions || []).map((pos: string) => (
                <span key={`hero-pos-${pos}`} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/90">
                  {pos}
                </span>
              ))}
              {!(p.positions || []).length ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/70">Position not set</span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Age" value={String(p.age || "-")} />
              <Stat label="Height" value={`${p.heightCm || "-"} cm`} />
              <Stat label="Weight" value={`${p.weightKg || "-"} kg`} />
              <Stat label="Foot" value={String(p.foot || "-")} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/ecb-hub" className="btn-muted">
                Back To Hub
              </Link>
              <Link href="/chat" className="btn-primary">
                Connect In Chat
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="mt-2 text-white/75">{p.bio || "No bio added yet."}</p>
          <p className="mt-3 text-sm text-white/70">Positions: {(p.positions || []).join(", ") || "-"}</p>
          <p className="mt-1 text-sm text-white/70">Available time: {p.availableTime || "-"}</p>
          <p className="mt-1 text-sm text-white/70">Off days: {(p.offDays || []).join(", ") || "-"}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Stats</h2>
          <ul className="mt-3 space-y-1 text-white/80">
            <li>Matches: {p.stats?.matches ?? 0}</li>
            <li>Goals: {p.stats?.goals ?? 0}</li>
            <li>Assists: {p.stats?.assists ?? 0}</li>
            <li>Clean sheets: {p.stats?.cleanSheets ?? 0}</li>
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">Achievements</h2>
        <PlayerAchievementsGallery
          achievements={(p.achievements || []).map((a: any) => ({
            title: a.title || "",
            details: a.details || "",
            date: a.date ? String(a.date) : "",
            image: a.image || ""
          }))}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">Photos</h2>
        {(p.photos || []).length === 0 ? (
          <p className="mt-2 text-white/70">No photos uploaded yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {(p.photos || []).map((url: string, idx: number) => (
              <div key={`${url}-${idx}`} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="aspect-[4/3] w-full">
                  <img src={url} alt={`Player photo ${idx + 1}`} className={`h-full w-full ${imageFitClass(url)}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.13em] text-white/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function imageFitClass(url: string) {
  const lower = String(url || "").toLowerCase();
  const isIllustration = lower.includes(".png") || lower.includes(".svg") || lower.includes("illustration");
  return isIllustration ? "object-contain p-2" : "object-cover";
}

function mainPhotoStyle(player: any) {
  if (!player?.profilePhoto) return undefined;
  const x = player?.profilePhotoMeta?.x ?? 50;
  const y = player?.profilePhotoMeta?.y ?? 50;
  const zoom = player?.profilePhotoMeta?.zoom ?? 1;
  return { objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` };
}
