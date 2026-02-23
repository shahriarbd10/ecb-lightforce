import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import User from "@/lib/models/User";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { buildUniqueSlug } from "@/lib/slug";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  location: z.string().min(2).max(120),
  age: z.coerce.number().min(8).max(60),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(200),
  foot: z.enum(["left", "right", "both"]).default("right"),
  positions: z.array(z.string()).min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    await connectToDatabase();

    const exists = await User.findOne({ email: data.email.toLowerCase() });
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

    await PlayerProfile.create({
      user: user._id,
      slug: buildUniqueSlug(data.name),
      location: data.location,
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      foot: data.foot,
      positions: data.positions,
      achievements: [],
      timeline: []
    });

    return NextResponse.json({ message: "Registration successful." }, { status: 201 });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not register player.", error);
  }
}
