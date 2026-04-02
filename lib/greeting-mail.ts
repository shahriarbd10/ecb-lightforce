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
    subject: "Welcome to ECB Lightforce",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Welcome to ECB Lightforce, ${safeName}!</h2>
        <p style="margin:0 0 12px">Your player account is now active.</p>
        <p style="margin:0 0 18px">
          You can log in and complete your profile to improve visibility in the ECB Hub.
        </p>
        <p style="margin:0 0 18px">
          <a href="${safeLoginUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600">
            Open ECB Lightforce
          </a>
        </p>
        <p style="margin:0;color:#4b5563">If the button does not work, open this link:</p>
        <p style="margin:8px 0 0">
          <a href="${safeLoginUrl}" style="color:#2563eb;text-decoration:none">${safeLoginUrl}</a>
        </p>
      </div>
    `
  });
}
