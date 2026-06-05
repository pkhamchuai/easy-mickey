import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import fallback from "@/data/schedule.json";

const KV_KEY = "schedule";

function authorized(req: NextRequest) {
  const token = req.headers.get("x-tools-token") ?? "";
  const allowed = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(token);
}

export async function GET() {
  try {
    const data = await kv.get(KV_KEY);
    return NextResponse.json(data ?? fallback);
  } catch {
    return NextResponse.json(fallback);
  }
}

export async function PUT(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await kv.set(KV_KEY, body);
  return NextResponse.json({ ok: true });
}
