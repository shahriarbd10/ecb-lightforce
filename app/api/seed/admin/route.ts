import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectForSeed, seedAdmin } from "@/lib/seeder";

const schema = z.object({
  seederKey: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  name: z.string().min(2).max(100),
  force: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const requiredKey = process.env.SEEDER_KEY;
    if (requiredKey && body.seederKey !== requiredKey) {
      return NextResponse.json({ message: "Invalid seeder key." }, { status: 403 });
    }
    if (!requiredKey && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ message: "Seeder key is required in non-development environments." }, { status: 403 });
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) return NextResponse.json({ message: "MONGODB_URI is missing." }, { status: 500 });

    await connectForSeed(uri);
    const result = await seedAdmin({
      email: body.email,
      password: body.password,
      name: body.name,
      force: !!body.force
    });
    await mongoose.disconnect();
    return NextResponse.json(result);
  } catch (error: any) {
    try {
      await mongoose.disconnect();
    } catch {}
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Could not seed admin." }, { status: 500 });
  }
}
