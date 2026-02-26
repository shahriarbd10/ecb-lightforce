import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbAwareErrorResponse } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";
import HubPost from "@/lib/models/HubPost";
import PlayerProfile from "@/lib/models/PlayerProfile";
import User from "@/lib/models/User";

const postSchema = z.object({
  type: z.enum(["achievement", "match_update", "general"]).default("general"),
  title: z.string().min(2).max(140),
  content: z.string().min(2).max(1200),
  image: z.string().url().optional().or(z.literal(""))
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user?.id ? String(session.user.id) : "";
    await connectToDatabase();

    const posts = await HubPost.find({ isActive: true })
      .populate("user", "name role")
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    const playerPosts = posts.filter((post: any) => post.user?.role === "player");
    const userIds = playerPosts.map((post: any) => String(post.user?._id || "")).filter(Boolean);
    const commentUserIds = playerPosts.flatMap((post: any) =>
      (post.comments || []).map((c: any) => String(c.user || "")).filter(Boolean)
    );
    const allUserIds = Array.from(new Set([...userIds, ...commentUserIds]));
    const profiles = await PlayerProfile.find({ user: { $in: userIds } })
      .select("user slug profilePhoto profilePhotoMeta")
      .lean();
    const commentUsers = await User.find({ _id: { $in: allUserIds } }).select("name").lean();
    const profileMap = new Map(profiles.map((p: any) => [String(p.user), p]));
    const commentUserMap = new Map(commentUsers.map((u: any) => [String(u._id), u.name || "Player"]));

    return NextResponse.json(
      playerPosts.map((post: any) => {
        const profile: any = profileMap.get(String(post.user?._id || ""));
        return {
          id: String(post._id),
          type: post.type,
          title: post.title,
          content: post.content,
          image: post.image || "",
          createdAt: post.createdAt,
          likeCount: Array.isArray(post.likes) ? post.likes.length : 0,
          likedByMe: Array.isArray(post.likes) ? post.likes.some((u: any) => String(u) === me) : false,
          commentCount: Array.isArray(post.comments) ? post.comments.length : 0,
          comments: Array.isArray(post.comments)
            ? post.comments.slice(-20).map((c: any) => ({
                id: String(c._id || `${post._id}-${c.createdAt}`),
                text: c.text || "",
                createdAt: c.createdAt || post.createdAt,
                userId: String(c.user || ""),
                authorName: commentUserMap.get(String(c.user || "")) || "Player"
              }))
            : [],
          author: {
            name: post.user?.name || "Player",
            slug: profile?.slug || "",
            profilePhoto: profile?.profilePhoto || "",
            profilePhotoMeta: profile?.profilePhotoMeta || { x: 50, y: 50, zoom: 1 }
          }
        };
      })
    );
  } catch (error) {
    return dbAwareErrorResponse("Could not fetch hub timeline.", error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "player") {
      return NextResponse.json({ message: "Only players can post on timeline." }, { status: 403 });
    }

    const body = await request.json();
    const payload = postSchema.parse(body);

    await connectToDatabase();
    const created = await HubPost.create({
      user: session.user.id,
      type: payload.type,
      title: payload.title,
      content: payload.content,
      image: payload.image || ""
    });

    return NextResponse.json({ id: String(created._id), message: "Post published." }, { status: 201 });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return dbAwareErrorResponse("Could not publish timeline post.", error);
  }
}
