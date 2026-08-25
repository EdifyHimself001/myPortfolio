import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const rateBuckets = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.reset < now) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleContact(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  if (asString(payload.company) !== "") {
    return json({ ok: true }, 200);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return json(
      { ok: false, error: "Too many messages sent recently. Please try again later." },
      429
    );
  }

  const name = asString(payload.name).trim();
  const email = asString(payload.email).trim();
  const subject = asString(payload.subject).trim();
  const message = asString(payload.message).trim();

  const errors = [];
  if (name.length < 2 || name.length > 120)
    errors.push("Name must be between 2 and 120 characters.");
  if (!EMAIL_RE.test(email)) errors.push("A valid email address is required.");
  if (subject.length < 3 || subject.length > 200)
    errors.push("Subject must be between 3 and 200 characters.");
  if (message.length < 20 || message.length > 5000)
    errors.push("Message must be between 20 and 5000 characters.");

  if (errors.length > 0) {
    return json({ ok: false, error: errors.join(" ") }, 400);
  }

  if (!RESEND_API_KEY || !CONTACT_EMAIL) {
    console.warn(
      "[contact] RESEND_API_KEY or CONTACT_EMAIL missing — set them in .env to enable the form."
    );
    return json(
      { ok: false, error: "Contact form is not configured on this server." },
      503
    );
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: `${name} <${email}>`,
      subject: `[Portfolio] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return json(
        { ok: false, error: "Failed to send your message. Please try again." },
        502
      );
    }
    return json({ ok: true }, 200);
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return json(
      { ok: false, error: "Unexpected server error. Please try again." },
      500
    );
  }
}

async function serveFile(res, filePath, status = 200) {
  const data = await readFile(filePath);
  res.writeHead(status, {
    "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (url.pathname === "/api/contact") {
      if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Method not allowed." }));
        return;
      }
      const body = await new Promise((resolve) => {
        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", () => resolve(raw));
      });
      const fakeRequest = new Request("http://local/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", ...req.headers },
        body,
      });
      const response = await handleContact(fakeRequest);
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(await response.text());
      return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = normalize(join(DIST, pathname));

    if (!filePath.startsWith(normalize(DIST + sep))) throw new Error("forbidden");

    await stat(filePath);
    await serveFile(res, filePath);
  } catch (err) {
    if (err?.code === "ENOENT") {
      try {
        await serveFile(res, join(DIST, "404.html"), 404);
      } catch {
        res.writeHead(500);
        res.end("dist/client not found — run `npm run build` first.");
      }
      return;
    }
    res.writeHead(err?.message === "forbidden" ? 403 : 500);
    res.end("Server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
  console.log(`Serving static files from ${DIST}`);
  console.log(
    RESEND_API_KEY && CONTACT_EMAIL
      ? "Contact form: ENABLED"
      : "Contact form: NOT CONFIGURED (set RESEND_API_KEY and CONTACT_EMAIL in .env)"
  );
});