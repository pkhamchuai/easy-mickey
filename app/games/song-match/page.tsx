import type { Metadata } from "next";
import { TasteMatchGame } from "@/components/song-match/TasteMatchGame";

export const metadata: Metadata = {
  title: "คุณเป็นใครใน GE 2026 — Easy Mickey",
  description: "เลือกเพลงที่ชอบ แล้วค้นหาว่าคุณมีรสนิยมตรงกับเมมคนไหน",
};

export default function SongMatchGamePage() {
  return <TasteMatchGame />;
}
