import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { defaultLandingConfig } from "@/lib/landing-config";
import LandingConfig from "@/lib/models/LandingConfig";
import LandingMedia from "@/lib/models/LandingMedia";

export const dynamic = "force-dynamic";

type ApiEvent = {
  idEvent?: string;
  strEvent?: string;
  strLeague?: string;
  dateEvent?: string;
  strTime?: string;
  strThumb?: string;
  strVideo?: string;
};

const fallbackHighlights = [
  {
    id: "local-1",
    title: "Training Session Highlights",
    league: "ECB Lightforce Sessions",
    date: "2026-02-23",
    time: "19:00:00",
    thumb:
      "https://images.unsplash.com/photo-1543357480-c60d40007a3f?auto=format&fit=crop&w=1400&q=80",
    video: "https://www.youtube.com/watch?v=1Wf5FJ1f8qQ"
  },
  {
    id: "local-2",
    title: "Campus Futsal Night",
    league: "University Futsal",
    date: "2026-02-22",
    time: "20:30:00",
    thumb:
      "https://images.unsplash.com/photo-1430232324554-8f4aebd06683?auto=format&fit=crop&w=1400&q=80",
    video: "https://www.youtube.com/watch?v=Qn8f9Kk2o5Q"
  }
];

const fallbackFixtures = [
  { id: "fx-1", event: "ECB Lightforce Friendly Match", league: "Local Football", date: "2026-02-28", time: "17:00:00" },
  { id: "fx-2", event: "Campus Futsal Open", league: "University Futsal", date: "2026-03-01", time: "19:00:00" },
  { id: "fx-3", event: "Community Talent Showcase", league: "ECB Exposure Series", date: "2026-03-03", time: "16:00:00" }
];

async function fetchJson<T>(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      method: "GET",
      next: { revalidate: 900 },
      signal: controller.signal
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeVideo(url?: string) {
  if (!url) return "";
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = new URL(url).searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
}

function isPublished(publishAt?: string) {
  if (!publishAt) return true;
  const ts = new Date(publishAt).getTime();
  if (!Number.isFinite(ts)) return true;
  return ts <= Date.now();
}

function pickDateTime(date?: string, time?: string, publishAt?: string) {
  if (date || time) {
    return { date: date || "", time: time || "" };
  }
  if (publishAt) {
    const d = new Date(publishAt);
    if (!Number.isNaN(d.getTime())) {
      return {
        date: d.toISOString().slice(0, 10),
        time: d.toISOString().slice(11, 19)
      };
    }
  }
  return { date: "", time: "" };
}

function mergeUniqueByKey<T>(primary: T[], secondary: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of primary) {
    map.set(keyFn(item), item);
  }
  for (const item of secondary) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const highlightsUrl = `https://www.thesportsdb.com/api/v1/json/123/eventshighlights.php?d=${today}&s=Soccer`;
  const fallbackHighlightsUrl = "https://www.thesportsdb.com/api/v1/json/123/eventshighlights.php?s=Soccer";
  const fixturesUrl = "https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=4328";

  const [highlightsRes, highlightsAnyDateRes, fixturesRes] = await Promise.all([
    fetchJson<{ tvs?: ApiEvent[] }>(highlightsUrl),
    fetchJson<{ tvs?: ApiEvent[] }>(fallbackHighlightsUrl),
    fetchJson<{ events?: ApiEvent[] }>(fixturesUrl)
  ]);

  const highlightsSource = highlightsRes?.tvs?.length ? highlightsRes.tvs : highlightsAnyDateRes?.tvs || [];
  const fixturesSource = fixturesRes?.events || [];

  const highlights = (highlightsSource.length ? highlightsSource : fallbackHighlights)
    .slice(0, 8)
    .map((item: any, index: number) => ({
      id: item.idEvent || `h-${index}`,
      title: item.strEvent || item.title || "Football Highlight",
      league: item.strLeague || item.league || "Global Football",
      date: item.dateEvent || item.date || "",
      time: item.strTime || item.time || "",
      thumb: item.strThumb || item.thumb || "",
      video: normalizeVideo(item.strVideo || item.video || "")
    }));

  const fixtures = (fixturesSource.length ? fixturesSource : fallbackFixtures).slice(0, 8).map((item: any, index: number) => ({
    id: item.idEvent || item.id || `f-${index}`,
    event: item.strEvent || item.event || "Upcoming Match",
    league: item.strLeague || item.league || "Football",
    date: item.dateEvent || item.date || "",
    time: item.strTime || item.time || ""
  }));

  let managedMedia: any[] = [];
  let landingConfig: any = defaultLandingConfig;
  try {
    await connectToDatabase();
    const configDoc = await LandingConfig.findOne({ key: "main" }).lean();
    managedMedia = await LandingMedia.find({ isActive: true }).sort({ order: 1, updatedAt: -1 }).limit(12).lean();
    landingConfig = {
      hero: { ...defaultLandingConfig.hero, ...(configDoc?.hero || {}) },
      sections: { ...defaultLandingConfig.sections, ...(configDoc?.sections || {}) },
      labels: { ...defaultLandingConfig.labels, ...(configDoc?.labels || {}) },
      feed: {
        ...defaultLandingConfig.feed,
        ...(configDoc?.feed || {}),
        highlights: Array.isArray(configDoc?.feed?.highlights) ? configDoc.feed.highlights : [],
        fixtures: Array.isArray(configDoc?.feed?.fixtures) ? configDoc.feed.fixtures : [],
        videoZone: Array.isArray(configDoc?.feed?.videoZone) ? configDoc.feed.videoZone : []
      }
    };
  } catch {
    managedMedia = [];
    landingConfig = defaultLandingConfig;
  }

  const manualHighlights = (landingConfig.feed?.highlights || [])
    .filter((item: any) => item?.isActive !== false && isPublished(item?.publishAt))
    .map((item: any, index: number) => {
      const dt = pickDateTime(item.date, item.time, item.publishAt);
      return {
        id: item.id || `mh-${index}`,
        title: item.title || "Football Highlight",
        league: item.league || "ECB Lightforce",
        date: dt.date,
        time: dt.time,
        thumb: item.thumb || "",
        video: normalizeVideo(item.video || "")
      };
    });

  const manualFixtures = (landingConfig.feed?.fixtures || [])
    .filter((item: any) => item?.isActive !== false && isPublished(item?.publishAt))
    .map((item: any, index: number) => {
      const dt = pickDateTime(item.date, item.time, item.publishAt);
      return {
        id: item.id || `mf-${index}`,
        event: item.event || "Upcoming Match",
        league: item.league || "Football",
        date: dt.date,
        time: dt.time
      };
    });

  const manualVideoZone = (landingConfig.feed?.videoZone || [])
    .filter((item: any) => item?.isActive !== false && isPublished(item?.publishAt))
    .map((item: any, index: number) => ({
      id: item.id || `mv-${index}`,
      title: item.title || "Video Clip",
      league: item.league || "ECB Lightforce",
      date: "",
      time: "",
      thumb: item.thumb || "",
      video: normalizeVideo(item.video || "")
    }));

  const shouldUseManual = Boolean(landingConfig.feed?.useManualFeed);
  const mergedHighlights = mergeUniqueByKey(highlights, manualHighlights, (item) => `${item.title}|${item.date}|${item.time}`);
  const mergedFixtures = mergeUniqueByKey(fixtures, manualFixtures, (item) => `${item.event}|${item.date}|${item.time}`);
  const finalHighlights = shouldUseManual ? (manualHighlights.length ? manualHighlights : highlights) : mergedHighlights;
  const finalFixtures = shouldUseManual ? (manualFixtures.length ? manualFixtures : fixtures) : mergedFixtures;
  const finalVideoZone = shouldUseManual ? (manualVideoZone.length ? manualVideoZone : []) : manualVideoZone;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    source: highlightsSource.length ? "thesportsdb" : "fallback",
    highlights: finalHighlights,
    fixtures: finalFixtures,
    manualVideoZone: finalVideoZone,
    config: landingConfig,
    managedMedia: managedMedia.map((m: any) => ({
      id: String(m._id),
      title: m.title,
      type: m.type,
      mediaUrl: m.mediaUrl,
      thumbnailUrl: m.thumbnailUrl || "",
      linkUrl: m.linkUrl || "",
      placement: m.placement,
      order: m.order,
      colSpan: m.colSpan || 1,
      cardHeight: m.cardHeight || 220
    }))
  });
}
