import { NextResponse } from "next/server";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import "@/lib/models/User";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const availableNow = searchParams.get("availableNow");
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const position = searchParams.get("position");
    const q = searchParams.get("q");

    const filter: Record<string, any> = {};

    if (availableNow === "true") filter.availableNow = true;
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }
    if (position) filter.positions = { $in: [position] };
    if (q) {
      filter.$or = [
        { location: { $regex: q, $options: "i" } },
        { positions: { $elemMatch: { $regex: q, $options: "i" } } },
        { headline: { $regex: q, $options: "i" } }
      ];
    }

    await connectToDatabase();
    const players = await PlayerProfile.find(filter)
      .populate("user", "name")
      .sort({ availableNow: -1, updatedAt: -1 })
      .limit(120)
      .lean();

    return NextResponse.json(
      players.map((p: any) => ({
        id: String(p._id),
        slug: p.slug,
        name: p.user?.name || "Player",
        location: p.location,
        age: p.age,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        positions: p.positions || [],
        availableNow: p.availableNow,
        profilePhoto: p.profilePhoto || (p.photos || [])[0] || "",
        photos: p.photos || [],
        headline: p.headline,
        stats: p.stats
      }))
    );
  } catch (error: any) {
    return dbAwareErrorResponse("Could not fetch players.", error);
  }
}
