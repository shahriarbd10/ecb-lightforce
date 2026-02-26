import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { buildMemberKey, requirePlayerSession } from "@/lib/chat";
import User from "@/lib/models/User";
import PlayerProfile from "@/lib/models/PlayerProfile";
import ChatRequest from "@/lib/models/ChatRequest";
import ChatConversation from "@/lib/models/ChatConversation";

const sendRequestSchema = z.object({
  recipientUserId: z.string().min(1)
});

async function getPlayerSummary(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, any>();

  const users = await User.find({ _id: { $in: uniqueIds }, role: "player" }).select("name").lean();
  const profiles = await PlayerProfile.find({ user: { $in: uniqueIds } })
    .select("user slug location headline profilePhoto profilePhotoMeta photos")
    .lean();
  const profileMap = new Map(profiles.map((p: any) => [String(p.user), p]));
  const result = new Map<string, any>();

  for (const user of users as any[]) {
    const profile = profileMap.get(String(user._id));
    result.set(String(user._id), {
      userId: String(user._id),
      name: user.name || "Player",
      slug: profile?.slug || "",
      location: profile?.location || "",
      headline: profile?.headline || "Football & Futsal Player",
      profilePhoto: profile?.profilePhoto || profile?.photos?.[0] || "",
      profilePhotoMeta: profile?.profilePhotoMeta || { x: 50, y: 50, zoom: 1 }
    });
  }

  return result;
}

export async function GET() {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    await connectToDatabase();
    const myUserId = guard.userId;

    const requests = await ChatRequest.find({
      $or: [{ requester: myUserId }, { recipient: myUserId }]
    })
      .sort({ updatedAt: -1 })
      .lean();

    const userIds = requests.flatMap((r: any) => [String(r.requester), String(r.recipient)]);
    const summaryMap = await getPlayerSummary(userIds);

    const incomingPending = requests
      .filter((r: any) => String(r.recipient) === myUserId && r.status === "pending")
      .map((r: any) => ({
        id: String(r._id),
        status: r.status,
        createdAt: r.createdAt,
        from: summaryMap.get(String(r.requester)) || null
      }))
      .filter((r) => r.from);

    const outgoingPending = requests
      .filter((r: any) => String(r.requester) === myUserId && r.status === "pending")
      .map((r: any) => ({
        id: String(r._id),
        status: r.status,
        createdAt: r.createdAt,
        to: summaryMap.get(String(r.recipient)) || null
      }))
      .filter((r) => r.to);

    const accepted = requests
      .filter((r: any) => r.status === "accepted")
      .map((r: any) => {
        const peerId = String(r.requester) === myUserId ? String(r.recipient) : String(r.requester);
        return {
          id: String(r._id),
          status: r.status,
          updatedAt: r.updatedAt,
          peer: summaryMap.get(peerId) || null
        };
      })
      .filter((r) => r.peer);

    return NextResponse.json({ incomingPending, outgoingPending, accepted });
  } catch (error) {
    return dbAwareErrorResponse("Could not load chat requests.", error);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    const body = await request.json();
    const parsed = sendRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid chat request payload." }, { status: 400 });
    }

    await connectToDatabase();
    const requesterId = guard.userId;
    const recipientId = parsed.data.recipientUserId;

    if (!Types.ObjectId.isValid(recipientId)) {
      return NextResponse.json({ message: "Invalid recipient." }, { status: 400 });
    }
    if (recipientId === requesterId) {
      return NextResponse.json({ message: "You cannot chat request yourself." }, { status: 400 });
    }

    const recipient = await User.findOne({ _id: recipientId, role: "player" }).select("_id").lean();
    if (!recipient) {
      return NextResponse.json({ message: "Recipient not found." }, { status: 404 });
    }

    const existingConversation = await ChatConversation.findOne({
      memberKey: buildMemberKey(requesterId, recipientId)
    })
      .select("_id")
      .lean();
    if (existingConversation) {
      return NextResponse.json({ message: "Conversation already available." });
    }

    const reverse = await ChatRequest.findOne({ requester: recipientId, recipient: requesterId }).lean();
    if (reverse?.status === "pending") {
      const accepted = await ChatRequest.findByIdAndUpdate(
        reverse._id,
        { $set: { status: "accepted", handledAt: new Date() } },
        { new: true }
      ).lean();
      await ChatConversation.findOneAndUpdate(
        { memberKey: buildMemberKey(requesterId, recipientId) },
        { $setOnInsert: { memberKey: buildMemberKey(requesterId, recipientId), members: [requesterId, recipientId] } },
        { upsert: true, new: true }
      );
      return NextResponse.json({ message: "Request auto-accepted from existing pending invite.", requestId: String(accepted?._id) });
    }

    const updated = await ChatRequest.findOneAndUpdate(
      { requester: requesterId, recipient: recipientId },
      { $set: { status: "pending", handledAt: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ message: "Chat request sent.", requestId: String(updated?._id) });
  } catch (error) {
    return dbAwareErrorResponse("Could not send chat request.", error);
  }
}

