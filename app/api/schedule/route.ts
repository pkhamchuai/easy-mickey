import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import fallback from "@/data/schedule.json";

const KV_KEY = "schedule";
const FILE_PATH = join(process.cwd(), "data", "schedule.json");

function kvConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function authorized(req: NextRequest) {
  const token = req.headers.get("x-tools-token") ?? "";
  const allowed = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(token);
}

export async function GET() {
  if (kvConfigured()) {
    try {
      const data = await kv.get(KV_KEY);
      return NextResponse.json(data ?? fallback);
    } catch {
      // fall through
    }
  }
  return NextResponse.json(fallback);
}

export async function PUT(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (kvConfigured()) {
      await kv.set(KV_KEY, body);
    } else {
      await writeFile(FILE_PATH, JSON.stringify(body, null, 2));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
