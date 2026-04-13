"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { defaultLandingConfig, type LandingConfig } from "@/lib/landing-config";
import { toEmbedUrl } from "@/lib/media-embed";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

type HighlightItem = {
  id: string;
  title: string;
  league: string;
  date: string;
  time: string;
  thumb: string;
  video: string;
};

type FixtureItem = {
  id: string;
  event: string;
  league: string;
  date: string;
  time: string;
};

type LandingFeed = {
  updatedAt: string;
  source: string;
  highlights: HighlightItem[];
  fixtures: FixtureItem[];
  manualVideoZone?: HighlightItem[];
  config?: LandingConfig;
  managedMedia?: {
    id: string;
    title: string;
    type: "image" | "video";
    mediaUrl: string;
    thumbnailUrl?: string;
    linkUrl?: string;
    placement: "hero" | "spotlight" | "reels" | "ads";
    order: number;
    colSpan?: number;
    cardHeight?: number;
  }[];
};

const heroSlides = [
  {
    image: "/images/male_hero_football.png",
    badge: "Live Exposure",
    text: "Players showcase stats, timeline, and availability."
  },
  {
    image: "/images/male_match_ready.png", /* Explicitly a male soccer player */
    badge: "Match Ready",
    text: "Update your availability and get discovered for the next fixture."
  },
  {
    image: "/images/male_futsal_skill.png", /* Explicitly a male futsal player */
    badge: "Futsal Core",
    text: "Master the quick game and build your technical reputation indoors."
  },
  {
    image: "/images/futsal_pitch_action.png",
    badge: "Talent Network",
    text: "From campus grounds to club opportunities through ECB Lightforce."
  }
];

type LandingSectionsProps = {
  previewData?: Partial<LandingFeed> | null;
  previewMode?: boolean;
};

export default function LandingSections({ previewData = null, previewMode = false }: LandingSectionsProps) {
  const initialFeed = useMemo(
    () =>
      previewData
        ? ({
            updatedAt: new Date().toISOString(),
            source: "preview",
            highlights: [],
            fixtures: [],
            managedMedia: [],
            manualVideoZone: [],
            ...previewData
          } as LandingFeed)
        : null,
    [previewData]
  );

  const [feed, setFeed] = useState<LandingFeed | null>(initialFeed);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isBootLoading, setIsBootLoading] = useState(!previewMode);
  const [selectedFixtureDate, setSelectedFixtureDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (previewMode) {
      setFeed(initialFeed);
      return;
    }
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/landing/media");
        const data = (await res.json()) as LandingFeed;
        if (mounted) setFeed(data);
      } catch {
        if (mounted) setFeed(null);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [previewMode, initialFeed]);

  useEffect(() => {
    if (previewMode) return;
    const onLoaded = () => setIsBootLoading(false);
    const timeout = setTimeout(() => setIsBootLoading(false), 1700);

    if (document.readyState === "complete") {
      setIsBootLoading(false);
      clearTimeout(timeout);
      return;
    }

    window.addEventListener("load", onLoaded);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("load", onLoaded);
    };
  }, [previewMode]);

  const topVideos = useMemo(() => {
    const manual = (feed?.manualVideoZone || []).filter((v) => !!v.video);
    if (manual.length) return manual.slice(0, 6);
    return (feed?.highlights || []).filter((v) => !!v.video).slice(0, 2);
  }, [feed]);
  const pulseHighlights = useMemo(() => (feed?.highlights || []).slice(0, 4), [feed?.highlights]);
  const managedHero = useMemo(() => (feed?.managedMedia || []).filter((m) => m.placement === "hero").slice(0, 4), [feed]);
  const managedSpotlight = useMemo(() => (feed?.managedMedia || []).filter((m) => m.placement === "spotlight").slice(0, 4), [feed]);
  const managedReels = useMemo(() => (feed?.managedMedia || []).filter((m) => m.placement === "reels").slice(0, 6), [feed]);
  const managedAds = useMemo(() => (feed?.managedMedia || []).filter((m) => m.placement === "ads").slice(0, 6), [feed]);
  const heroDeck = useMemo(() => {
    const fromAdmin = managedHero.map((item) => ({
      image: item.type === "image" ? item.mediaUrl : item.thumbnailUrl || heroSlides[0].image,
      badge: "Admin Hero Media",
      text: item.title
    }));
    return (fromAdmin.length ? fromAdmin : heroSlides).slice(0, 6);
  }, [managedHero]);
  const content = useMemo(
    () => ({
      hero: { ...defaultLandingConfig.hero, ...(feed?.config?.hero || {}) },
      sections: { ...defaultLandingConfig.sections, ...(feed?.config?.sections || {}) },
      labels: { ...defaultLandingConfig.labels, ...(feed?.config?.labels || {}) }
    }),
    [feed?.config]
  );
  const fixturesByDate = useMemo(() => {
    const bucket = new Map<string, FixtureItem[]>();
    for (const fixture of feed?.fixtures || []) {
      const key = normalizeDateKey(fixture.date);
      if (!key) continue;
      const list = bucket.get(key) || [];
      list.push(fixture);
      bucket.set(key, list);
    }
    return bucket;
  }, [feed?.fixtures]);
  const fixtureDates = useMemo(() => Array.from(fixturesByDate.keys()).sort((a, b) => a.localeCompare(b)), [fixturesByDate]);
  const selectedDateFixtures = useMemo(
    () => (selectedFixtureDate ? fixturesByDate.get(selectedFixtureDate) || [] : []),
    [fixturesByDate, selectedFixtureDate]
  );

  useEffect(() => {
    if (!selectedFixtureDate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedFixtureDate(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedFixtureDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.max(heroDeck.length, 1));
    }, 3600);
    return () => clearInterval(timer);
  }, [heroDeck.length]);

  return (
    <main className="relative overflow-hidden pb-20">
      <AnimatePresence>
        {isBootLoading ? (
          <motion.div
            key="boot-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md"
            style={{ background: "var(--boot-overlay)" }}
          >
            <div className="glass-panel flex flex-col items-center gap-4 px-10 py-8">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10">
                <span className="animate-spin">
                  <FootballIcon size={30} className="text-pitch-300" />
                </span>
              </span>
              <p className="text-sm uppercase tracking-[0.2em] text-pitch-200">Loading ECB Lightforce</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--landing-overlay)" }}
      />

      <section className="relative mx-auto grid min-h-[86vh] w-full max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:px-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col justify-center">
          <motion.p
            initial="hidden"
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.45 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-pitch-100"
          >
            <FootballIcon />
            {content.hero.badge}
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="font-display max-w-3xl text-5xl leading-[0.92] text-white md:text-7xl"
          >
            <span className="hero-gradient-title">{content.hero.titleLine1}</span>
            <span className="hero-gradient-title block">{content.hero.titleLine2}</span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-2xl text-base text-white/80 md:text-lg"
          >
            {content.hero.description}
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href={content.hero.primaryCtaHref || "/register"} className="btn-primary rounded-full px-7 py-3 font-semibold text-black">
              {content.hero.primaryCtaLabel}
            </Link>
            <Link href={content.hero.secondaryCtaHref || "/ecb-hub"} className="btn-muted rounded-full px-7 py-3 text-white">
              {content.hero.secondaryCtaLabel}
            </Link>
          </motion.div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              { n: "2025", t: "Club Started" },
              { n: "24/7", t: "Profile Visibility" },
              { n: "90'", t: "Matchday Mindset" }
            ].map((s) => (
              <div key={s.t} className="animated-chip glass-soft p-3">
                <p className="text-lg font-bold text-white">{s.n}</p>
                <p className="text-xs text-white/70">{s.t}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="glass-panel relative p-4"
        >
          <div className="pointer-events-none absolute left-7 top-7 z-10">
            <div className="rounded-full border border-white/30 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-pitch-100 backdrop-blur-md">
              Stay Ready. Stay Visible.
            </div>
          </div>
          <div className="relative h-[380px] w-full overflow-hidden rounded-2xl md:h-[460px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={heroDeck[heroIndex % heroDeck.length].image}
                src={heroDeck[heroIndex % heroDeck.length].image}
                alt="Football players in action"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          </div>
          <div className="glass-soft absolute bottom-6 left-6 max-w-xs p-4">
            <p className="text-sm uppercase tracking-[0.16em] text-pitch-200">{heroDeck[heroIndex % heroDeck.length].badge}</p>
            <p className="mt-1 text-lg font-semibold text-white">{heroDeck[heroIndex % heroDeck.length].text}</p>
          </div>
          <div className="absolute bottom-7 right-8 flex gap-2">
            {heroDeck.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                onClick={() => setHeroIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${heroIndex === idx ? "w-6 bg-pitch-300" : "w-2.5 bg-white/50"}`}
                aria-label={`Show slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <div className="glass-panel overflow-hidden p-0">
          <video
            className="h-[260px] w-full object-cover md:h-[420px]"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/futsal_pitch_action.png"
          >
            <source
              src="https://player.vimeo.com/external/434045526.sd.mp4?s=c8f32e29bf2e6cdffedfd30d318fa6f0c2e6514a&profile_id=165&oauth2_token_id=57447761"
              type="video/mp4"
            />
          </video>
          <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
            <div className="glass-soft p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-pitch-200">Football Energy</p>
              <p className="mt-1 text-sm text-white/80">Fast transitions, intensity, and tactical identity.</p>
            </div>
            <div className="glass-soft p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-pitch-200">Futsal Precision</p>
              <p className="mt-1 text-sm text-white/80">Quick feet, tight control, and fast decisions in close space.</p>
            </div>
            <div className="glass-soft p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-pitch-200">Local To Pro</p>
              <p className="mt-1 text-sm text-white/80">A digital bridge from campus courts to broader opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="glass-panel relative overflow-hidden p-6 md:p-10">
          <motion.div
            animate={{ rotate: [0, 1.5, -1.5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-pitch-300/20 blur-2xl"
          />
          <motion.div
            animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-20 left-20 h-52 w-52 rounded-full bg-white/10 blur-2xl"
          />

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={reveal}
            className="text-xs uppercase tracking-[0.2em] text-pitch-200"
          >
            Signature Identity
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 12, rotateX: 18 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="font-display mt-2 text-6xl tracking-tight text-white md:text-8xl"
            style={{ transformStyle: "preserve-3d", textShadow: "0 14px 34px rgba(0,0,0,0.35)" }}
          >
            <span className="hero-gradient-title">ECB</span> <span className="hero-gradient-title">Lightforce</span>
          </motion.h2>

          <p className="mt-4 max-w-3xl text-white/80">
            Built for match-ready players who want real exposure. Your profile is no longer static, it is a live
            football identity powered by stats, availability, and verified progress.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <GlassTag label="Matchday Readiness" text="Availability, role fit, and current form in one view." />
            <GlassTag label="Talent Visibility" text="Built for fast scouting by organizers, coaches, and clubs." />
            <GlassTag label="Performance Journey" text="Track progress through achievements, stats, and timeline updates." />
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="glass-panel grid gap-4 p-5 md:grid-cols-4">
          {[
            ["Modern Profiles", "Stats + positions + achievements + photos"],
            ["Availability Engine", "Available now, off-days, preferred time"],
            ["ECB Hub Filters", "Find by age, role, form, and position"],
            ["Exposure Network", "Connect players with organizers quickly"]
          ].map(([title, desc]) => (
            <div key={title} className="glass-soft p-4">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs text-white/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {content.sections.showPulse ? (
      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.pulseEyebrow}</p>
            <h3 className="font-display mt-2 text-4xl text-white md:text-5xl">{content.labels.pulseTitle}</h3>
          </div>
          <p className="text-xs text-white/60">
            Source: {feed?.source === "thesportsdb" ? "TheSportsDB (free API)" : "Local fallback feed"}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {!feed ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <article key={`pulse-skeleton-${idx}`} className="glass-panel overflow-hidden p-0">
                  <div className="skeleton h-44 w-full" />
                  <div className="space-y-2 p-4">
                    <div className="skeleton skeleton-pill w-24" />
                    <div className="skeleton skeleton-line w-3/4" />
                    <div className="skeleton skeleton-line w-1/2" />
                  </div>
                </article>
              ))
            ) : (
            pulseHighlights.map((item) => (
              <article key={item.id} className="glass-panel overflow-hidden p-0">
                <div className="relative">
                  {item.thumb ? (
                    <img src={item.thumb} alt={item.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 w-full bg-white/5" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-pitch-100 backdrop-blur-md">
                    Keep Pushing
                  </div>
                  <p className="absolute bottom-3 left-3 text-xs font-semibold text-white/95">Every session builds your next chance.</p>
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-pitch-200">{item.league}</p>
                  <h4 className="mt-1 text-base font-semibold text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-white/70">{formatDate(item.date, item.time)}</p>
                </div>
              </article>
            ))
            )}
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">Fixture Calendar</p>
              <span className="text-xs text-white/60">Tap a date for details</span>
            </div>
            <FixtureCalendarCard
              monthKey={calendarMonth}
              fixtureDates={fixtureDates}
              fixturesByDate={fixturesByDate}
              onOpenDate={(date) => setSelectedFixtureDate(date)}
              onMonthChange={setCalendarMonth}
            />
            {!feed ? <div className="skeleton skeleton-line mt-3 w-40" /> : null}
          </div>
        </div>
      </section>
      ) : null}

      {content.sections.showVideoZone ? (
      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.videoEyebrow}</p>
          <h3 className="font-display mt-2 text-4xl text-white md:text-5xl">{content.labels.videoTitle}</h3>
        </div>
        <div className="grid grid-flow-row-dense gap-4 md:grid-cols-2">
          {topVideos.length ? (
            topVideos.map((video) => (
              <div key={video.id} className="glass-panel overflow-hidden p-0">
                <iframe
                  src={video.video}
                  className="h-64 w-full md:h-80"
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-pitch-200">{video.league}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{video.title}</p>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="glass-panel flex h-72 items-center justify-center p-4 text-sm text-white/70">
                Video highlights will appear automatically from the live feed.
              </div>
              <div className="glass-panel flex h-72 items-center justify-center p-4 text-sm text-white/70">
                Keep scrolling to explore profiles and platform capabilities.
              </div>
            </>
          )}
        </div>
      </section>
      ) : null}

      {content.sections.showSpotlight ? (
      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.spotlightEyebrow}</p>
          <h3 className="font-display mt-2 text-4xl text-white md:text-5xl">{content.labels.spotlightTitle}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {managedSpotlight.length === 0 ? (
            <div className="glass-panel col-span-full p-5 text-sm text-white/70">
              No spotlight media published yet.
            </div>
          ) : (
            managedSpotlight.map((item) => (
              <article
                key={item.id}
                className={`glass-panel overflow-hidden p-0 ${sectionSpanClass("spotlight", item.colSpan || 1)}`}
              >
                <ManagedMediaPreview item={item} className="w-full" height={item.cardHeight || 280} />
                <div className="p-4">
                  <p className="text-base font-semibold text-white">{item.title}</p>
                  {item.linkUrl ? (
                    <a href={item.linkUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-pitch-200 underline">
                      Open Link
                    </a>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      {content.sections.showReels ? (
      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.reelsEyebrow}</p>
          <h3 className="font-display mt-2 text-4xl text-white md:text-5xl">{content.labels.reelsTitle}</h3>
        </div>
        <div className="grid grid-flow-row-dense gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managedReels.length === 0 ? (
            <div className="glass-panel col-span-full p-5 text-sm text-white/70">No reels published yet.</div>
          ) : (
            managedReels.map((item) => (
              <article
                key={item.id}
                className={`glass-panel overflow-hidden p-0 ${sectionSpanClass("reels", item.colSpan || 1)}`}
              >
                <ManagedMediaPreview item={item} className="w-full" height={item.cardHeight || 220} />
                <div className="p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.type === "video" ? (
                    <a
                      href={item.linkUrl || item.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-pitch-200 underline"
                    >
                      Open Video
                    </a>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      {content.sections.showAds ? (
      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.adsEyebrow}</p>
          <h3 className="font-display mt-2 text-4xl text-white md:text-5xl">{content.labels.adsTitle}</h3>
        </div>
        <div className="grid grid-flow-row-dense gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managedAds.length === 0 ? (
            <div className="glass-panel col-span-full p-5 text-sm text-white/70">No admin media published yet.</div>
          ) : (
            managedAds.map((item) => (
              <article
                key={item.id}
                className={`glass-panel overflow-hidden p-0 ${sectionSpanClass("ads", item.colSpan || 1)}`}
              >
                <ManagedMediaPreview item={item} className="w-full" height={item.cardHeight || 200} />
                <div className="p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.linkUrl ? (
                    <a href={item.linkUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-pitch-200 underline">
                      Open Link
                    </a>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={reveal}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">How It Works</p>
          <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">From Registration To Matchday Opportunity</h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Create Player Account",
              text: "Register with your core details, foot, position, location, and physical metrics."
            },
            {
              step: "02",
              title: "Build Dynamic Profile",
              text: "Upload achievements, match photos, timeline, and set real-time availability."
            },
            {
              step: "03",
              title: "Get Discovered",
              text: "Appear in ECB Hub where clubs, campuses, and organizers can filter and scout."
            }
          ].map((card, idx) => (
            <motion.article
              key={card.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={reveal}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="glass-panel p-6"
            >
              <p className="text-sm font-bold tracking-[0.2em] text-pitch-300">{card.step}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-white/75">{card.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="/images/football_training_drill.png"
              alt="Football training session"
              className="h-[320px] w-full object-cover md:h-[420px]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-pitch-100 backdrop-blur-md">
              Mentality Wins
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-black/25 p-3 backdrop-blur-md">
              <p className="text-sm font-semibold text-white">Show up. Track progress. Earn your spotlight.</p>
              <p className="mt-1 text-xs text-white/80">Lightforce is built for players who train with intent.</p>
            </div>
          </div>
          <div className="glass-panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">ECB Lightforce Vision</p>
            <h2 className="mt-2 text-3xl font-bold text-white">A Clear Path For Hidden Talent</h2>
            <p className="mt-3 text-white/75">
              We are building a transparent digital identity layer for football and futsal players. Instead of being
              invisible after campus matches, every player can now own a public, filterable profile that proves growth.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/80">
              <li>Profile cards designed for quick scouting decisions</li>
              <li>Availability-first system for real match coordination</li>
              <li>Achievement timeline to highlight long-term consistency</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">
                Start Your Profile
              </Link>
              <Link href="/ecb-hub" className="btn-muted">
                Explore Talent Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {selectedFixtureDate ? (
        <FixtureDateModal
          date={selectedFixtureDate}
          fixtures={selectedDateFixtures}
          onClose={() => setSelectedFixtureDate(null)}
        />
      ) : null}
    </main>
  );
}

function FixtureCalendarCard({
  monthKey,
  fixtureDates,
  fixturesByDate,
  onOpenDate,
  onMonthChange
}: {
  monthKey: string;
  fixtureDates: string[];
  fixturesByDate: Map<string, FixtureItem[]>;
  onOpenDate: (date: string) => void;
  onMonthChange: (key: string) => void;
}) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const firstDay = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const days = Array.from({ length: totalCells }, (_, idx) => idx - firstDay + 1);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const fixturesInMonth = fixtureDates.filter((d) => d.startsWith(monthPrefix));

  const title = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });
  const prevMonth = new Date(year, month - 2, 1);
  const nextMonth = new Date(year, month, 1);

  return (
    <div className="mt-3 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-3 shadow-[0_14px_38px_rgba(0,0,0,0.28)]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`)}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10"
          aria-label="Previous month"
        >
          Prev
        </button>
        <div className="text-center">
          <p className="font-display text-xl leading-none text-white">{title}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-pitch-200">{fixturesInMonth.length} fixture dates</p>
        </div>
        <button
          type="button"
          onClick={() => onMonthChange(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`)}
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10"
          aria-label="Next month"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="py-1 text-center text-[10px] uppercase tracking-[0.12em] text-white/55">
            {label}
          </div>
        ))}
        {days.map((day, idx) => {
          if (day < 1 || day > daysInMonth) {
            return <div key={`blank-${idx}`} className="h-11 rounded-md border border-transparent" />;
          }
          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const fixtures = fixturesByDate.get(dateKey) || [];
          const hasFixture = fixtures.length > 0;
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => (hasFixture ? onOpenDate(dateKey) : undefined)}
              className={`relative h-11 rounded-lg border text-sm font-medium transition ${
                hasFixture
                  ? "border-pitch-300/60 bg-pitch-300/15 text-pitch-100 hover:-translate-y-0.5 hover:bg-pitch-300/25"
                  : "border-white/10 bg-white/[0.02] text-white/55"
              }`}
              aria-label={hasFixture ? `View fixtures on ${dateKey}` : `No fixtures on ${dateKey}`}
            >
              {day}
              {hasFixture ? <span className="absolute right-1 top-1 text-[10px] text-pitch-100">{fixtures.length}</span> : null}
            </button>
          );
        })}
      </div>
      {!fixtureDates.length ? <p className="mt-3 text-xs text-white/60">No fixtures scheduled yet.</p> : null}
      {fixtureDates.length && fixturesInMonth.length === 0 ? (
        <p className="mt-3 text-xs text-white/60">No fixtures in this month. Use next/prev to browse other months.</p>
      ) : null}
    </div>
  );
}

function FixtureDateModal({
  date,
  fixtures,
  onClose
}: {
  date: string;
  fixtures: FixtureItem[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        key={date}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2 }}
          className="glass-panel max-h-[80vh] w-full max-w-xl overflow-auto p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-pitch-200">Fixture Day</p>
              <h4 className="mt-1 text-xl font-bold text-white">{new Date(`${date}T00:00:00`).toLocaleDateString()}</h4>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {fixtures.map((fixture) => (
              <div key={fixture.id} className="glass-soft p-3">
                <p className="text-sm font-semibold text-white">{fixture.event}</p>
                <p className="text-xs text-white/70">{fixture.league}</p>
                <p className="mt-1 text-xs text-pitch-200">{formatDate(fixture.date, fixture.time)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function GlassTag({ label, text }: { label: string; text: string }) {
  return (
    <div className="glass-soft p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-white/70">{text}</p>
    </div>
  );
}

function FootballIcon({ size = 14, className = "text-pitch-300" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2L5 5L3 12L7.5 19L16.5 19L21 12L19 5L12 2ZM12 8L14.8 10L13.8 13.2H10.2L9.2 10L12 8ZM8 14.5L10.6 16H13.4L16 14.5M7.4 9L9.2 10M16.6 9L14.8 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ManagedMediaPreview({
  item,
  className,
  height
}: {
  item: {
    title: string;
    type: "image" | "video";
    mediaUrl: string;
  };
  className: string;
  height: number;
}) {
  const h = Math.max(160, Math.min(520, height || 220));
  if (item.type === "image") {
    return <img src={item.mediaUrl} alt={item.title} className={`${className} object-cover`} style={{ height: h }} />;
  }

  if (isVideoFile(item.mediaUrl)) {
    return <video src={item.mediaUrl} className={`${className} object-cover`} style={{ height: h }} controls playsInline />;
  }

  return (
    <iframe
      src={toEmbedUrl(item.mediaUrl)}
      className={className}
      style={{ height: h }}
      title={item.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function normalizeDateKey(date?: string) {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const fromNative = new Date(date);
  if (!Number.isNaN(fromNative.getTime())) {
    const y = fromNative.getFullYear();
    const m = String(fromNative.getMonth() + 1).padStart(2, "0");
    const d = String(fromNative.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const mdY = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdY) {
    const m = String(Number(mdY[1])).padStart(2, "0");
    const d = String(Number(mdY[2])).padStart(2, "0");
    return `${mdY[3]}-${m}-${d}`;
  }
  return "";
}

function sectionSpanClass(section: "spotlight" | "reels" | "ads", spanRaw: number) {
  const span = Math.max(1, Math.floor(spanRaw || 1));
  if (section === "spotlight") {
    return span >= 2 ? "md:col-span-2" : "";
  }
  if (span >= 3) return "md:col-span-2 lg:col-span-3";
  if (span === 2) return "md:col-span-2";
  return "";
}

function formatDate(date?: string, time?: string) {
  if (!date) return "Date not announced";
  return `${date}${time ? ` | ${time.slice(0, 5)}` : ""}`;
}
