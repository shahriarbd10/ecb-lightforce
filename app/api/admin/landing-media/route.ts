import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import LandingMedia from "@/lib/models/LandingMedia";

const createSchema = z.object({
  title: z.string().min(2).max(120),
  type: z.enum(["image", "video"]),
  mediaUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
  placement: z.enum(["hero", "ads", "spotlight", "reels"]).default("ads"),
  order: z.number().int().min(0).max(999).default(0),
  colSpan: z.number().int().min(1).max(3).default(1),
  cardHeight: z.number().int().min(160).max(520).default(220),
  isActive: z.boolean().default(true)
});

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  if (session.user.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET() {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;

    await connectToDatabase();
    const items = await LandingMedia.find({}).sort({ order: 1, updatedAt: -1 }).lean();
    return NextResponse.json(items);
  } catch (error) {
    return dbAwareErrorResponse("Could not fetch landing media.", error);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const payload = createSchema.parse(body);

    await connectToDatabase();
    const created = await LandingMedia.create(payload);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not create landing media.", error);
  }
}
