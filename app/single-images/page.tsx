import Link from "next/link";
import { SingleImagePicker } from "@/components/SingleImagePicker";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export const metadata = {
  title: "CGM48 Profile Image (half) — Easy Mickey",
};

export default function Single11Page() {
  return (
    <main className="min-h-screen bg-[#0a0a12]">
      <header
        className="px-4 pb-6 pt-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,211,238,0.10) 0%, transparent 70%), #0a0a12",
        }}
      >
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#9896b0] transition-colors hover:text-[#f0eff8]"
          >
            <BackIcon />
            กลับหน้าแรก
          </Link>
          <h1 className="text-2xl font-bold text-[#f0eff8]">
            CGM48 Profile Image (half)
          </h1>
          <p className="mt-1 text-sm text-[#6a6880]">
            Only current members
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <SingleImagePicker />
      </div>
    </main>
  );
}
