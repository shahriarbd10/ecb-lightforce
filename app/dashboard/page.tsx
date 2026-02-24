import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlayerProfileEditor from "@/components/PlayerProfileEditor";
import AdminMediaManager from "@/components/AdminMediaManager";
import AdminLandingCustomizer from "@/components/AdminLandingCustomizer";
import AdminPlayerManager from "@/components/AdminPlayerManager";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  const isAdmin = session.user.role === "admin";

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
            Open Lightforce Hub
          </Link>
          {isAdmin ? (
            <Link href="/register" className="btn-muted">
              Register New Player
            </Link>
          ) : (
            <a href="#player-profile-editor" className="btn-muted">
              Customize Profile
            </a>
          )}
          {isAdmin ? (
            <Link href="/admin/media" className="btn-muted">
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
            <AdminPlayerManager />
          </>
        ) : (
          <div id="player-profile-editor">
            <PlayerProfileEditor userName={session.user.name || "Player"} role={session.user.role} />
          </div>
        )}
      </div>
    </main>
  );
}
