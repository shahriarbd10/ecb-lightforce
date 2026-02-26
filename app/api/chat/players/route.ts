import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { requirePlayerSession } from "@/lib/chat";
import User from "@/lib/models/User";
import PlayerProfile from "@/lib/models/PlayerProfile";
import ChatRequest from "@/lib/models/ChatRequest";
import ChatConversation from "@/lib/models/ChatConversation";

export async function GET() {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    await connectToDatabase();
    const myUserId = guard.userId;

    const users = await User.find({ role: "player", _id: { $ne: myUserId } }).select("name").lean();
    const userIds = users.map((u: any) => String(u._id));
    const profiles = await PlayerProfile.find({ user: { $in: userIds } })
      .select("user slug location headline profilePhoto profilePhotoMeta photos")
      .lean();
    const profileMap = new Map(profiles.map((p: any) => [String(p.user), p]));

    const requests = await ChatRequest.find({
      $or: [
        { requester: myUserId, recipient: { $in: userIds } },
        { recipient: myUserId, requester: { $in: userIds } }
      ]
    })
      .select("requester recipient status")
      .lean();
    const reqMap = new Map<string, any>();
    for (const req of requests as any[]) {
      const otherId = String(req.requester) === myUserId ? String(req.recipient) : String(req.requester);
      reqMap.set(otherId, req);
    }

    const conversations = await ChatConversation.find({ members: myUserId }).select("memberKey members").lean();
    const convMap = new Map<string, string>();
    for (const conv of conversations as any[]) {
      const otherId = (conv.members || []).map((m: any) => String(m)).find((m: string) => m !== myUserId);
      if (otherId) convMap.set(otherId, String(conv._id));
    }

    return NextResponse.json({
      players: users.map((u: any) => {
        const profile = profileMap.get(String(u._id));
        const req = reqMap.get(String(u._id));
        const requestDirection = req
          ? String(req.requester) === myUserId
            ? "outgoing"
            : "incoming"
          : "";
        return {
          userId: String(u._id),
          name: u.name || "Player",
          slug: profile?.slug || "",
          location: profile?.location || "",
          headline: profile?.headline || "Football & Futsal Player",
          profilePhoto: profile?.profilePhoto || profile?.photos?.[0] || "",
          profilePhotoMeta: profile?.profilePhotoMeta || { x: 50, y: 50, zoom: 1 },
          requestStatus: req?.status || "none",
          requestDirection,
          conversationId: convMap.get(String(u._id)) || ""
        };
      })
    });
  } catch (error) {
    return dbAwareErrorResponse("Could not load chat players.", error);
  }
}

