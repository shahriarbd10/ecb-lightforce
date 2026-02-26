"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { BallIcon, BootIcon } from "@/components/FootballIcons";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [avatar, setAvatar] = useState("");
  const [avatarMeta, setAvatarMeta] = useState({ x: 50, y: 50, zoom: 1 });
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [status, session?.user?.id]);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name || "Player";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,rgba(2,12,7,0.92),rgba(4,33,19,0.86))] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,#9dffcb,transparent)] opacity-70" />
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4">
        <Link href="/" className="group inline-flex items-center gap-2 font-semibold tracking-wide text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[0_0_24px_rgba(125,255,179,0.18)]">
            <BallIcon className="text-pitch-200" />
          </span>
          <span className="font-display text-[1.45rem] leading-none">ECB Lightforce</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <MenuIcon />
        </button>

        <div className="hidden items-center gap-2 text-sm md:flex">
          <Link href="/ecb-hub" className="rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
            Lightforce Hub
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full border border-white/20 px-3 py-1.5 text-white/85 transition hover:bg-white/10"
              >
                <BootIcon className="mr-1 inline-block text-pitch-200" />
                Logout
              </button>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1">
                {avatar ? (
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20">
                    <img
                      src={avatar}
                      alt={userName}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${avatarMeta.x}% ${avatarMeta.y}%`, transform: `scale(${avatarMeta.zoom})` }}
                    />
                  </div>
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
              <Link href="/register" className="rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
                Join
              </Link>
              <Link href="/login?callbackUrl=/dashboard" className="btn-primary rounded-full px-4 py-1.5 font-medium text-black">
                <BallIcon className="mr-1 inline-block" />
                Login
              </Link>
            </>
          )}
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-black/40 px-3 py-3 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <Link href="/ecb-hub" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
              Lightforce Hub
            </Link>

            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {avatar ? (
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20">
                      <img
                        src={avatar}
                        alt={userName}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${avatarMeta.x}% ${avatarMeta.y}%`, transform: `scale(${avatarMeta.zoom})` }}
                      />
                    </div>
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pitch-400 font-semibold text-black">
                      {userName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm text-white">{userName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
                >
                  <BootIcon className="mr-1 inline-block text-pitch-200" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                  Join
                </Link>
                <Link href="/login?callbackUrl=/dashboard" className="btn-primary justify-center rounded-xl px-4 py-2 text-sm font-medium text-black">
                  <BallIcon className="mr-1 inline-block" />
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
