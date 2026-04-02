type UserUpdateMailInput = {
  name: string;
  appUrl: string;
};

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildUserUpdateMail({ name, appUrl }: UserUpdateMailInput) {
  const safeName = escapeHtml(name || "Player");
  const base = appUrl.replace(/\/$/, "");
  const safeBase = escapeHtml(base);

  return {
    subject: "Welcome To The ECB Lightforce Squad",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.65;color:#0f172a;background:#f8fafc;padding:18px">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:20px 22px">
          <p style="margin:0 0 10px;font-size:14px;color:#0369a1;letter-spacing:.08em;text-transform:uppercase">ECB Lightforce Team Note</p>
          <h2 style="margin:0 0 10px;font-size:28px;line-height:1.25;color:#0b1f54">Welcome, ${safeName}. You are officially in the squad.</h2>
          <p style="margin:0 0 16px;color:#334155">
            Great to have you with us. ECB Lightforce is your football home ground to show your game,
            build your profile, and stay visible for coaches, clubs, and football communities.
          </p>

          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px 14px 8px;margin:0 0 16px">
            <p style="margin:0 0 8px;font-weight:700;color:#0f172a">Kick off with these steps:</p>
            <ul style="margin:0;padding-left:18px;color:#334155">
              <li>Complete your player profile with positions, bio, and achievements</li>
              <li>Upload your best training and match moments</li>
              <li>Stay active in the Lightforce Hub and be easier to discover</li>
              <li>Connect with players and organizations in chat</li>
              <li>Follow updates from the football community</li>
            </ul>
          </div>

          <p style="margin:0 0 12px;color:#334155">
            Small updates every week make a big difference. The stronger your profile, the stronger your visibility.
          </p>

          <p style="margin:0 0 18px">
            <a href="${safeBase}/dashboard" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700">
              Go To My Dashboard
            </a>
            <a href="${safeBase}/ecb-hub" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#071952;color:#ffffff;text-decoration:none;font-weight:700;margin-left:8px">
              Enter Lightforce Hub
            </a>
          </p>

          <p style="margin:0 0 8px;color:#64748b">If the buttons do not work, copy and open:</p>
          <p style="margin:0 0 4px"><a href="${safeBase}/dashboard" style="color:#2563eb;text-decoration:none">${safeBase}/dashboard</a></p>
          <p style="margin:0 0 14px"><a href="${safeBase}/ecb-hub" style="color:#2563eb;text-decoration:none">${safeBase}/ecb-hub</a></p>

          <p style="margin:0;color:#0f172a;font-weight:600">Play strong, stay ready,</p>
          <p style="margin:2px 0 0;color:#0f172a">Team ECB Lightforce</p>
        </div>
      </div>
    `
  };
}
