import { NextResponse } from "next/server";

// GET reports credit status, so it must never be cached
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ORSHOT = "https://api.orshot.com/v1";

const DEVICES: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};

const LIMIT_CODES = new Set(["free_monthly_credits_exhausted", "api_key_paused"]);
const LIMIT_TEXT = /consumed all requests|free credits|monthly render limit|subscription inactive|insufficient credits/i;

// Best-effort per-IP throttle so strangers can't burn your monthly credits.
// (Serverless instances don't share memory, so treat this as a speed bump, not a guarantee.)
const hits = new Map<string, { n: number; t: number }>();
function throttled(ip: string) {
  const now = Date.now();
  if (hits.size > 2000) hits.clear();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 5;
}

function cleanUrl(input: unknown): string | null {
  let s = String(input ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return null;
    if (h.startsWith("[") || !h.includes(".")) return null;
    if (/^(0\.|10\.|127\.|169\.254\.|192\.168\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function isLimit(status: number, data: any) {
  const msg = String(data?.message ?? data?.error ?? "");
  if (data?.code === "rate_limit_exceeded") return false;
  if (status === 402) return true;
  if (LIMIT_CODES.has(data?.code)) return true;
  return (status === 403 || status === 429) && LIMIT_TEXT.test(msg);
}

export async function GET() {
  const key = process.env.ORSHOT_API_KEY;
  if (!key) return NextResponse.json({ configured: false, available: false });

  try {
    const res = await fetch(`${ORSHOT}/me`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (isLimit(res.status, data)) return NextResponse.json({ configured: true, available: false });
    } else {
      const rc = data?.plan?.render_credits ?? data?.data?.plan?.render_credits;
      if (rc && typeof rc.remaining === "number") {
        return NextResponse.json({ configured: true, available: rc.remaining > 0, remaining: rc.remaining, limit: rc.limit });
      }
    }
  } catch {}
  // Unknown: let the first capture decide
  return NextResponse.json({ configured: true, available: true });
}

export async function POST(req: Request) {
  const key = process.env.ORSHOT_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Website capture isn't set up yet.", code: "not_configured" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) {
    return NextResponse.json({ error: "Too many captures. Wait a minute and try again.", code: "rate_limited" }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request.", code: "bad_request" }, { status: 400 });
  }

  const url = cleanUrl(body?.url);
  if (!url) {
    return NextResponse.json({ error: "Enter a valid public website address.", code: "invalid_url" }, { status: 400 });
  }
  const device = DEVICES[body?.device] ?? DEVICES.desktop;
  const delay = Math.min(5000, Math.max(0, Number(body?.delay) || 0));

  let res: Response;
  try {
    res = await fetch(`${ORSHOT}/generate/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      cache: "no-store",
      body: JSON.stringify({
        templateId: "website-screenshot",
        response: { format: "webp", type: "base64" },
        modifications: {
          websiteUrl: url,
          fullCapture: Boolean(body?.fullPage),
          delay,
          width: device.width,
          height: device.height,
        },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the screenshot service.", code: "failed" }, { status: 502 });
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = String(data?.message ?? data?.error ?? `Screenshot service error (${res.status})`);
    if (isLimit(res.status, data)) return NextResponse.json({ error: msg, code: "limit_reached" }, { status: 402 });
    if (res.status === 429) {
      return NextResponse.json({ error: "Too many captures right now. Try again in a minute.", code: "rate_limited" }, { status: 429 });
    }
    return NextResponse.json({ error: "Could not capture that website. Check the address and try again.", detail: msg, code: "failed" }, { status: 502 });
  }

  const image = data?.data?.content;
  if (typeof image !== "string" || !image.startsWith("data:image")) {
    return NextResponse.json({ error: "The screenshot service returned no image.", code: "failed" }, { status: 502 });
  }
  return NextResponse.json({ image });
}
