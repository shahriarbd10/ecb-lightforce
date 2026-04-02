import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import PlayerProfileEditor from "@/components/PlayerProfileEditor";
import AdminMediaManager from "@/components/AdminMediaManager";
import AdminLandingCustomizer from "@/components/AdminLandingCustomizer";
import AdminPlayerManager from "@/components/AdminPlayerManager";
import AdminUserUpdateMailer from "@/components/AdminUserUpdateMailer";
import { BallIcon, WhistleIcon } from "@/components/FootballIcons";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  const isAdmin = session.user.role === "admin";

  let completion = 0;
  let nextSteps: string[] = [];

  if (!isAdmin && session.user.id) {
    await connectToDatabase();
    const profile: any = await PlayerProfile.findOne({ user: session.user.id }).lean();

    if (profile) {
      const checks = [
        { done: Boolean(profile.headline && String(profile.headline).trim().length >= 8), tip: "Add a stronger headline." },
        { done: Boolean(profile.bio && String(profile.bio).trim().length >= 60), tip: "Write a short bio about your playing style." },
        { done: Array.isArray(profile.positions) && profile.positions.length >= 2, tip: "Add at least two playing positions." },
        { done: Boolean(profile.availableNow || (profile.availableTime && String(profile.availableTime).trim())), tip: "Set your availability status and time." },
        {
          done: Boolean(profile.profilePhoto || (Array.isArray(profile.photos) && profile.photos.length > 0)),
          tip: "Upload your profile photo."
        },
        { done: Array.isArray(profile.photos) && profile.photos.length >= 3, tip: "Add at least 3 action photos." },
        { done: Array.isArray(profile.achievements) && profile.achievements.length > 0, tip: "Add your first achievement." },
        { done: Array.isArray(profile.timeline) && profile.timeline.length > 0, tip: "Add your player journey timeline." }
      ];

      const completed = checks.filter((item) => item.done).length;
      completion = Math.round((completed / checks.length) * 100);
      nextSteps = checks.filter((item) => !item.done).map((item) => item.tip).slice(0, 3);
    }
  }

  return (
    <main className="container-page">
      <section className="glass-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pitch-300/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{isAdmin ? "Admin Control Room" : "Player Command Center"}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{isAdmin ? "ECB Lightforce Admin Dashboard" : "ECB Lightforce Dashboard"}</h1>
        <p className="mt-2 text-white/75">
          Signed in as {session.user.name} ({session.user.role}).
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/ecb-hub" className="btn-primary">
            <BallIcon />
            Open Lightforce Hub
          </Link>
          {isAdmin ? (
            <Link href="/register" className="btn-muted">
              <WhistleIcon className="text-pitch-200" />
              Register New Player
            </Link>
          ) : (
            <>
              <a href="#player-profile-editor" className="btn-muted">
                <WhistleIcon className="text-pitch-200" />
                Customize Profile
              </a>
              <Link href="/chat" className="btn-muted">
                <WhistleIcon className="text-pitch-200" />
                Open Player Chat
              </Link>
            </>
          )}
          {isAdmin ? (
            <Link href="/admin/media" className="btn-muted">
              <WhistleIcon className="text-pitch-200" />
              Admin Media
            </Link>
          ) : null}
        </div>
      </section>

      <div className="mt-6">
        {isAdmin ? (
          <>
            <AdminLandingCustomizer />
            <section className="glass-panel p-5 md:p-6">
              <h2 className="text-2xl font-semibold">Landing Page Content Manager</h2>
              <p className="mt-2 text-white/75">
                Publish and control hero, spotlight, reels, and ads sections for the landing page. Supports direct
                uploads plus image/video links (YouTube, Vimeo, Facebook public video URLs).
              </p>
            </section>
            <AdminMediaManager />
            <AdminUserUpdateMailer />
            <AdminPlayerManager />
          </>
        ) : (
          <>
            <section className="glass-panel mb-6 p-5 md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">Profile Readiness</p>
                  <h2 className="mt-2 text-2xl font-semibold">Scout Visibility Score: {completion}%</h2>
                  <p className="mt-1 text-white/75">Complete your profile to rank higher for clubs and trial opportunities.</p>
                </div>
                <a href="#player-profile-editor" className="btn-primary">
                  <WhistleIcon className="text-pitch-100" />
                  Improve Now
                </a>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/15 bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pitch-300 via-cyan-300 to-lime-300 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>

              {nextSteps.length ? (
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {nextSteps.map((tip) => (
                    <div key={tip} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                      {tip}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-emerald-300">Your profile is complete and match-ready.</p>
              )}
            </section>

            <div id="player-profile-editor">
              <PlayerProfileEditor userName={session.user.name || "Player"} role={session.user.role} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
