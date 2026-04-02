import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import PasswordResetToken from "@/lib/models/PasswordResetToken";
import { hashPasswordResetToken } from "@/lib/password-reset";

const resetSchema = z.object({
  token: z.string().min(20).max(300),
  password: z.string().min(6).max(72)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid reset data." }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(parsed.data.token);
    await connectToDatabase();

    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return NextResponse.json({ message: "Invalid reset request." }, { status: 400 });
    }

    user.passwordHash = await hash(parsed.data.password, 10);
    await user.save();

    resetRecord.usedAt = new Date();
    await resetRecord.save();
    await PasswordResetToken.deleteMany({
      userId: resetRecord.userId,
      _id: { $ne: resetRecord._id }
    });

    return NextResponse.json({ message: "Password reset successful." });
  } catch {
    return NextResponse.json({ message: "Could not reset password." }, { status: 500 });
  }
}
