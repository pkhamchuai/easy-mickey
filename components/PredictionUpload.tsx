"use client";

import { useState } from "react";
import { parsePrediction, type Prediction } from "@/lib/ge-prediction";
import { PredictionResults } from "@/components/PredictionResults";

export function PredictionUpload({ token, storage }: { token: string; storage: string }) {
  const [preview, setPreview] = useState<Prediction | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function select(file?: File) {
    setPreview(null); setError(""); setSaved(false);
    if (!file) return;
    if (file.size > 256 * 1024) { setError("ไฟล์ต้องมีขนาดไม่เกิน 256 KB"); return; }
    setBusy(true);
    try { setPreview(parsePrediction(JSON.parse(await file.text()))); }
    catch (error) { setError(error instanceof SyntaxError ? "ไฟล์ JSON ไม่ถูกต้อง" : (error as Error).message); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!preview) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/ge-prediction", {
        method: "PUT", headers: { "Content-Type": "application/json", "x-tools-token": token },
        body: JSON.stringify(preview),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "บันทึกไม่สำเร็จ");
      setSaved(true);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-5">
      <h2 className="text-lg font-semibold text-white">คาดการณ์คะแนนโหวต GE2026</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#9896b0]">เลือกไฟล์ JSON ที่ export จาก bnk48-ge4-repo ตรวจตัวอย่าง แล้วกดเผยแพร่เพื่ออัปเดตหน้าเว็บทันที</p>
      <p className="mt-2 text-xs text-cyan-200">ที่เก็บข้อมูล: {storage === "local" ? "ไฟล์ในเครื่อง (สำหรับพัฒนา)" : `ฐานข้อมูล ${storage}`}</p>
      <label className="mt-5 block text-sm text-white">
        ไฟล์ผลคาดการณ์ (.json)
        <input type="file" accept=".json,application/json" disabled={busy} onChange={event => void select(event.target.files?.[0])} className="mt-2 block w-full text-sm text-[#9896b0] file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:text-cyan-200 disabled:opacity-50" />
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {preview && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy || saved} onClick={() => void publish()} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-[#0a0a12] disabled:opacity-50">{busy ? "กำลังบันทึก…" : saved ? "เผยแพร่แล้ว" : "เผยแพร่ผลคาดการณ์"}</button>
            <a href="/ge-2026/prediction" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-200 underline">เปิดหน้าผลคาดการณ์ ↗</a>
          </div>
          {saved && <p role="status" className="mt-3 text-sm text-[#7de2c3]">อัปเดตข้อมูลแล้ว หน้าเว็บจะแสดงผลใหม่โดยไม่ต้อง deploy ซ้ำ</p>}
          <details className="mt-5" open>
            <summary className="cursor-pointer text-sm text-[#9896b0]">ตัวอย่างก่อนเผยแพร่ · {preview.members.length} เมมเบอร์</summary>
            <PredictionResults prediction={preview} />
          </details>
        </div>
      )}
    </section>
  );
}
