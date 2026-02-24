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
  }[];
};

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1400&q=80",
    badge: "Live Exposure",
    text: "Players showcase stats, timeline, and availability."
  },
  {
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80",
    badge: "Match Ready",
    text: "Update your availability and get discovered for the next fixture."
  },
  {
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1400&q=80",
    badge: "Talent Network",
    text: "From campus grounds to club opportunities through ECB Lightforce."
  }
];

export default function LandingSections() {
  const [feed, setFeed] = useState<LandingFeed | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isBootLoading, setIsBootLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

  const topVideos = useMemo(() => (feed?.highlights || []).filter((v) => !!v.video).slice(0, 2), [feed]);
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,rgba(19,121,66,0.4),rgba(1,9,5,0.95)_55%)] backdrop-blur-md"
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

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(26,219,101,0.35),transparent_30%),radial-gradient(circle_at_95%_2%,rgba(255,255,255,0.12),transparent_32%),linear-gradient(122deg,#021108_0%,#083721_44%,#03110a_100%)]" />

      <section className="relative mx-auto grid min-h-[86vh] max-w-6xl gap-8 px-4 py-20 lg:grid-cols-[1.15fr_1fr]">
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
            className="max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl"
          >
            {content.hero.titleLine1}
            <span className="block text-pitch-300">{content.hero.titleLine2}</span>
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
            <Link href={content.hero.primaryCtaHref || "/register"} className="rounded-full bg-pitch-400 px-7 py-3 font-semibold text-black">
              {content.hero.primaryCtaLabel}
            </Link>
            <Link href={content.hero.secondaryCtaHref || "/ecb-hub"} className="rounded-full border border-white/25 bg-white/10 px-7 py-3 text-white">
              {content.hero.secondaryCtaLabel}
            </Link>
          </motion.div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              { n: "2025", t: "Club Started" },
              { n: "24/7", t: "Profile Visibility" },
              { n: "3 Roles", t: "Player / Org / Admin" }
            ].map((s) => (
              <div key={s.t} className="glass-soft p-3">
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

      <section className="relative mx-auto max-w-6xl px-4">
        <div className="glass-panel overflow-hidden p-0">
          <video
            className="h-[260px] w-full object-cover md:h-[420px]"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1600&q=80"
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

      <section className="relative mx-auto mt-2 max-w-6xl px-4">
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
            className="mt-2 text-5xl font-black tracking-tight text-white md:text-7xl"
            style={{ transformStyle: "preserve-3d", textShadow: "0 14px 34px rgba(0,0,0,0.35)" }}
          >
            ECB <span className="text-pitch-300">Lightforce</span>
          </motion.h2>

          <p className="mt-4 max-w-3xl text-white/80">
            Built for match-ready players who want real exposure. Your profile is no longer static, it is a live
            football identity powered by stats, availability, and verified progress.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <GlassTag label="3D-Inspired UI" text="Depth, motion, and glass layers for a premium sports experience." />
            <GlassTag label="Talent Visibility" text="Designed for quick scouting by organizers and clubs." />
            <GlassTag label="Community Driven" text="Open resources and remixes to evolve faster." />
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4">
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
      <section className="relative mx-auto mt-12 max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.pulseEyebrow}</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{content.labels.pulseTitle}</h3>
          </div>
          <p className="text-xs text-white/60">
            Source: {feed?.source === "thesportsdb" ? "TheSportsDB (free API)" : "Local fallback feed"}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {(feed?.highlights || []).slice(0, 4).map((item) => (
              <article key={item.id} className="glass-panel overflow-hidden p-0">
                {item.thumb ? (
                  <img src={item.thumb} alt={item.title} className="h-44 w-full object-cover" />
                ) : (
                  <div className="h-44 w-full bg-white/5" />
                )}
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-pitch-200">{item.league}</p>
                  <h4 className="mt-1 text-base font-semibold text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-white/70">{formatDate(item.date, item.time)}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="glass-panel p-4">
            <p className="text-sm font-semibold text-white">Upcoming Fixtures</p>
            <div className="mt-3 space-y-2">
              {(feed?.fixtures || []).slice(0, 6).map((fixture) => (
                <div key={fixture.id} className="glass-soft p-3">
                  <p className="text-sm font-medium text-white">{fixture.event}</p>
                  <p className="text-xs text-white/70">{fixture.league}</p>
                  <p className="mt-1 text-xs text-pitch-200">{formatDate(fixture.date, fixture.time)}</p>
                </div>
              ))}
              {!feed ? <p className="text-xs text-white/60">Loading latest feed...</p> : null}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {content.sections.showVideoZone ? (
      <section className="relative mx-auto mt-12 max-w-6xl px-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.videoEyebrow}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{content.labels.videoTitle}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
      <section className="relative mx-auto mt-12 max-w-6xl px-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.spotlightEyebrow}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{content.labels.spotlightTitle}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {managedSpotlight.length === 0 ? (
            <div className="glass-panel col-span-full p-5 text-sm text-white/70">
              No spotlight media published yet.
            </div>
          ) : (
            managedSpotlight.map((item) => (
              <article key={item.id} className="glass-panel overflow-hidden p-0">
                <ManagedMediaPreview item={item} className="h-60 w-full md:h-72" />
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
      <section className="relative mx-auto mt-12 max-w-6xl px-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.reelsEyebrow}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{content.labels.reelsTitle}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managedReels.length === 0 ? (
            <div className="glass-panel col-span-full p-5 text-sm text-white/70">No reels published yet.</div>
          ) : (
            managedReels.map((item) => (
              <article key={item.id} className="glass-panel overflow-hidden p-0">
                <ManagedMediaPreview item={item} className="h-52 w-full" />
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
      <section className="relative mx-auto mt-12 max-w-6xl px-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">{content.labels.adsEyebrow}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{content.labels.adsTitle}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managedAds.length === 0 ? (
            <div className="glass-panel col-span-full p-5 text-sm text-white/70">No admin media published yet.</div>
          ) : (
            managedAds.map((item) => (
              <article key={item.id} className="glass-panel overflow-hidden p-0">
                <ManagedMediaPreview item={item} className="h-48 w-full" />
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

      <section className="relative mx-auto mt-12 max-w-6xl px-4">
        <div className="glass-panel p-5 md:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-pitch-200">Open 3D Resources</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Community Sources You Can Plug Into This Project</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <a
              href="https://threejs.org/"
              target="_blank"
              rel="noreferrer"
              className="glass-soft p-4 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Three.js</p>
              <p className="mt-1 text-xs text-white/70">Web 3D library for custom football scenes and interactions.</p>
            </a>
            <a
              href="https://community.spline.design/"
              target="_blank"
              rel="noreferrer"
              className="glass-soft p-4 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Spline Community</p>
              <p className="mt-1 text-xs text-white/70">Remix-ready interactive 3D scenes from design community.</p>
            </a>
            <a
              href="https://poly.pizza/"
              target="_blank"
              rel="noreferrer"
              className="glass-soft p-4 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Poly Pizza</p>
              <p className="mt-1 text-xs text-white/70">Free low-poly GLTF assets including football/stadium models.</p>
            </a>
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-14 max-w-6xl px-4">
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

      <section className="relative mx-auto mt-14 max-w-6xl px-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
          <img
            src="https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1400&q=80"
            alt="Football training session"
            className="h-[320px] w-full rounded-2xl object-cover md:h-[420px]"
          />
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
    </main>
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
  className
}: {
  item: {
    title: string;
    type: "image" | "video";
    mediaUrl: string;
  };
  className: string;
}) {
  if (item.type === "image") {
    return <img src={item.mediaUrl} alt={item.title} className={`${className} object-cover`} />;
  }

  if (isVideoFile(item.mediaUrl)) {
    return <video src={item.mediaUrl} className={`${className} object-cover`} controls playsInline />;
  }

  return (
    <iframe
      src={toEmbedUrl(item.mediaUrl)}
      className={className}
      title={item.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

function formatDate(date?: string, time?: string) {
  if (!date) return "Date not announced";
  return `${date}${time ? ` | ${time.slice(0, 5)}` : ""}`;
}
