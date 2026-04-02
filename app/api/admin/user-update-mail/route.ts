import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { sendSmtpMail } from "@/lib/smtp-mail";
import { resolveAppBaseUrl } from "@/lib/app-url";
import { buildUserUpdateMail } from "@/lib/user-update-mail";

const payloadSchema = z.object({
  preview: z.boolean().optional(),
  testEmail: z.string().email().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  role: z.enum(["player", "org", "all"]).optional()
});

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized." }, { status: 401 })
    };
  }
  if (session.user.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Forbidden." }, { status: 403 })
    };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  const guard = await assertAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = payloadSchema.parse(await request.json().catch(() => ({})));
    const appUrl = resolveAppBaseUrl(request);

    if (body.testEmail) {
      const mail = buildUserUpdateMail({
        name: "ECB Player",
        appUrl
      });

      if (!body.preview) {
        await sendSmtpMail({
          to: body.testEmail,
          subject: mail.subject,
          html: mail.html
        });
      }

      return NextResponse.json({
        message: body.preview ? "Preview generated for test email." : "Test email sent successfully.",
        target: body.testEmail,
        preview: body.preview ?? false,
        subject: mail.subject,
        html: mail.html
      });
    }

    await connectToDatabase();

    const roleFilter =
      body.role === "org" ? { role: "org" } : body.role === "all" ? { role: { $in: ["player", "org"] } } : { role: "player" };

    const users = await User.find({ ...roleFilter })
      .select("name email role")
      .sort({ createdAt: -1 })
      .limit(body.limit ?? 50)
      .lean();

    const targets = users
      .map((u: any) => ({ name: String(u?.name || "Player"), email: String(u?.email || "").trim(), role: String(u?.role || "player") }))
      .filter((u) => u.email.includes("@"));

    if (!targets.length) {
      return NextResponse.json({ message: "No matching users found for mailing.", sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;
    const failures: Array<{ email: string; reason: string }> = [];

    for (const user of targets) {
      const mail = buildUserUpdateMail({ name: user.name, appUrl });
      if (body.preview) {
        sent += 1;
        continue;
      }

      try {
        await sendSmtpMail({
          to: user.email,
          subject: mail.subject,
          html: mail.html
        });
        sent += 1;
      } catch (error: any) {
        failed += 1;
        failures.push({
          email: user.email,
          reason: String(error?.message || "Unknown mail error")
        });
      }
    }

    return NextResponse.json({
      message: body.preview
        ? `Preview completed for ${sent} user(s).`
        : `Mailing completed. Sent: ${sent}, Failed: ${failed}.`,
      preview: body.preview ?? false,
      total: targets.length,
      sent,
      failed,
      failures: failures.slice(0, 20)
    });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ message: "Invalid payload.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Could not process user update mailing." }, { status: 500 });
  }
}
