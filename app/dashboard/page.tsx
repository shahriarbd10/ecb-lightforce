import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlayerProfileEditor from "@/components/PlayerProfileEditor";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <main className="container-page">
      <section className="glass-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pitch-300/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Player Command Center</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">ECB Lightforce Dashboard</h1>
        <p className="mt-2 text-white/75">
          Signed in as {session.user.name} ({session.user.role}).
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/ecb-hub" className="btn-primary">
            Open ECB Hub
          </Link>
          <Link href="/register" className="btn-muted">
            Register New Player
          </Link>
          {session.user.role === "admin" ? (
            <Link href="/admin/media" className="btn-muted">
              Admin Media
            </Link>
          ) : null}
        </div>
      </section>

      <div className="mt-6">
        <PlayerProfileEditor userName={session.user.name || "Player"} role={session.user.role} />
      </div>
    </main>
  );
}
