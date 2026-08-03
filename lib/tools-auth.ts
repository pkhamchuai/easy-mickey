import type { NextRequest } from "next/server";

export function toolsAuthorized(req: NextRequest) {
  const token = req.headers.get("x-tools-token") ?? "";
  const allowed = (process.env.TOOLS_TOKENS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.length > 0 && allowed.includes(token);
}

