import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import HubPost from "@/lib/models/HubPost";
import User from "@/lib/models/User";

const commentSchema = z.object({
  text: z.string().trim().min(1).max(400)
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid post id." }, { status: 400 });
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid comment." }, { status: 400 });

    await connectToDatabase();
    const [post, user] = await Promise.all([HubPost.findById(id), User.findById(session.user.id).select("name").lean()]);
    if (!post || !post.isActive) return NextResponse.json({ message: "Post not found." }, { status: 404 });

    const comment = {
      user: session.user.id,
      text: parsed.data.text,
      createdAt: new Date()
    };
    post.comments = [...(post.comments || []), comment] as any;
    await post.save();

    return NextResponse.json({
      comment: {
        id: String((post.comments as any[])[post.comments.length - 1]?._id || `${post._id}-${Date.now()}`),
        userId: String(session.user.id),
        authorName: user?.name || "Player",
        text: comment.text,
        createdAt: comment.createdAt
      },
      commentCount: post.comments.length
    });
  } catch (error) {
    return dbAwareErrorResponse("Could not add comment.", error);
  }
}

