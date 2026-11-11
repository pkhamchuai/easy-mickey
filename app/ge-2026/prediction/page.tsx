import type { Metadata } from "next";
import Link from "next/link";
import { PredictionResults } from "@/components/PredictionResults";
import { readPrediction } from "@/lib/ge-prediction-store";
import { PageViewCounter } from "@/components/PageViewCounter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "คาดการณ์คะแนนโหวต GE2026 — Easy Mickey" };

export default async function PredictionPage() {
  let prediction = null;
  let failed = false;
  try { prediction = await readPrediction(); } catch { failed = true; }
  return (
    <main className="min-h-screen bg-[#0a0a12] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-[#9896b0] hover:text-white">‹ กลับหน้าแรก</Link>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-cyan-300/70">GE2026 · Prediction</p>
        <h1 className="mt-2 text-2xl font-bold text-white">คาดการณ์คะแนนโหวต GE2026</h1>
        {prediction ? <PredictionResults prediction={prediction} /> : (
          <p className="mt-6 rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-5 text-sm text-[#9896b0]">
            {failed ? "โหลดผลคาดการณ์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : "ยังไม่มีผลคาดการณ์ที่เผยแพร่"}
          </p>
        )}
        <footer className="mt-8 border-t border-white/5 pt-6">
          <PageViewCounter page="prediction" />
        </footer>
      </div>
    </main>
  );
}
