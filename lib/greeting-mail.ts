import { sendSmtpMail } from "@/lib/smtp-mail";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type GreetingMailInput = {
  to: string;
  name: string;
  loginUrl: string;
};

export async function sendGreetingMail({ to, name, loginUrl }: GreetingMailInput) {
  const safeName = escapeHtml(name || "Player");
  const safeLoginUrl = escapeHtml(loginUrl);

  await sendSmtpMail({
    to,
    subject: "Welcome To ECB Lightforce - You Are Match Ready",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Welcome to ECB Lightforce, ${safeName}!</h2>
        <p style="margin:0 0 12px">Your player account is active and your football journey is now live.</p>
        <p style="margin:0 0 18px">
          Step in, complete your profile, and show your strengths so clubs and communities can discover your game.
        </p>
        <p style="margin:0 0 18px">
          <a href="${safeLoginUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600">
            Enter ECB Lightforce
          </a>
        </p>
        <p style="margin:0 0 14px;color:#334155">
          Keep your profile updated, share your progress, and stay match-ready every week.
        </p>
        <p style="margin:0;color:#4b5563">If the button does not work, open this link:</p>
        <p style="margin:8px 0 0">
          <a href="${safeLoginUrl}" style="color:#2563eb;text-decoration:none">${safeLoginUrl}</a>
        </p>
      </div>
    `
  });
}
