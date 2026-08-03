import { NextRequest, NextResponse } from "next/server";
import { normalizeCatalog, publicCatalog } from "@/lib/song-match/catalog";
import {
  fallbackCatalog,
  readSongMatchCatalog,
  songMatchDatabaseConfigured,
  writeSongMatchCatalog,
} from "@/lib/song-match/db";
import { toolsAuthorized } from "@/lib/tools-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const includeDrafts = new URL(req.url).searchParams.get("drafts") === "1";
  if (includeDrafts && !toolsAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stored = await readSongMatchCatalog();
    const catalog = stored ?? fallbackCatalog;
    return NextResponse.json(includeDrafts ? catalog : publicCatalog(catalog));
  } catch {
    return NextResponse.json(includeDrafts ? fallbackCatalog : publicCatalog(fallbackCatalog));
  }
}

export async function PUT(req: NextRequest) {
  if (!toolsAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!songMatchDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Connect Neon and set DATABASE_URL first." },
      { status: 503 },
    );
  }

  try {
    const catalog = normalizeCatalog(await req.json());
    const saved = await writeSongMatchCatalog(catalog);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save catalog";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

