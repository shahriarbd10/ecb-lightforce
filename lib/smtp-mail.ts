import net from "net";
import tls from "tls";

type MailInput = {
  to: string;
  subject: string;
  html: string;
};

type SmtpResponse = {
  code: number;
  lines: string[];
};

type SocketLike = net.Socket | tls.TLSSocket;

function toBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function normalizeNewlines(value: string) {
  return value.replace(/\r?\n/g, "\r\n");
}

function sanitizeSmtpData(value: string) {
  return normalizeNewlines(value).replace(/^\./gm, "..");
}

function createResponseReader(socket: SocketLike) {
  let buffer = "";
  const queue: string[] = [];
  let resolver: (() => void) | null = null;

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    const parts = buffer.split("\r\n");
    buffer = parts.pop() || "";
    for (const line of parts) {
      if (!line) continue;
      queue.push(line);
    }
    if (resolver) {
      const fn = resolver;
      resolver = null;
      fn();
    }
  });

  async function nextLine(timeoutMs = 15000): Promise<string> {
    if (queue.length > 0) return queue.shift() as string;
    return await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("SMTP timeout while waiting for server response"));
      }, timeoutMs);
      resolver = () => {
        clearTimeout(timeout);
        resolve(queue.shift() as string);
      };
    });
  }

  async function readResponse(expected?: number[]) {
    const lines: string[] = [];
    while (true) {
      const line = await nextLine();
      lines.push(line);
      const match = line.match(/^(\d{3})([ -])(.*)$/);
      if (!match) continue;
      if (match[2] === " ") {
        const code = Number(match[1]);
        if (expected && !expected.includes(code)) {
          throw new Error(`SMTP unexpected response ${code}: ${lines.join(" | ")}`);
        }
        return { code, lines } satisfies SmtpResponse;
      }
    }
  }

  return { readResponse };
}

async function writeLine(socket: SocketLike, line: string) {
  await new Promise<void>((resolve, reject) => {
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

  if (!host || !port || !user || !pass) {
    throw new Error("Missing Brevo SMTP environment variables");
  }
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid BREVO_PORT environment variable");
  }
  if (!sender) {
    throw new Error("Missing EMAIL_SENDER_EMAIL environment variable");
  }

  return { host, port, user, pass, sender, senderName };
}

export async function sendSmtpMail(input: MailInput) {
  const { host, port, user, pass, sender, senderName } = getMailConfig();

  const plainSocket = net.createConnection({ host, port });
  plainSocket.setTimeout(20000);
  plainSocket.on("timeout", () => plainSocket.destroy(new Error("SMTP socket timeout")));
  await new Promise<void>((resolve, reject) => {
    plainSocket.once("connect", () => resolve());
    plainSocket.once("error", (err) => reject(err));
  });

  let socket: SocketLike = plainSocket;
  const plainReader = createResponseReader(plainSocket);
  await plainReader.readResponse([220]);
  await writeLine(plainSocket, "EHLO ecblightforce.com");
  await plainReader.readResponse([250]);
  await writeLine(plainSocket, "STARTTLS");
  await plainReader.readResponse([220]);

  socket = tls.connect({
    socket: plainSocket,
    servername: host,
    rejectUnauthorized: true
  });
  socket.setTimeout(20000);
  socket.on("timeout", () => socket.destroy(new Error("SMTP TLS timeout")));
  await new Promise<void>((resolve, reject) => {
    socket.once("secureConnect", () => resolve());
    socket.once("error", (err) => reject(err));
  });

  const reader = createResponseReader(socket);
  await writeLine(socket, "EHLO ecblightforce.com");
  await reader.readResponse([250]);
  await writeLine(socket, "AUTH LOGIN");
  await reader.readResponse([334]);
  await writeLine(socket, toBase64(user));
  await reader.readResponse([334]);
  await writeLine(socket, toBase64(pass));
  await reader.readResponse([235]);
  await writeLine(socket, `MAIL FROM:<${sender}>`);
  await reader.readResponse([250]);
  await writeLine(socket, `RCPT TO:<${input.to}>`);
  await reader.readResponse([250, 251]);
  await writeLine(socket, "DATA");
  await reader.readResponse([354]);

  const data = [
    `From: ${senderName} <${sender}>`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    sanitizeSmtpData(input.html),
    "."
  ].join("\r\n");

  await new Promise<void>((resolve, reject) => {
    socket.write(`${data}\r\n`, (err) => (err ? reject(err) : resolve()));
  });
  await reader.readResponse([250]);
  await writeLine(socket, "QUIT");
  await reader.readResponse([221]).catch(() => null);

  await new Promise<void>((resolve) => {
    socket.end(() => resolve());
  });
}
