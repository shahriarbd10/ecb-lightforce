import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { buildMemberKey, requirePlayerSession } from "@/lib/chat";
import ChatRequest from "@/lib/models/ChatRequest";
import ChatConversation from "@/lib/models/ChatConversation";

const actionSchema = z.object({
  action: z.enum(["accept", "reject", "cancel"])
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid request id." }, { status: 400 });

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid action." }, { status: 400 });

    await connectToDatabase();
    const myUserId = guard.userId;
    const chatRequest = await ChatRequest.findById(id);
    if (!chatRequest) return NextResponse.json({ message: "Request not found." }, { status: 404 });

    const requesterId = String(chatRequest.requester);
    const recipientId = String(chatRequest.recipient);

    if (![requesterId, recipientId].includes(myUserId)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    if (parsed.data.action === "cancel") {
      if (requesterId !== myUserId || chatRequest.status !== "pending") {
        return NextResponse.json({ message: "Only sender can cancel pending request." }, { status: 400 });
      }
      await ChatRequest.findByIdAndDelete(id);
      return NextResponse.json({ message: "Request cancelled." });
    }

    if (recipientId !== myUserId || chatRequest.status !== "pending") {
      return NextResponse.json({ message: "Only recipient can accept/reject pending request." }, { status: 400 });
    }

    const nextStatus = parsed.data.action === "accept" ? "accepted" : "rejected";
    chatRequest.status = nextStatus;
    chatRequest.handledAt = new Date();
    await chatRequest.save();

    if (nextStatus === "accepted") {
      await ChatConversation.findOneAndUpdate(
        { memberKey: buildMemberKey(requesterId, recipientId) },
        {
          $setOnInsert: {
            memberKey: buildMemberKey(requesterId, recipientId),
            members: [requesterId, recipientId],
            lastMessageAt: null
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json({ message: `Request ${nextStatus}.` });
  } catch (error) {
    return dbAwareErrorResponse("Could not update chat request.", error);
  }
}

