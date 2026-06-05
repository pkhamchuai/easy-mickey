import { NextRequest, NextResponse } from "next/server";

function authorized(req: NextRequest) {
  const token = req.headers.get("x-tools-token") ?? "";
  const allowed = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(token);
}

function decodeEntities(str: string) {
  return str.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
}

export async function GET(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const html = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; bot)" },
  }).then((r) => r.text());

  const decoded = decodeEntities(html);

  // Member name from first <b> inside post-card
  const memberMatch = decoded.match(/post-card[^>]*>[\s\S]*?<b>([^<]+)<\/b>/);
  const member = memberMatch ? memberMatch[1].trim() : "Unknown";

  // Post ID from URL
  const postId = url.split("/").filter(Boolean).pop() ?? "";

  // Content images only
  const matches = [...html.matchAll(/https:\/\/img\.bnk48cdn\.net\/content\/[^"]+\.jpg/g)];
  const images = [...new Set(matches.map((m) => m[0]))];

  return NextResponse.json({ images, member, postId });
}
