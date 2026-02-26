import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth";

export async function requirePlayerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, status: 401, message: "Unauthorized." };
  if (session.user.role !== "player") return { ok: false as const, status: 403, message: "Only players can use chat." };
  return { ok: true as const, userId: String(session.user.id) };
}

export function buildMemberKey(userA: string | Types.ObjectId, userB: string | Types.ObjectId) {
  return [String(userA), String(userB)].sort().join(":");
}

