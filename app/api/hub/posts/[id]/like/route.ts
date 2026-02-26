import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import HubPost from "@/lib/models/HubPost";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid post id." }, { status: 400 });

    await connectToDatabase();
    const post = await HubPost.findById(id);
    if (!post || !post.isActive) return NextResponse.json({ message: "Post not found." }, { status: 404 });

    const userId = String(session.user.id);
    const liked = (post.likes || []).some((u: any) => String(u) === userId);
    if (liked) {
      post.likes = (post.likes || []).filter((u: any) => String(u) !== userId) as any;
    } else {
      post.likes = [...(post.likes || []), userId] as any;
    }
    await post.save();

    return NextResponse.json({ likeCount: post.likes.length, likedByMe: !liked });
  } catch (error) {
    return dbAwareErrorResponse("Could not update like.", error);
  }
}

