import Link from "next/link";
import { kv } from "@vercel/kv";
import fallback from "@/data/tweet-templates.json";

type Template = { id: string; label: string; text: string };

async function getTemplates(): Promise<Template[]> {
  try {
    const data = await kv.get<Template[]>("tweet-templates-public");
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export const metadata = {
  title: "เลือกข้อความโพสต์ — Easy Mickey",
};

export default async function TweetsPage() {
  const templates = await getTemplates();
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
            เลือกข้อความโพสต์
          </h1>
          <p className="mt-1 text-sm text-[#6a6880]">
            คลิกที่ข้อความเพื่อโพสต์บน X
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-3 px-4 pb-16 pt-4">
        {templates.map((t) => {
          const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.text)}`;
          return (
            <a
              key={t.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 rounded-2xl border border-[#2a2a3d] bg-[#13131e] p-4 transition-all hover:border-cyan-500/40 hover:bg-[#0d1a1f] active:scale-[0.98]"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#6a6880]">
                  {t.label}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#f0eff8]">
                  {t.text}
                </p>
              </div>
              <span className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/30 px-3 py-1.5 text-xs font-medium text-cyan-300">
                <XIcon />
                โพสต์
              </span>
            </a>
          );
        })}
      </div>
    </main>
  );
}
