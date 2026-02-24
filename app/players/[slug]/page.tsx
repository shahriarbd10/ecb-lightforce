import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import "@/lib/models/User";

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();

  const player = await PlayerProfile.findOne({ slug }).populate("user", "name role").lean();
  if (!player || (player as any).user?.role !== "player") return notFound();

  const p: any = player;

  return (
    <main className="container-page">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {(p.profilePhoto || (p.photos || [])[0]) ? (
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
            <div className="h-44 w-44 md:h-52 md:w-52">
              <img
                src={p.profilePhoto || p.photos[0]}
                alt={`${p.user?.name || "Player"} profile`}
                className={`h-full w-full ${imageFitClass(p.profilePhoto || p.photos[0])}`}
              />
            </div>
          </div>
        ) : null}
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
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[...(p.achievements || [])]
              .sort((a: any, b: any) => {
                const at = a?.date ? new Date(a.date).getTime() : 0;
                const bt = b?.date ? new Date(b.date).getTime() : 0;
                return bt - at;
              })
              .map((a: any, idx: number) => (
                <article key={`${a.title}-${idx}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  {a.image ? <img src={a.image} alt={a.title} className="h-40 w-full object-cover" /> : null}
                  <div className="p-3">
                    <p className="font-medium text-white">{a.title}</p>
                    {a.date ? <p className="mt-1 text-xs text-pitch-200">{formatDate(a.date)}</p> : null}
                    <p className="mt-2 text-sm text-white/75">{a.details || "No details provided."}</p>
                  </div>
                </article>
              ))}
          </div>
        )}
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

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}
