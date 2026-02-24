import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import PlayerProfile from "@/lib/models/PlayerProfile";
import User from "@/lib/models/User";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  if (session.user.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await context.params;
    await connectToDatabase();

    const profile = await PlayerProfile.findById(id).lean();
    if (!profile) {
      return NextResponse.json({ message: "Player not found." }, { status: 404 });
    }

    const user = await User.findById((profile as any).user).lean();
    if (!user || user.role !== "player") {
      return NextResponse.json({ message: "Only player accounts can be deleted from this endpoint." }, { status: 400 });
    }

    await Promise.all([PlayerProfile.findByIdAndDelete(id), User.findByIdAndDelete((profile as any).user)]);

    return NextResponse.json({ message: "Player deleted." });
  } catch (error) {
    return dbAwareErrorResponse("Could not delete player.", error);
  }
}
