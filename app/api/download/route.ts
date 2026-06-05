import { NextRequest, NextResponse } from "next/server";

function authorized(req: NextRequest) {
  const token = req.headers.get("x-tools-token") ?? "";
  const allowed = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(token);
}

export async function GET(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; bot)" },
  });

  if (!res.ok)
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await res.arrayBuffer();

  let filename = "download";
  try {
    const path = new URL(url).pathname;
    filename = path.split("/").pop() || "download";
  } catch {}

  return new NextResponse(buffer, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
