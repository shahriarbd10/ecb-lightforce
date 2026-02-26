import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { requirePlayerSession } from "@/lib/chat";
import ChatRequest from "@/lib/models/ChatRequest";
import ChatConversation from "@/lib/models/ChatConversation";
import ChatMessage from "@/lib/models/ChatMessage";

export async function GET() {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    await connectToDatabase();
    const myUserId = guard.userId;
    const myObjectId = new Types.ObjectId(myUserId);

    const [incomingRequestCount, conversations] = await Promise.all([
      ChatRequest.countDocuments({ recipient: myUserId, status: "pending" }),
      ChatConversation.find({ members: myUserId }).select("_id").lean()
    ]);

    const convoIds = conversations.map((c: any) => c._id);
    let unreadMessageCount = 0;
    if (convoIds.length) {
      unreadMessageCount = await ChatMessage.countDocuments({
        conversation: { $in: convoIds },
        sender: { $ne: myObjectId },
        seenBy: { $ne: myObjectId }
      });
    }

    return NextResponse.json({
      incomingRequestCount,
      unreadMessageCount,
      hasUnread: incomingRequestCount > 0 || unreadMessageCount > 0
    });
  } catch (error) {
    return dbAwareErrorResponse("Could not load chat alerts.", error);
  }
}

