import type { Metadata } from "next";
import Link from "next/link";
import { DrawingBoard } from "@/components/DrawingBoard";

export const metadata: Metadata = {
  title: "กระดานวาดรูป — Easy Mickey",
  description: "กระดานวาดรูปง่าย ๆ พร้อมตัวเลือกสี ขนาดพู่กัน และ opacity",
};

export default function DrawPage() {
  return (
    <main
      className="min-h-screen bg-[#0a0a12] px-3 py-6 sm:px-5 sm:py-9"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 45% at 85% 0%, rgba(34,211,238,0.12) 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400/60">
              Creative Space
            </p>
            <h1 className="mt-1 bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              กระดานวาดรูป
            </h1>
            <p className="mt-1 text-sm text-[#9896b0]">
              วาดไอเดียได้ทันทีด้วยเมาส์ ปากกา หรือปลายนิ้ว
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#2a2a3d] bg-[#13131e] px-4 py-2 text-sm text-[#aaa8bc] transition hover:border-cyan-500/30 hover:text-cyan-200"
          >
            ← กลับหน้าหลัก
          </Link>
        </header>

        <DrawingBoard />
      </div>
    </main>
  );
}
