import net from "net";
import tls from "tls";

function toBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function normalizeNewlines(value) {
  return String(value || "").replace(/\r?\n/g, "\r\n");
}

function sanitizeSmtpData(value) {
  return normalizeNewlines(value).replace(/^\./gm, "..");
}

function parseArgs(argv) {
  const args = { send: false, to: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--send") args.send = true;
    if (token === "--to" && argv[i + 1]) args.to = argv[i + 1];
  }
  return args;
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
      const timeout = setTimeout(() => {
        reject(new Error("SMTP timeout while waiting for server response"));
      }, timeoutMs);
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

function getConfig() {
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = getConfig();
  const to = (args.to || process.env.SMTP_TEST_TO || cfg.sender).trim();

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

  if (args.send) {
    await writeLine(secure, "DATA");
    await reader.readResponse([354]);

    const html = [
      "<div style=\"font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a\">",
      "<h2 style=\"margin:0 0 10px\">Welcome to ECB Lightforce</h2>",
      "<p style=\"margin:0 0 10px\">Your football journey is live. Keep your profile sharp and match-ready.</p>",
      "<p style=\"margin:0\">Play strong, stay ready,<br/>Team ECB Lightforce</p>",
      "</div>"
    ].join("");

    const data = [
      `From: ${cfg.senderName} <${cfg.sender}>`,
      `To: ${to}`,
      "Subject: ECB Lightforce Local SMTP Test",
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
  }

  await writeLine(secure, "QUIT");
  await reader.readResponse([221]).catch(() => null);
  await new Promise((resolve) => secure.end(resolve));

  if (args.send) {
    console.log(`SMTP send OK. Mail delivered to ${to}`);
  } else {
    console.log(`SMTP verify OK. Auth and recipient accepted for ${to}`);
    console.log("Run with --send to send an actual message.");
  }
}

main().catch((error) => {
  console.error("SMTP local test failed:", error?.message || error);
  process.exit(1);
});
