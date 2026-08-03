import { NextRequest, NextResponse } from "next/server";
import {
  readSongMatchFeedback,
  songMatchDatabaseConfigured,
  writeSongMatchFeedback,
} from "@/lib/song-match/db";
import type {
  SongComparison,
  SongMatchFeedbackResult,
  SongMatchFeedbackSubmission,
} from "@/lib/song-match/types";
import { toolsAuthorized } from "@/lib/tools-auth";

export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[0-9a-f-]{36}$/i;

function validComparison(value: unknown): value is SongComparison {
  if (!value || typeof value !== "object") return false;
  const comparison = value as Partial<SongComparison>;
  const validSongs = typeof comparison.songA === "string" && comparison.songA.length <= 160 &&
    typeof comparison.songB === "string" && comparison.songB.length <= 160 &&
    comparison.songA !== comparison.songB;
  if (!validSongs) return false;

  const outcome = comparison.outcome ?? "pick";
  if (outcome === "pick") return comparison.winner === comparison.songA || comparison.winner === comparison.songB;
  if (outcome === "tie" || outcome === "neither") return comparison.winner === null;
  return false;
}

function validResult(value: unknown): value is SongMatchFeedbackResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<SongMatchFeedbackResult>;
  return typeof result.memberId === "string" && result.memberId.length <= 160 &&
    typeof result.score === "number" && Number.isFinite(result.score) &&
    result.score >= 0 && result.score <= 1;
}

function parseSubmission(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid feedback");
  const input = value as Partial<SongMatchFeedbackSubmission>;
  if (!input.sessionId || !SESSION_ID_PATTERN.test(input.sessionId)) throw new Error("Invalid session");
  if (!Number.isSafeInteger(input.catalogVersion) || Number(input.catalogVersion) < 1) throw new Error("Invalid catalog version");
  if (input.mode !== "quick" && input.mode !== "detailed") throw new Error("Invalid game mode");
  if (!Number.isInteger(input.rating) || Number(input.rating) < 1 || Number(input.rating) > 5) throw new Error("Invalid rating");
  if (!Number.isInteger(input.questionCount) || Number(input.questionCount) < 1 || Number(input.questionCount) > 500) throw new Error("Invalid question count");
  if (!Number.isInteger(input.songCount) || Number(input.songCount) < 2 || Number(input.songCount) > 500) throw new Error("Invalid song count");
  if (!Number.isInteger(input.memberCount) || Number(input.memberCount) < 1 || Number(input.memberCount) > 500) throw new Error("Invalid member count");
  if (!Array.isArray(input.comparisons) || input.comparisons.length !== input.questionCount || !input.comparisons.every(validComparison)) throw new Error("Invalid comparisons");
  if (!Array.isArray(input.results) || input.results.length < 1 || input.results.length > 5 || !input.results.every(validResult)) throw new Error("Invalid results");

  return {
    sessionId: input.sessionId,
    catalogVersion: Number(input.catalogVersion),
    mode: input.mode,
    questionCount: Number(input.questionCount),
    rating: Number(input.rating),
    songCount: Number(input.songCount),
    memberCount: Number(input.memberCount),
    comparisons: input.comparisons,
    results: input.results,
  };
}

export async function POST(req: NextRequest) {
  if (!songMatchDatabaseConfigured()) {
    return NextResponse.json({ error: "Feedback database is not configured" }, { status: 503 });
  }

  try {
    const feedback = parseSubmission(await req.json());
    await writeSongMatchFeedback(feedback);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "บันทึก Feedback ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  if (!toolsAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await readSongMatchFeedback());
  } catch (error) {
    const message = error instanceof Error ? error.message : "โหลด Feedback ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
