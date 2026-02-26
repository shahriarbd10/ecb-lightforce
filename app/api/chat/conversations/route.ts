import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { requirePlayerSession } from "@/lib/chat";
import ChatConversation from "@/lib/models/ChatConversation";
import ChatMessage from "@/lib/models/ChatMessage";
import User from "@/lib/models/User";
import PlayerProfile from "@/lib/models/PlayerProfile";

export async function GET() {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    await connectToDatabase();
    const myUserId = guard.userId;
    const myObjectId = new Types.ObjectId(myUserId);

    const conversations = await ChatConversation.find({ members: myUserId }).sort({ lastMessageAt: -1, updatedAt: -1 }).lean();
    const peerIds = conversations
      .map((c: any) => (c.members || []).map((m: any) => String(m)).find((id: string) => id !== myUserId))
      .filter(Boolean) as string[];

    const users = await User.find({ _id: { $in: peerIds }, role: "player" }).select("name").lean();
    const profiles = await PlayerProfile.find({ user: { $in: peerIds } })
      .select("user slug location headline profilePhoto profilePhotoMeta photos")
      .lean();
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));
    const profileMap = new Map(profiles.map((p: any) => [String(p.user), p]));

    const convoIds = conversations.map((c: any) => c._id);
    const [lastMessages, unreadRows] = await Promise.all([
      ChatMessage.aggregate<{ _id: any; text: string; linkUrl: string; imageUrl: string; createdAt: Date }>([
        { $match: { conversation: { $in: convoIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$conversation",
            text: { $first: "$text" },
            linkUrl: { $first: "$linkUrl" },
            imageUrl: { $first: "$imageUrl" },
            createdAt: { $first: "$createdAt" }
          }
        }
      ]),
      ChatMessage.aggregate<{ _id: any; unreadCount: number }>([
        {
          $match: {
            conversation: { $in: convoIds },
            sender: { $ne: myObjectId },
            seenBy: { $ne: myObjectId }
          }
        },
        { $group: { _id: "$conversation", unreadCount: { $sum: 1 } } }
      ])
    ]);

    const lastMap = new Map(lastMessages.map((m) => [String(m._id), m]));
    const unreadMap = new Map(unreadRows.map((u) => [String(u._id), u.unreadCount]));

    return NextResponse.json({
      conversations: conversations
        .map((c: any) => {
          const peerId = (c.members || []).map((m: any) => String(m)).find((id: string) => id !== myUserId);
          if (!peerId) return null;
          const user = userMap.get(peerId);
          if (!user) return null;
          const profile = profileMap.get(peerId);
          const last = lastMap.get(String(c._id));
          return {
            id: String(c._id),
            peer: {
              userId: peerId,
              name: user.name || "Player",
              slug: profile?.slug || "",
              location: profile?.location || "",
              headline: profile?.headline || "Football & Futsal Player",
              profilePhoto: profile?.profilePhoto || profile?.photos?.[0] || "",
              profilePhotoMeta: profile?.profilePhotoMeta || { x: 50, y: 50, zoom: 1 }
            },
            activeNow: Boolean(c.lastMessageAt && Date.now() - new Date(c.lastMessageAt).getTime() < 5 * 60 * 1000),
            lastActiveAt: c.lastMessageAt || c.updatedAt,
            lastMessage: last
              ? {
                  text: last.text || "",
                  linkUrl: last.linkUrl || "",
                  imageUrl: last.imageUrl || "",
                  createdAt: last.createdAt
                }
              : null,
            unreadCount: unreadMap.get(String(c._id)) || 0,
            updatedAt: c.updatedAt
          };
        })
        .filter(Boolean)
    });
  } catch (error) {
    return dbAwareErrorResponse("Could not load conversations.", error);
  }
}
