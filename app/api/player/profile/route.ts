import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import User from "@/lib/models/User";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  age: z.number().int().min(8).max(60).optional(),
  heightCm: z.number().int().min(100).max(250).optional(),
  weightKg: z.number().int().min(30).max(200).optional(),
  foot: z.enum(["left", "right", "both"]).optional(),
  bio: z.string().max(1200).optional(),
  availableNow: z.boolean().optional(),
  availableTime: z.string().max(120).optional(),
  offDays: z.array(z.string().max(20)).max(7).optional(),
  photos: z.array(z.string().url()).max(12).optional(),
  profilePhoto: z.string().url().optional(),
  profilePhotoMeta: z
    .object({
      x: z.number().min(0).max(100).optional(),
      y: z.number().min(0).max(100).optional(),
      zoom: z.number().min(1).max(2).optional()
    })
    .optional(),
  headline: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  positions: z.array(z.string().max(10)).max(6).optional(),
  stats: z
    .object({
      matches: z.number().int().min(0).max(500).optional(),
      goals: z.number().int().min(0).max(2000).optional(),
      assists: z.number().int().min(0).max(2000).optional(),
      cleanSheets: z.number().int().min(0).max(1000).optional()
    })
    .optional(),
  achievements: z
    .array(
      z.object({
        title: z.string().min(2).max(140),
        details: z.string().max(800).optional(),
        date: z.string().optional(),
        image: z.string().url().optional().or(z.literal(""))
      })
    )
    .max(30)
    .optional()
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const [profile, user] = await Promise.all([
      PlayerProfile.findOne({ user: session.user.id }).lean(),
      User.findById(session.user.id).select("name").lean()
    ]);
    if (!profile) {
      return NextResponse.json({ message: "Player profile not found." }, { status: 404 });
    }

    return NextResponse.json({ ...profile, name: user?.name || session.user.name || "" });
  } catch (error: any) {
    return dbAwareErrorResponse("Could not fetch profile.", error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const payload = updateSchema.parse(body);
    const { name, ...profilePayload } = payload;

    await connectToDatabase();
    if (name) {
      await User.findByIdAndUpdate(session.user.id, { $set: { name } });
    }
    const profile = await PlayerProfile.findOneAndUpdate({ user: session.user.id }, { $set: profilePayload }, { new: true }).lean();

    if (!profile) {
      return NextResponse.json({ message: "Player profile not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated.", profile });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not update profile.", error);
  }
}
