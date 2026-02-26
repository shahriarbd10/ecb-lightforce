import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { requirePlayerSession } from "@/lib/chat";
import ChatConversation from "@/lib/models/ChatConversation";
import ChatMessage from "@/lib/models/ChatMessage";

const sendMessageSchema = z
  .object({
    text: z.string().max(1200).optional().or(z.literal("")),
    linkUrl: z.string().url().max(600).optional().or(z.literal("")),
    imageUrl: z.string().url().max(1200).optional().or(z.literal(""))
  })
  .refine((v) => Boolean(v.text?.trim() || v.linkUrl || v.imageUrl), {
    message: "Message cannot be empty."
  });

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid conversation id." }, { status: 400 });

    await connectToDatabase();
    const myUserId = guard.userId;
    const myObjectId = new Types.ObjectId(myUserId);
    const conversation = await ChatConversation.findOne({ _id: id, members: myUserId }).select("_id members").lean();
    if (!conversation) return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
    const recipientId = (conversation as any).members?.map((m: any) => String(m)).find((m: string) => m !== myUserId) || "";

    await ChatMessage.updateMany(
      { conversation: id, sender: { $ne: myObjectId }, seenBy: { $ne: myObjectId } },
      { $addToSet: { seenBy: myObjectId } }
    );

    const messages = await ChatMessage.find({ conversation: id }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({
      messages: messages.map((m: any) => ({
        id: String(m._id),
        text: m.text || "",
        linkUrl: m.linkUrl || "",
        imageUrl: m.imageUrl || "",
        createdAt: m.createdAt,
        isMine: String(m.sender) === myUserId,
        seen: Array.isArray(m.seenBy) ? m.seenBy.some((u: any) => String(u) === recipientId) : false
      }))
    });
  } catch (error) {
    return dbAwareErrorResponse("Could not load messages.", error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePlayerSession();
    if (!guard.ok) return NextResponse.json({ message: guard.message }, { status: guard.status });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid conversation id." }, { status: 400 });

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid message data." }, { status: 400 });

    await connectToDatabase();
    const myUserId = guard.userId;
    const conversation = await ChatConversation.findOne({ _id: id, members: myUserId }).select("_id").lean();
    if (!conversation) return NextResponse.json({ message: "Conversation not found." }, { status: 404 });

    const text = parsed.data.text?.trim() || "";
    const linkUrl = parsed.data.linkUrl || "";
    const imageUrl = parsed.data.imageUrl || "";
    const created = await ChatMessage.create({
      conversation: id,
      sender: myUserId,
      text,
      linkUrl,
      imageUrl,
      seenBy: [myUserId]
    });
    await ChatConversation.findByIdAndUpdate(id, { $set: { lastMessageAt: new Date() } });

    return NextResponse.json({
      message: {
        id: String(created._id),
        text,
        linkUrl,
        imageUrl,
        createdAt: created.createdAt,
        isMine: true,
        seen: false
      }
    });
  } catch (error) {
    return dbAwareErrorResponse("Could not send message.", error);
  }
}
