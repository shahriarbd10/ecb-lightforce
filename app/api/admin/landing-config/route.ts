import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import { defaultLandingConfig } from "@/lib/landing-config";
import LandingConfig from "@/lib/models/LandingConfig";

const landingConfigSchema = z.object({
  hero: z.object({
    badge: z.string().min(2).max(120),
    titleLine1: z.string().min(4).max(120),
    titleLine2: z.string().min(4).max(120),
    description: z.string().min(20).max(600),
    primaryCtaLabel: z.string().min(2).max(40),
    primaryCtaHref: z.string().min(1).max(120),
    secondaryCtaLabel: z.string().min(2).max(40),
    secondaryCtaHref: z.string().min(1).max(120)
  }),
  sections: z.object({
    showPulse: z.boolean(),
    showVideoZone: z.boolean(),
    showSpotlight: z.boolean(),
    showReels: z.boolean(),
    showAds: z.boolean()
  }),
  labels: z.object({
    pulseEyebrow: z.string().min(2).max(80),
    pulseTitle: z.string().min(4).max(140),
    videoEyebrow: z.string().min(2).max(80),
    videoTitle: z.string().min(4).max(140),
    spotlightEyebrow: z.string().min(2).max(80),
    spotlightTitle: z.string().min(4).max(140),
    reelsEyebrow: z.string().min(2).max(80),
    reelsTitle: z.string().min(4).max(140),
    adsEyebrow: z.string().min(2).max(80),
    adsTitle: z.string().min(4).max(140)
  }),
  feed: z.object({
    useManualFeed: z.boolean(),
    highlights: z.array(
      z.object({
        id: z.string().min(1).max(80),
        title: z.string().min(2).max(140),
        league: z.string().min(2).max(120),
        date: z.string().min(1).max(30),
        time: z.string().min(1).max(30),
        thumb: z.string().url().or(z.literal("")),
        video: z.string().url().or(z.literal("")),
        isActive: z.boolean(),
        publishAt: z.string().datetime().optional().or(z.literal(""))
      })
    ).max(12),
    fixtures: z.array(
      z.object({
        id: z.string().min(1).max(80),
        event: z.string().min(2).max(140),
        league: z.string().min(2).max(120),
        date: z.string().min(1).max(30),
        time: z.string().min(1).max(30),
        isActive: z.boolean(),
        publishAt: z.string().datetime().optional().or(z.literal(""))
      })
    ).max(20),
    videoZone: z.array(
      z.object({
        id: z.string().min(1).max(80),
        title: z.string().min(2).max(140),
        league: z.string().min(2).max(120),
        video: z.string().url(),
        thumb: z.string().url().optional().or(z.literal("")),
        isActive: z.boolean(),
        publishAt: z.string().datetime().optional().or(z.literal(""))
      })
    ).max(12)
  })
});

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  if (session.user.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const };
}

function mergeWithDefaults(config: any) {
  return {
    hero: { ...defaultLandingConfig.hero, ...(config?.hero || {}) },
    sections: { ...defaultLandingConfig.sections, ...(config?.sections || {}) },
    labels: { ...defaultLandingConfig.labels, ...(config?.labels || {}) },
    feed: {
      ...defaultLandingConfig.feed,
      ...(config?.feed || {}),
      highlights: Array.isArray(config?.feed?.highlights) ? config.feed.highlights : defaultLandingConfig.feed.highlights,
      fixtures: Array.isArray(config?.feed?.fixtures) ? config.feed.fixtures : defaultLandingConfig.feed.fixtures,
      videoZone: Array.isArray(config?.feed?.videoZone) ? config.feed.videoZone : defaultLandingConfig.feed.videoZone
    }
  };
}

export async function GET() {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;

    await connectToDatabase();
    const doc = await LandingConfig.findOne({ key: "main" }).lean();
    return NextResponse.json(mergeWithDefaults(doc));
  } catch (error) {
    return dbAwareErrorResponse("Could not fetch landing config.", error);
  }
}

export async function PUT(request: Request) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const payload = landingConfigSchema.parse(body);

    await connectToDatabase();
    const updated = await LandingConfig.findOneAndUpdate(
      { key: "main" },
      { $set: { ...payload, key: "main" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(mergeWithDefaults(updated));
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not update landing config.", error);
  }
}
