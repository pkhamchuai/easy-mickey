import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import publicFallback from "@/data/tweet-templates.json";
import staffFallback from "@/data/tweet-templates-staff.json";

const KEYS = {
  public: "tweet-templates-public",
  staff: "tweet-templates-staff",
} as const;

type TemplateType = keyof typeof KEYS;

function authorized(req: NextRequest) {
  const token = req.headers.get("x-tools-token") ?? "";
  const allowed = (process.env.TOOLS_TOKENS ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(token);
}

function parseType(req: NextRequest): TemplateType | null {
  const t = new URL(req.url).searchParams.get("type");
  return t === "public" || t === "staff" ? t : null;
}

export async function GET(req: NextRequest) {
  const type = parseType(req);
  if (!type)
    return NextResponse.json({ error: "Missing type" }, { status: 400 });

  try {
    const data = await kv.get(KEYS[type]);
    return NextResponse.json(data ?? (type === "public" ? publicFallback : staffFallback));
  } catch {
    return NextResponse.json(type === "public" ? publicFallback : staffFallback);
  }
}

export async function PUT(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = parseType(req);
  if (!type)
    return NextResponse.json({ error: "Missing type" }, { status: 400 });

  const body = await req.json();
  await kv.set(KEYS[type], body);
  return NextResponse.json({ ok: true });
}
