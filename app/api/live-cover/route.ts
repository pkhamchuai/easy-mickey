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

function sanitize(str: string) {
  // Remove emojis (common ranges) and keep alphanumeric + Thai + spaces
  return str
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[^\w฀-๿\s]/g, "")
    .trim();
}

function buildFilename(html: string, pageUrl: string, ext: string) {
  const decoded = decodeEntities(html);

  // Member name
  const memberMatch = decoded.match(/<p class="title">\s*([^<]+?)\s*<\/p>/);
  const member = memberMatch ? memberMatch[1].trim() : "Unknown";

  // Date/time — value is now decoded to "+07:00"
  const dateMatch = decoded.match(
    /data-value="(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):[^"]*\+07/
  );
  let datetime = "00000000-0000";
  if (dateMatch) {
    const [, mm, dd, yyyy, hh, min] = dateMatch;
    datetime = `${yyyy}${mm}${dd}-${hh}${min}`;
  }

  // Live name from description — strip emojis/specials, keep Thai
  const descMatch = decoded.match(/<p class="description">\s*([^<]+?)\s*<\/p>/);
  const liveName = descMatch ? sanitize(descMatch[1]) : "";

  // URL ending number
  const urlNum = pageUrl.split("/").filter(Boolean).pop() ?? "";

  const parts = [member, datetime, liveName || "live", urlNum];
  return parts.join("_") + "." + ext;
}

export async function GET(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const html = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; bot)" },
  }).then((r) => r.text());

  const match = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!match) return NextResponse.json({ error: "No image found" }, { status: 404 });

  const imageUrl = match[1];
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const buffer = await imageRes.arrayBuffer();
  const filename = buildFilename(html, url, ext);

  // Use RFC 5987 encoding so Thai characters survive in the header
  const asciiFilename = filename.replace(/[^\x20-\x7E]/g, "_");
  const encodedFilename = encodeURIComponent(filename);

  return new NextResponse(buffer, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
