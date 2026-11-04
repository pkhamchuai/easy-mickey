import { NextRequest, NextResponse } from "next/server";
import { toolsAuthorized } from "@/lib/tools-auth";
import { parsePrediction } from "@/lib/ge-prediction";
import { readPrediction, savePrediction } from "@/lib/ge-prediction-store";

export const dynamic = "force-dynamic";
const MAX_BYTES = 256 * 1024;

export async function GET() {
  try { return NextResponse.json(await readPrediction(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "โหลดผลคาดการณ์ไม่สำเร็จ" }, { status: 503 }); }
}

export async function PUT(req: NextRequest) {
  if (!toolsAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let prediction;
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new Error("ไม่พบไฟล์");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 256 KB" }, { status: 413 });
      }
      chunks.push(value);
    }
    prediction = parsePrediction(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? "ไฟล์ JSON ไม่ถูกต้อง" : (error as Error).message }, { status: 400 });
  }
  try {
    await savePrediction(prediction);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าที่เก็บข้อมูลแล้วลองใหม่" }, { status: 500 });
  }
}
