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
      className="sticky top-0 z-40 border-b shadow-sm backdrop-blur-xl"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--surface-border)"
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))" }}
      />
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 lg:px-10">
        <Link href="/" className="group inline-flex items-center gap-3 font-semibold tracking-wide" style={{ color: "var(--page-text)" }}>
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-opacity-20"
            style={{ 
              backgroundColor: "var(--chip-bg)", 
              borderColor: "var(--chip-border)",
              color: "var(--color-primary)",
              transform: "skewX(-10deg)"
            }}
          >
            <span style={{ transform: "skewX(10deg)" }}><BallIcon className="w-5 h-5" /></span>
          </span>
          <span className="font-display text-2xl leading-none tracking-wide text-[var(--color-primary)] dark:text-white">ECB Lightforce</span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border bg-opacity-20 transition"
            style={{ 
              backgroundColor: "var(--chip-bg)", 
              borderColor: "var(--chip-border)",
              color: "var(--page-text)"
            }}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <ThemeIcon theme={theme} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-opacity-20 transition"
            style={{ 
              backgroundColor: "var(--chip-bg)", 
              borderColor: "var(--chip-border)",
              color: "var(--page-text)"
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>
        </div>

        <div className="hidden items-center gap-4 text-sm md:flex font-semibold tracking-wide">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-3 py-2 transition text-slate-600 hover:text-[var(--color-primary)] dark:text-slate-300 dark:hover:text-white"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <ThemeIcon theme={theme} />
            <span className="text-xs uppercase">{theme === "light" ? "Dark" : "Light"}</span>
          </button>

          <Link href="/ecb-hub" className="px-2 py-2 transition text-slate-600 hover:text-[var(--color-primary)] dark:text-slate-300 dark:hover:text-white uppercase text-xs">
            Lightforce Hub
          </Link>
          <Link href="/live-feed" className="px-2 py-2 transition text-slate-600 hover:text-[var(--color-primary)] dark:text-slate-300 dark:hover:text-white uppercase text-xs">
            Live Feed
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="px-2 py-2 transition text-slate-600 hover:text-[var(--color-primary)] dark:text-slate-300 dark:hover:text-white uppercase text-xs">
                Dashboard
              </Link>
              {session?.user?.role === "player" ? (
                <Link href="/chat" className="relative px-2 py-2 transition text-slate-600 hover:text-[var(--color-primary)] dark:text-slate-300 dark:hover:text-white uppercase text-xs">
                  Chat
                  {chatHasUnread ? <span className="absolute -right-1 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> : null}
                </Link>
              ) : null}
              
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 border-none" />

              <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
                {avatar ? (
                  <div className="h-7 w-7 overflow-hidden rounded-md border" style={{ borderColor: "var(--surface-border)" }}>
                    <img
                      src={avatar}
                      alt={userName}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${avatarMeta.x}% ${avatarMeta.y}%`, transform: `scale(${avatarMeta.zoom})` }}
                    />
                  </div>
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="pr-2 text-xs font-bold" style={{ color: "var(--page-text)" }}>{userName}</span>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1.5 transition text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 uppercase text-xs flex items-center"
              >
                <BootIcon className="mr-1.5 inline-block w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 border-none" />
              <Link href="/register" className="px-3 py-2 transition text-slate-600 hover:text-[var(--color-primary)] dark:text-slate-300 dark:hover:text-white uppercase text-xs font-bold">
                Join Network
              </Link>
              <Link href="/login?callbackUrl=/dashboard" className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
                <BallIcon className="mr-1 inline-block w-4 h-4" />
                Login
              </Link>
            </>
          )}
        </div>
      </nav>

      {menuOpen ? (
        <div className="border-t bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl md:hidden" style={{ borderColor: "var(--surface-border)" }}>
          <div className="flex flex-col p-4 space-y-3 font-semibold uppercase text-sm tracking-wide">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 p-3 rounded-lg border text-slate-700 dark:text-slate-200"
              style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}
            >
              <ThemeIcon theme={theme} />
              Switch to {theme === "light" ? "dark" : "light"} mode
            </button>
            <Link href="/ecb-hub" className="p-3 rounded-lg border text-slate-700 dark:text-slate-200" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
              Lightforce Hub
            </Link>
            <Link href="/live-feed" className="p-3 rounded-lg border text-slate-700 dark:text-slate-200" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
              Live Feed
            </Link>

            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="p-3 rounded-lg border text-slate-700 dark:text-slate-200" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
                  Dashboard
                </Link>
                {session?.user?.role === "player" ? (
                  <Link href="/chat" className="relative p-3 rounded-lg border text-slate-700 dark:text-slate-200" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
                    Chat
                    {chatHasUnread ? <span className="absolute right-3 top-4 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> : null}
                  </Link>
                ) : null}
                <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
                  {avatar ? (
                    <div className="h-8 w-8 overflow-hidden rounded-md border" style={{ borderColor: "var(--surface-border)" }}>
                      <img
                        src={avatar}
                        alt={userName}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${avatarMeta.x}% ${avatarMeta.y}%`, transform: `scale(${avatarMeta.zoom})` }}
                      />
                    </div>
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md font-bold text-white text-xs" style={{ backgroundColor: "var(--color-primary)" }}>
                      {userName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="text-slate-800 dark:text-white">{userName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 p-3 rounded-lg border text-red-600 dark:text-red-400"
                  style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}
                >
                  <BootIcon className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="p-3 rounded-lg border text-slate-700 dark:text-slate-200" style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--surface-border)" }}>
                  Join Network
                </Link>
                <Link href="/login?callbackUrl=/dashboard" className="btn-primary w-full justigy-center py-3">
                  <BallIcon className="mr-2 inline-block w-5 h-5" />
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-80">
      <path
        d="M20 15.5A8 8 0 1 1 8.5 4C8.5 10.2 13.8 15.5 20 15.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-80">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2V4.5M12 19.5V22M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M2 12H4.5M19.5 12H22M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
