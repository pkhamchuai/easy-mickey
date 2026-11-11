import { NextRequest, NextResponse } from "next/server";
import { incrementPageViews } from "@/lib/page-views-store";

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const page = request.nextUrl.searchParams.get("page");
  if (page !== "home" && page !== "prediction") {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  try {
    const views = await incrementPageViews(page);
    return NextResponse.json({ views }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to record page view", error);
    return NextResponse.json({ error: "บันทึกยอดเข้าชมไม่สำเร็จ" }, { status: 503 });
  }
}
