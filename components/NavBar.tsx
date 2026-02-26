"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { BallIcon, BootIcon } from "@/components/FootballIcons";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [avatar, setAvatar] = useState("");
  const [avatarMeta, setAvatarMeta] = useState({ x: 50, y: 50, zoom: 1 });

  useEffect(() => {
    let mounted = true;
    async function loadProfilePhoto() {
      if (!session?.user || session.user.role !== "player") {
        if (mounted) setAvatar("");
        return;
      }

      try {
        const res = await fetch("/api/player/profile", { cache: "no-store" });
        const data = await res.json();
        if (mounted && res.ok) {
          setAvatar(String(data?.profilePhoto || data?.photos?.[0] || ""));
          setAvatarMeta({
            x: Number(data?.profilePhotoMeta?.x ?? 50),
            y: Number(data?.profilePhotoMeta?.y ?? 50),
            zoom: Number(data?.profilePhotoMeta?.zoom ?? 1)
          });
        }
      } catch {
        if (mounted) setAvatar("");
      }
    }

    loadProfilePhoto();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id, session?.user?.role]);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name || "Player";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-wide text-white">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <BallIcon className="text-pitch-200" />
          </span>
          ECB Lightforce
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/ecb-hub" className="text-white/80 hover:text-white">
            Lightforce Hub
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-white/80 hover:text-white">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full border border-white/20 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                <BootIcon className="mr-1 inline-block text-pitch-200" />
                Logout
              </button>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={userName}
                    className="h-8 w-8 rounded-full object-cover"
                    style={{ objectPosition: `${avatarMeta.x}% ${avatarMeta.y}%`, transform: `scale(${avatarMeta.zoom})` }}
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pitch-400 font-semibold text-black">
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="pr-2 text-xs text-white">{userName}</span>
              </div>
            </>
          ) : (
            <>
              <Link href="/register" className="text-white/80 hover:text-white">
                Join
              </Link>
              <Link href="/login?callbackUrl=/dashboard" className="rounded-full bg-pitch-400 px-4 py-1.5 font-medium text-black">
                <BallIcon className="mr-1 inline-block" />
                Login
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
