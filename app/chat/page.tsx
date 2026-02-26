import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlayerChatCenter from "@/components/PlayerChatCenter";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/chat");
  if (session.user.role !== "player") redirect("/dashboard");

  return (
    <main className="container-page">
      <section className="glass-panel mb-4 p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Player Network Chat</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Chat Requests And Direct Messages</h1>
        <p className="mt-2 text-sm text-white/75">
          Send request first. Once accepted, you can share text updates, links, and images (max 720p).
        </p>
        <div className="mt-4">
          <Link href="/dashboard" className="btn-muted">
            Back To Dashboard
          </Link>
        </div>
      </section>
      <PlayerChatCenter />
    </main>
  );
}

