import { MongoClient } from "mongodb";
import dns from "node:dns";
import net from "net";
import tls from "tls";

function parseArgs(argv) {
  const args = {
    send: false,
    role: "all",
    limit: 200
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--send") args.send = true;
    if (token === "--role" && argv[i + 1]) args.role = argv[i + 1];
    if (token === "--limit" && argv[i + 1]) args.limit = Number(argv[i + 1]);
  }

  if (!["player", "org", "all"].includes(args.role)) {
    throw new Error("--role must be one of: player, org, all");
  }
  if (!Number.isFinite(args.limit) || args.limit < 1 || args.limit > 2000) {
    throw new Error("--limit must be a number between 1 and 2000");
  }

  return args;
}

function normalizeNewlines(value) {
  return String(value || "").replace(/\r?\n/g, "\r\n");
}

function sanitizeSmtpData(value) {
  return normalizeNewlines(value).replace(/^\./gm, "..");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildUserUpdateMail({ name, appUrl }) {
  const safeName = escapeHtml(name || "Player");
  const safeBase = escapeHtml(String(appUrl || "http://localhost:3000").replace(/\/$/, ""));

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
          <p style="margin:0 0 18px">
            <a href="${safeBase}/dashboard" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700">Go To My Dashboard</a>
            <a href="${safeBase}/ecb-hub" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#071952;color:#ffffff;text-decoration:none;font-weight:700;margin-left:8px">Enter Lightforce Hub</a>
          </p>
          <p style="margin:0;color:#0f172a;font-weight:600">Play strong, stay ready,</p>
          <p style="margin:2px 0 0;color:#0f172a">Team ECB Lightforce</p>
        </div>
      </div>
    `
  };
}

function toBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function createReader(socket) {
  let buffer = "";
  const queue = [];
  let resolver = null;

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    const parts = buffer.split("\r\n");
    buffer = parts.pop() || "";
    for (const line of parts) {
      if (line) queue.push(line);
    }
    if (resolver) {
      const fn = resolver;
      resolver = null;
      fn();
    }
  });

  async function nextLine(timeoutMs = 15000) {
    if (queue.length > 0) return queue.shift();
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("SMTP timeout while waiting for server response")), timeoutMs);
      resolver = () => {
        clearTimeout(timeout);
        resolve(queue.shift());
      };
    });
  }

  async function readResponse(expectedCodes) {
    const lines = [];
    while (true) {
      const line = await nextLine();
      lines.push(line);
      const match = line.match(/^(\d{3})([ -])(.*)$/);
      if (!match) continue;
      if (match[2] === " ") {
        const code = Number(match[1]);
        if (expectedCodes && !expectedCodes.includes(code)) {
          throw new Error(`SMTP unexpected response ${code}: ${lines.join(" | ")}`);
        }
        return { code, lines };
      }
    }
  }

  return { readResponse };
}

async function writeLine(socket, line) {
  await new Promise((resolve, reject) => {
    socket.write(`${line}\r\n`, (err) => (err ? reject(err) : resolve()));
  });
}

function getMailConfig() {
  const host = (process.env.BREVO_HOST || "smtp-relay.brevo.com").trim();
  const port = Number((process.env.BREVO_PORT || "587").trim());
  const user = (process.env.BREVO_USER || "").trim();
  const pass = (process.env.BREVO_PASS || "").trim();
  const sender = (process.env.EMAIL_SENDER_EMAIL || "").trim();
  const senderName = (process.env.EMAIL_SENDER_NAME || "ECB Lightforce").trim();

  if (!host || !Number.isFinite(port) || port <= 0) throw new Error("Invalid BREVO_HOST/BREVO_PORT");
  if (!user || !pass) throw new Error("Missing BREVO_USER/BREVO_PASS");
  if (!sender) throw new Error("Missing EMAIL_SENDER_EMAIL");

  return { host, port, user, pass, sender, senderName };
}

async function sendSmtpMail({ to, subject, html }) {
  const cfg = getMailConfig();

  const plain = net.createConnection({ host: cfg.host, port: cfg.port });
  plain.setTimeout(20000);
  plain.on("timeout", () => plain.destroy(new Error("SMTP socket timeout")));
  await new Promise((resolve, reject) => {
    plain.once("connect", resolve);
    plain.once("error", reject);
  });

  const plainReader = createReader(plain);
  await plainReader.readResponse([220]);
  await writeLine(plain, "EHLO ecblightforce.local");
  await plainReader.readResponse([250]);
  await writeLine(plain, "STARTTLS");
  await plainReader.readResponse([220]);

  const secure = tls.connect({ socket: plain, servername: cfg.host, rejectUnauthorized: true });
  secure.setTimeout(20000);
  secure.on("timeout", () => secure.destroy(new Error("SMTP TLS timeout")));
  await new Promise((resolve, reject) => {
    secure.once("secureConnect", resolve);
    secure.once("error", reject);
  });

  const reader = createReader(secure);
  await writeLine(secure, "EHLO ecblightforce.local");
  await reader.readResponse([250]);
  await writeLine(secure, "AUTH LOGIN");
  await reader.readResponse([334]);
  await writeLine(secure, toBase64(cfg.user));
  await reader.readResponse([334]);
  await writeLine(secure, toBase64(cfg.pass));
  await reader.readResponse([235]);
  await writeLine(secure, `MAIL FROM:<${cfg.sender}>`);
  await reader.readResponse([250]);
  await writeLine(secure, `RCPT TO:<${to}>`);
  await reader.readResponse([250, 251]);
  await writeLine(secure, "DATA");
  await reader.readResponse([354]);

  const data = [
    `From: ${cfg.senderName} <${cfg.sender}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    sanitizeSmtpData(html),
    "."
  ].join("\r\n");

  await new Promise((resolve, reject) => {
    secure.write(`${data}\r\n`, (err) => (err ? reject(err) : resolve()));
  });
  await reader.readResponse([250]);
  await writeLine(secure, "QUIT");
  await reader.readResponse([221]).catch(() => null);
  await new Promise((resolve) => secure.end(resolve));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
  const mongoUri = (process.env.MONGODB_URI || "").trim();

  if (!mongoUri) throw new Error("Missing MONGODB_URI");

  const query =
    args.role === "player"
      ? { role: "player" }
      : args.role === "org"
        ? { role: "org" }
        : { role: { $in: ["player", "org"] } };

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
  } catch (error) {
    const message = String(error?.message || "");
    const isSrvLookupError = message.includes("querySrv") || message.includes("ECONNREFUSED");
    if (mongoUri.startsWith("mongodb+srv://") && isSrvLookupError) {
      const override =
        (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      dns.setServers(override.length ? override : ["8.8.8.8", "1.1.1.1"]);
      await client.connect();
    } else {
      throw error;
    }
  }
  const db = client.db("ecb_lightforce");
  const users = await db
    .collection("users")
    .find(query, { projection: { name: 1, email: 1, role: 1 }, sort: { createdAt: -1 }, limit: args.limit })
    .toArray();

  const targets = users
    .map((u) => ({ name: String(u?.name || "Player"), email: String(u?.email || "").trim() }))
    .filter((u) => u.email.includes("@"));

  if (!targets.length) {
    console.log("No users matched the target criteria.");
    await client.close();
    return;
  }

  console.log(`Found ${targets.length} target user(s). Mode: ${args.send ? "SEND" : "PREVIEW"}`);
  if (!args.send) {
    for (const target of targets) {
      console.log(`TARGET ${target.email}`);
    }
  }
  let sent = 0;
  let failed = 0;

  for (const target of targets) {
    const mail = buildUserUpdateMail({ name: target.name, appUrl });
    if (!args.send) {
      sent += 1;
      continue;
    }
    try {
      await sendSmtpMail({ to: target.email, subject: mail.subject, html: mail.html });
      sent += 1;
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`FAILED ${target.email} :: ${reason}`);
    }
  }

  console.log(`Completed. Total=${targets.length} Success=${sent} Failed=${failed}`);
  await client.close();
}

main().catch((error) => {
  console.error("Bulk user mail failed:", error?.message || error);
  process.exit(1);
});
