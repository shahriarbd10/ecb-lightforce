import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import PasswordResetToken from "@/lib/models/PasswordResetToken";
import {
  generatePasswordResetToken,
  getPasswordResetExpiryDate,
  hashPasswordResetToken
} from "@/lib/password-reset";
import { sendSmtpMail } from "@/lib/smtp-mail";
import { resolveAppBaseUrl } from "@/lib/app-url";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid registered email address")
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request data." }, { status: 400 });
    }

    await connectToDatabase();
    const email = parsed.data.email.toLowerCase().trim();
    const user = await User.findOne({ email }).select("_id email name");

    if (!user) {
      return NextResponse.json({ message: "This email is not registered." }, { status: 404 });
    }

    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = getPasswordResetExpiryDate();

    const tokenDoc = await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    const appUrl = resolveAppBaseUrl(req);
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const expiresText = expiresAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    const safeName = escapeHtml(user.name || "Player");
    const safeResetUrl = escapeHtml(resetUrl);

    try {
      await sendSmtpMail({
        to: user.email,
        subject: "ECB Lightforce password reset link",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
            <h2 style="margin-bottom:8px">Reset your ECB Lightforce password</h2>
            <p>Hello ${safeName},</p>
            <p>We received a request to reset your ECB Lightforce account password.</p>
            <p>
              <a href="${safeResetUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:white;text-decoration:none;border-radius:8px">
                Click here to reset password
              </a>
            </p>
            <p>If the button does not work, open this link:</p>
            <p><a href="${safeResetUrl}">${safeResetUrl}</a></p>
            <p>This link expires on <strong>${expiresText}</strong> (BD time) and can be used once.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `
      });
    } catch (err) {
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      const reason = err instanceof Error ? err.message : "SMTP send failed";
      console.error("Forgot password SMTP error:", reason);
      return NextResponse.json(
        { message: "Reset email could not be sent. Verify Brevo SMTP configuration." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Password reset link sent. Please check your inbox or spam."
    });
  } catch {
    return NextResponse.json({ message: "Could not process password reset request." }, { status: 500 });
  }
}
