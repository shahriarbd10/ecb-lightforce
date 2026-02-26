import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import LandingMedia from "@/lib/models/LandingMedia";

const updateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  type: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
  placement: z.enum(["hero", "ads", "spotlight", "reels"]).optional(),
  order: z.number().int().min(0).max(999).optional(),
  colSpan: z.number().int().min(1).max(3).optional(),
  cardHeight: z.number().int().min(160).max(520).optional(),
  isActive: z.boolean().optional()
});

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  if (session.user.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;
    const { id } = await context.params;

    const body = await request.json();
    const payload = updateSchema.parse(body);

    await connectToDatabase();
    const updated = await LandingMedia.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!updated) return NextResponse.json({ message: "Media not found." }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not update landing media.", error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;
    const { id } = await context.params;

    await connectToDatabase();
    const deleted = await LandingMedia.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ message: "Media not found." }, { status: 404 });

    return NextResponse.json({ message: "Deleted." });
  } catch (error) {
    return dbAwareErrorResponse("Could not delete landing media.", error);
  }
}
