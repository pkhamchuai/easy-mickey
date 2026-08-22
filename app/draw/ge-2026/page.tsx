import type { Metadata } from "next";
import { DrawingPageLayout } from "@/components/DrawingPageLayout";

export const metadata: Metadata = {
  title: "กระดานวาดรูป GE 2026 — Easy Mickey",
  description: "วาดรูปบนเทมเพลต BNK48 & CGM48 General Election 2026",
};

export default function Ge2026DrawPage() {
  return <DrawingPageLayout mode="ge2026" />;
}
