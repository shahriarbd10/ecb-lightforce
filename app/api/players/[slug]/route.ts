import { NextResponse } from "next/server";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import "@/lib/models/User";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    await connectToDatabase();

    const player = await PlayerProfile.findOne({ slug }).populate("user", "name").lean();
    if (!player) {
      return NextResponse.json({ message: "Player not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: String((player as any)._id),
      slug: (player as any).slug,
      name: (player as any).user?.name || "Player",
      headline: (player as any).headline,
      location: (player as any).location,
      age: (player as any).age,
      heightCm: (player as any).heightCm,
      weightKg: (player as any).weightKg,
      foot: (player as any).foot,
      positions: (player as any).positions || [],
      bio: (player as any).bio,
      availableNow: (player as any).availableNow,
      availableTime: (player as any).availableTime,
      offDays: (player as any).offDays || [],
      profilePhoto: (player as any).profilePhoto || ((player as any).photos || [])[0] || "",
      photos: (player as any).photos || [],
      stats: (player as any).stats || {},
      achievements: (player as any).achievements || [],
      timeline: (player as any).timeline || []
    });
  } catch (error: any) {
    return dbAwareErrorResponse("Could not fetch player.", error);
  }
}
