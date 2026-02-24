import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import User from "@/lib/models/User";
import { buildUniqueSlug } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  location: z.string().min(2).max(120),
  age: z.coerce.number().min(8).max(60),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(200),
  foot: z.enum(["left", "right", "both"]).default("right"),
  positions: z.array(z.string().min(1).max(10)).min(1).max(6),
  headline: z.string().max(120).optional()
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
    const profiles = await PlayerProfile.find({})
      .populate("user", "name email role")
      .sort({ updatedAt: -1 })
      .limit(300)
      .lean();

    return NextResponse.json(
      profiles
        .filter((p: any) => p.user?.role === "player")
        .map((p: any) => ({
          id: String(p._id),
          userId: String(p.user?._id || ""),
          name: p.user?.name || "Player",
          email: p.user?.email || "",
          slug: p.slug,
          location: p.location || "",
          age: p.age || 0,
          positions: p.positions || [],
          availableNow: !!p.availableNow
        }))
    );
  } catch (error) {
    return dbAwareErrorResponse("Could not fetch players.", error);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const data = createSchema.parse(body);

    await connectToDatabase();
    const exists = await User.findOne({ email: data.email.toLowerCase() }).lean();
    if (exists) {
      return NextResponse.json({ message: "Email already exists." }, { status: 409 });
    }

    const passwordHash = await hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: "player"
    });

    const profile = await PlayerProfile.create({
      user: user._id,
      slug: buildUniqueSlug(data.name),
      headline: data.headline || "Football & Futsal Player",
      location: data.location,
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      foot: data.foot,
      positions: data.positions,
      achievements: [],
      timeline: []
    });

    return NextResponse.json({ id: String(profile._id), message: "Player created." }, { status: 201 });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not create player.", error);
  }
}
