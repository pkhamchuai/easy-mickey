import type { Metadata } from "next";
import { DrawingPageLayout } from "@/components/DrawingPageLayout";

export const metadata: Metadata = {
  title: "กระดานวาดรูป — Easy Mickey",
  description: "กระดานวาดรูปง่าย ๆ พร้อมตัวเลือกสี ขนาดพู่กัน และ opacity",
};

export default function DrawPage() {
  return <DrawingPageLayout mode="normal" />;
}
