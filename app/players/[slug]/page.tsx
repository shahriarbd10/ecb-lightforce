import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import "@/lib/models/User";

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();

  const player = await PlayerProfile.findOne({ slug }).populate("user", "name").lean();
  if (!player) return notFound();

  const p: any = player;

  return (
    <main className="container-page">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">{p.availableNow ? "Available Now" : "Not Available"}</p>
        <h1 className="mt-2 text-4xl font-bold text-white">{p.user?.name || "Player"}</h1>
        <p className="mt-2 text-white/80">{p.headline}</p>
        <p className="mt-1 text-white/70">{p.location}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat label="Age" value={String(p.age || "-")} />
          <Stat label="Height" value={`${p.heightCm || "-"} cm`} />
          <Stat label="Weight" value={`${p.weightKg || "-"} kg`} />
          <Stat label="Foot" value={String(p.foot || "-")} />
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
        {(p.achievements || []).length === 0 ? (
          <p className="mt-2 text-white/70">No achievements added yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {(p.achievements || []).map((a: any, idx: number) => (
              <li key={`${a.title}-${idx}`} className="rounded-xl border border-white/10 p-3">
                <p className="font-medium text-white">{a.title}</p>
                <p className="text-sm text-white/75">{a.details}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">Photos</h2>
        {(p.photos || []).length === 0 ? (
          <p className="mt-2 text-white/70">No photos uploaded yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {(p.photos || []).map((url: string, idx: number) => (
              <img
                key={`${url}-${idx}`}
                src={url}
                alt={`Player photo ${idx + 1}`}
                className="h-36 w-full rounded-xl border border-white/10 object-cover"
              />
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
