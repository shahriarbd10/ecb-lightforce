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
  const [chatHasUnread, setChatHasUnread] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(currentTheme);
  }, []);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function loadChatAlerts() {
      if (!session?.user || session.user.role !== "player") {
        if (mounted) setChatHasUnread(false);
        return;
      }
      try {
        const res = await fetch("/api/chat/alerts", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (mounted && res.ok) {
          setChatHasUnread(Boolean(data?.hasUnread));
        }
      } catch {
        if (mounted) setChatHasUnread(false);
      }
    }

    loadChatAlerts();
    if (session?.user?.role === "player") {
      timer = setInterval(loadChatAlerts, 5000);
    }
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [session?.user?.id, session?.user?.role]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  }

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name || "Player";

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(250,252,255,0.94), rgba(240,244,247,0.94))"
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{ background: "linear-gradient(90deg, transparent, var(--color-navy), transparent)" }}
      />
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4">
        <Link href="/" className="group inline-flex items-center gap-2 font-semibold tracking-wide text-white">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10"
            style={{ boxShadow: "0 0 24px color-mix(in srgb, var(--color-aqua) 24%, transparent)" }}
          >
            <BallIcon className="text-pitch-200" />
          </span>
          <span className="font-display text-[1.45rem] leading-none">ECB Lightforce</span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-2 text-white"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <ThemeIcon theme={theme} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>
        </div>

        <div className="hidden items-center gap-2 text-sm md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white/85 transition hover:bg-white/20"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <ThemeIcon theme={theme} />
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <Link href="/ecb-hub" className="rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
            Lightforce Hub
          </Link>
          <Link href="/live-feed" className="rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
            Live Feed
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
              {session?.user?.role === "player" ? (
                <Link href="/chat" className="relative rounded-full border border-transparent px-3 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
                  Chat
                  {chatHasUnread ? <span className="absolute -right-0.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.75)]" /> : null}
                </Link>
              ) : null}
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
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90"
            >
              <ThemeIcon theme={theme} />
              Switch to {theme === "light" ? "dark" : "light"} mode
            </button>
            <Link href="/ecb-hub" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
              Lightforce Hub
            </Link>
            <Link href="/live-feed" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
              Live Feed
            </Link>

            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                  Dashboard
                </Link>
                {session?.user?.role === "player" ? (
                  <Link href="/chat" className="relative rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                    Chat
                    {chatHasUnread ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.75)]" /> : null}
                  </Link>
                ) : null}
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

function ThemeIcon({ theme }: { theme: "light" | "dark" }) {
  return theme === "light" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 15.5A8 8 0 1 1 8.5 4C8.5 10.2 13.8 15.5 20 15.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2V4.5M12 19.5V22M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M2 12H4.5M19.5 12H22M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
